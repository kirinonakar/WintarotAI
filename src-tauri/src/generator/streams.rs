use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use reqwest::Client;
use serde_json::{json, Value};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::timeout;

use super::text::clean_thought_tags;
use super::types::StreamEvent;

const STREAM_READ_TIMEOUT_SECS: u64 = 300;

fn stream_finish_reason(json: &Value) -> Option<String> {
    json["choices"][0]["finish_reason"]
        .as_str()
        .map(|s| s.to_string())
}

fn stream_completion_error(
    stage: &str,
    saw_done: bool,
    finish_reason: Option<&str>,
) -> Option<String> {
    if !saw_done {
        let reason = finish_reason.unwrap_or("disconnected");
        if reason != "stop" && reason != "length" {
            return Some(format!(
                "{} failed: Stream closed abruptly. (reason: {})",
                stage, reason
            ));
        }
    }
    None
}

pub async fn generate_plot_stream(
    api_base: &str,
    model_name: &str,
    api_key: &str,
    system_prompt: &str,
    prompt: &str,
    temperature: f32,
    top_p: f32,
    repetition_penalty: f32,
    max_tokens: u32,
    on_event: tauri::ipc::Channel<StreamEvent>,
    stop_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    let client = Client::builder().build().unwrap();
    let url = format!("{}/chat/completions", api_base.trim_end_matches('/'));

    let mut body_map = serde_json::Map::new();
    body_map.insert("model".to_string(), json!(model_name));
    body_map.insert(
        "messages".to_string(),
        json!([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]),
    );
    let mut temp = temperature;
    if model_name.to_ascii_lowercase().contains("kimi") {
        temp = 1.0;
    }
    body_map.insert("temperature".to_string(), json!(temp));
    body_map.insert("top_p".to_string(), json!(top_p));

    let mut final_max_tokens = max_tokens;
    if !api_base.contains("googleapis.com") {
        final_max_tokens = final_max_tokens.max(16384);
    } else {
        final_max_tokens = final_max_tokens.min(8192);
    }
    body_map.insert("max_tokens".to_string(), json!(final_max_tokens));
    body_map.insert("stream".to_string(), json!(true));

    if !api_base.contains("googleapis.com")
        && !api_base.contains("opencode.ai")
        && !api_base.contains("cerebras.ai")
    {
        body_map.insert("repetition_penalty".to_string(), json!(repetition_penalty));
    }

    if api_base.contains("opencode.ai") && model_name.to_ascii_lowercase().contains("deepseek") {
        body_map.insert("thinking".to_string(), json!({ "type": "disabled" }));
    }

    let request_body = Value::Object(body_map);

    let res = client
        .post(&url)
        .bearer_auth(api_key)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    if !status.is_success() {
        let err_json: Value = res.json().await.unwrap_or(json!({}));
        let err_msg = err_json["error"]["message"]
            .as_str()
            .or(err_json["message"].as_str())
            .unwrap_or("Unknown API error");
        return Err(format!("API Error ({}): {}", status, err_msg));
    }

    let mut stream = res.bytes_stream().eventsource();
    let mut full_text = String::new();
    let mut in_thinking = false;
    let mut thinking_tokens: u32 = 0;
    let mut count = 0;
    let read_timeout_duration = Duration::from_secs(STREAM_READ_TIMEOUT_SECS);
    let mut saw_done_marker = false;
    let mut terminal_finish_reason: Option<String> = None;

    loop {
        if stop_flag.load(Ordering::Relaxed) {
            break;
        }
        match timeout(read_timeout_duration, stream.next()).await {
            Ok(Some(Ok(evt))) => {
                let data = evt.data;
                if data.trim() == "[DONE]" {
                    saw_done_marker = true;
                    break;
                }

                if let Ok(json) = serde_json::from_str::<Value>(&data) {
                    if let Some(reason) = stream_finish_reason(&json) {
                        terminal_finish_reason = Some(reason);
                    }
                    let delta = &json["choices"][0]["delta"];
                    if let Some(reasoning) = delta["reasoning_content"].as_str() {
                        if !in_thinking {
                            full_text.push_str("<think>\n");
                            in_thinking = true;
                        }
                        full_text.push_str(reasoning);
                        thinking_tokens += 1;
                        count += 1;
                        if count % 5 == 0 {
                            let _ = on_event.send(StreamEvent::full(
                                clean_thought_tags(&full_text),
                                false,
                                None,
                                Some(format!("💭 Thinking...({} tokens)", thinking_tokens)),
                            ));
                        }
                    } else if let Some(content) = delta["content"].as_str() {
                        if !content.is_empty() {
                            // Detect inline <think> tags (Qwen3, GLM, etc.)
                            if content.contains("<think>") && !in_thinking {
                                in_thinking = true;
                            }
                            if in_thinking && content.contains("</think>") {
                                in_thinking = false;
                                // Immediately notify UI that thinking is done
                                let _ = on_event.send(StreamEvent::full(
                                    clean_thought_tags(&full_text),
                                    false,
                                    None,
                                    Some("⏳ Generating...".to_string()),
                                ));
                            }
                            full_text.push_str(content);
                            count += 1;
                            if in_thinking {
                                thinking_tokens += 1;
                                if count % 5 == 0 {
                                    let _ = on_event.send(StreamEvent::full(
                                        clean_thought_tags(&full_text),
                                        false,
                                        None,
                                        Some(format!("💭 Thinking...({} tokens)", thinking_tokens)),
                                    ));
                                }
                            } else if count % 5 == 0 {
                                let _ = on_event.send(StreamEvent::full(
                                    clean_thought_tags(&full_text),
                                    false,
                                    None,
                                    Some("⏳ Generating...".to_string()),
                                ));
                            }
                        }
                    }
                }
            }
            Ok(None) => break,
            Ok(Some(Err(e))) => {
                let e: eventsource_stream::EventStreamError<reqwest::Error> = e;
                let mut error_msg = e.to_string();
                if error_msg.contains("Failed to parse input at pos 0") {
                    error_msg.push_str("\n\n💡 [Hint] Model mismatch detected. Ensure LM Studio chat template is correctly set for models like Gemma 4.");
                }

                let _ = on_event.send(StreamEvent::full(
                    clean_thought_tags(&full_text),
                    true,
                    Some(error_msg),
                    None,
                ));
                return Ok(());
            }
            Err(_) => {
                let _ = on_event.send(StreamEvent::full(
                    clean_thought_tags(&full_text),
                    true,
                    Some(format!("Read Timeout: Server did not respond for {} minutes during plot generation.", STREAM_READ_TIMEOUT_SECS / 60)),
                    None,
                ));
                return Ok(());
            }
        }
    }

    if in_thinking {
        full_text.push_str("\n</think>\n");
    }

    if !stop_flag.load(Ordering::Relaxed) {
        if let Some(error_msg) = stream_completion_error(
            "Plot generation",
            saw_done_marker,
            terminal_finish_reason.as_deref(),
        ) {
            let _ = on_event.send(StreamEvent::full(
                clean_thought_tags(&full_text),
                true,
                Some(error_msg),
                None,
            ));
            return Ok(());
        }
    }

    let _ = on_event.send(StreamEvent::full(
        clean_thought_tags(&full_text),
        true,
        None,
        None,
    ));

    Ok(())
}
