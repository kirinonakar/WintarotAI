#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod credentials;
mod generator;
mod paths;

use crate::paths::{
    get_base_dir, novel_metadata_filename, output_dir, output_json_dir, validate_novel_filename,
};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::ipc::Channel;
use tauri::{Manager, State};

pub struct AppState {
    pub stop_flag: Arc<AtomicBool>,
}

fn normalize_api_key(value: &str) -> String {
    let mut key = value.trim();

    loop {
        let Some(prefix) = key.get(..6) else {
            break;
        };
        if !prefix.eq_ignore_ascii_case("bearer") {
            break;
        }

        let rest = key.get(6..).unwrap_or_default();
        if !rest.is_empty() && !rest.chars().next().is_some_and(char::is_whitespace) {
            break;
        }

        key = rest.trim_start();
    }

    key.trim().to_string()
}

fn with_request_api_key(api_key: &str) -> String {
    normalize_api_key(api_key)
}

#[tauri::command]
fn stop_generation(state: State<'_, AppState>) {
    println!("[Backend] Stop requested");
    state.stop_flag.store(true, Ordering::Relaxed);
}

#[tauri::command]
async fn fetch_models(api_base: String, api_key: Option<String>) -> Result<Vec<String>, String> {
    println!("[Backend] Fetching models from: {}", api_base);
    let key = api_key.unwrap_or_default();
    let res = generator::fetch_models_impl(&api_base, &key).await;
    match &res {
        Ok(models) => println!("[Backend] Found {} models", models.len()),
        Err(e) => println!("[Backend] Fetch error: {}", e),
    }
    res
}

#[derive(serde::Deserialize)]
pub struct GenerationParams {
    api_base: String,
    model_name: String,
    api_key: String,
    system_prompt: String,
    prompt: String,
    temperature: f32,
    top_p: f32,
    repetition_penalty: f32,
    max_tokens: u32,
}

#[tauri::command]
async fn generate_plot(
    state: State<'_, AppState>,
    params: GenerationParams,
    on_event: Channel<generator::StreamEvent>,
) -> Result<(), String> {
    state.stop_flag.store(false, Ordering::Relaxed);
    let mut params = params;
    params.api_key = with_request_api_key(&params.api_key);
    generator::generate_plot_stream(
        &params.api_base,
        &params.model_name,
        &params.api_key,
        &params.system_prompt,
        &params.prompt,
        params.temperature,
        params.top_p,
        params.repetition_penalty,
        params.max_tokens,
        on_event,
        state.stop_flag.clone(),
    )
    .await
}
#[tauri::command]
fn set_window_theme(app_handle: tauri::AppHandle, theme: String) -> Result<(), String> {
    let preferred_theme = match theme.to_ascii_lowercase().as_str() {
        "dark" => Some(tauri::utils::Theme::Dark),
        "light" => Some(tauri::utils::Theme::Light),
        "system" | "auto" => None,
        other => return Err(format!("Unsupported theme: {}", other)),
    };

    let main_window = app_handle
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    main_window
        .set_theme(preferred_theme)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_output_folder(app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    let base = get_base_dir();
    let mut path = base.clone();
    path.push("output");

    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }

    // Convert to absolute path to ensure opening works correctly
    let absolute_path = fs::canonicalize(&path).unwrap_or(path);
    let path_str = absolute_path.to_string_lossy().to_string();

    // Strip Windows UNC prefix (\\?\) which can cause Explorer UI glitches
    let clean_path = if path_str.starts_with(r"\\?\") {
        path_str[4..].to_string()
    } else {
        path_str
    };

    println!("[Backend] Opening output folder: {:?}", clean_path);
    app_handle
        .opener()
        .open_path(clean_path, None::<String>)
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn gemini_txt_candidate_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(cwd) = std::env::current_dir() {
        paths.push(cwd.join("gemini.txt"));
    }

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let exe_gemini_path = exe_dir.join("gemini.txt");
            if !paths.iter().any(|path| path == &exe_gemini_path) {
                paths.push(exe_gemini_path);
            }
        }
    }

    paths
}

fn load_legacy_gemini_txt_key() -> Result<Option<(PathBuf, String)>, String> {
    for path in gemini_txt_candidate_paths() {
        println!("[Backend] Checking API key file: {:?}", path);
        if !path.exists() {
            continue;
        }

        let key = fs::read_to_string(&path)
            .map(|s| normalize_api_key(&s))
            .map_err(|e| e.to_string())?;

        if !key.is_empty() {
            return Ok(Some((path, key)));
        }
    }

    Ok(None)
}

#[tauri::command]
fn load_api_key(provider: Option<String>) -> Result<String, String> {
    let provider = provider.unwrap_or_else(|| "Google".to_string());
    if provider == "Google" {
        if let Some((path, key)) = load_legacy_gemini_txt_key()? {
            println!(
                "[Backend] API key loaded from legacy gemini.txt and syncing to Credential Manager: {:?}",
                path
            );
            if let Err(err) = credentials::write_google_api_key(&key) {
                eprintln!(
                    "[Backend] Failed to sync gemini.txt API key to Credential Manager: {}",
                    err
                );
            }
            return Ok(key);
        }

        println!("[Backend] Loading Google API key from Windows Credential Manager");
        credentials::read_google_api_key().map(|key| {
            key.map(|value| normalize_api_key(&value))
                .unwrap_or_default()
        })
    } else if provider == "Ollama Cloud" {
        println!("[Backend] Loading Ollama Cloud API key from Windows Credential Manager");
        credentials::read_ollama_cloud_api_key().map(|key| {
            key.map(|value| normalize_api_key(&value))
                .unwrap_or_default()
        })
    } else if provider == "OpenCode Go" {
        println!("[Backend] Loading OpenCode Go API key from Windows Credential Manager");
        credentials::read_opencode_go_api_key().map(|key| {
            key.map(|value| normalize_api_key(&value))
                .unwrap_or_default()
        })
    } else if provider == "Zen" {
        println!("[Backend] Loading OpenCode Zen API key from Windows Credential Manager");
        credentials::read_zen_api_key().map(|key| {
            key.map(|value| normalize_api_key(&value))
                .unwrap_or_default()
        })
    } else if provider == "Cerebras" {
        println!("[Backend] Loading Cerebras API key from Windows Credential Manager");
        credentials::read_cerebras_api_key().map(|key| {
            key.map(|value| normalize_api_key(&value))
                .unwrap_or_default()
        })
    } else {
        Ok(String::new())
    }
}

#[tauri::command]
fn save_api_key(provider: Option<String>, api_key: String) -> Result<String, String> {
    let provider = provider.unwrap_or_else(|| "Google".to_string());
    let key = normalize_api_key(&api_key);

    if provider == "Google" {
        if key.is_empty() {
            credentials::delete_google_api_key()?;
            Ok(String::new())
        } else {
            credentials::write_google_api_key(&key)?;
            Ok(key)
        }
    } else if provider == "Ollama Cloud" {
        if key.is_empty() {
            credentials::delete_ollama_cloud_api_key()?;
            Ok(String::new())
        } else {
            credentials::write_ollama_cloud_api_key(&key)?;
            Ok(key)
        }
    } else if provider == "OpenCode Go" {
        if key.is_empty() {
            credentials::delete_opencode_go_api_key()?;
            Ok(String::new())
        } else {
            credentials::write_opencode_go_api_key(&key)?;
            Ok(key)
        }
    } else if provider == "Zen" {
        if key.is_empty() {
            credentials::delete_zen_api_key()?;
            Ok(String::new())
        } else {
            credentials::write_zen_api_key(&key)?;
            Ok(key)
        }
    } else if provider == "Cerebras" {
        if key.is_empty() {
            credentials::delete_cerebras_api_key()?;
            Ok(String::new())
        } else {
            credentials::write_cerebras_api_key(&key)?;
            Ok(key)
        }
    } else {
        Ok(String::new())
    }
}

#[tauri::command]
fn save_novel_state(
    filename: String,
    text_content: String,
    metadata_json: String,
) -> Result<(), String> {
    let filename = validate_novel_filename(&filename)?;
    let dir = output_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    let json_dir = output_json_dir();
    if !json_dir.exists() {
        fs::create_dir_all(&json_dir).map_err(|e| e.to_string())?;
    }

    let txt_path = dir.join(&filename);
    let json_path = json_dir.join(novel_metadata_filename(&filename));

    fs::write(&txt_path, text_content).map_err(|e| e.to_string())?;
    fs::write(&json_path, metadata_json).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_saved_novels() -> Result<Vec<String>, String> {
    let base = get_base_dir();
    let dir = base.join("output");
    println!("[Backend] Scanning novels in: {:?}", dir);
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if validate_novel_filename(name).is_ok() {
                    files.push(name.to_string());
                }
            }
        }
    }
    // Sort reverse to show latest first using numeric key
    files.sort_by_key(|f| {
        let re = regex::Regex::new(r"(?:novel|tarot)_([\d_]+)").unwrap();
        let val = re
            .captures(f)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().replace('_', ""))
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);
        std::cmp::Reverse(val)
    });
    Ok(files)
}

#[tauri::command]
fn load_novel(filename: String) -> Result<(String, String), String> {
    let filename = validate_novel_filename(&filename)?;
    let dir = output_dir();
    let txt_path = dir.join(&filename);
    let json_path = output_json_dir().join(novel_metadata_filename(&filename));
    let legacy_json_path = dir.join(novel_metadata_filename(&filename));

    println!("[Backend] Loading novel from: {:?}", txt_path);
    let txt_content = fs::read_to_string(txt_path).map_err(|e| e.to_string())?;

    let json_content = if json_path.exists() {
        fs::read_to_string(json_path).unwrap_or_default()
    } else if legacy_json_path.exists() {
        fs::read_to_string(legacy_json_path).unwrap_or_default()
    } else {
        String::new()
    };

    Ok((txt_content, json_content))
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            stop_flag: Arc::new(AtomicBool::new(false)),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fetch_models,
            generate_plot,
            stop_generation,
            set_window_theme,
            open_output_folder,
            save_novel_state,
            load_api_key,
            save_api_key,
            get_saved_novels,
            load_novel
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::normalize_api_key;

    #[test]
    fn normalize_api_key_strips_bearer_prefix_only() {
        assert_eq!(normalize_api_key("Bearer abc123"), "abc123");
        assert_eq!(normalize_api_key("bearer   abc123"), "abc123");
        assert_eq!(normalize_api_key("Bearer Bearer abc123"), "abc123");
        assert_eq!(normalize_api_key("Bearer"), "");
        assert_eq!(normalize_api_key("bearer-token"), "bearer-token");
    }
}
