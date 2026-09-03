use reqwest::{Client, RequestBuilder};
use serde::Deserialize;
use std::time::Duration;

const OPENCODE_SESSION_HEADER: &str = "x-opencode-session";
const OPENCODE_USER_AGENT: &str = concat!("WintarotAI/", env!("CARGO_PKG_VERSION"));

#[derive(Deserialize)]
struct ModelList {
    data: Vec<ModelData>,
}

#[derive(Deserialize)]
struct ModelData {
    id: String,
}

const LM_STUDIO_MODELS: &[&str] = &[
    "unsloth/gemma-4-31b-it",
    "unsloth/gemma-4-26b-a4b-it",
    "qwen/qwen3.5-35b-a3b",
    "qwen3.5-27b",
];

const GOOGLE_MODELS: &[&str] = &[
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it",
];

const OPENCODE_GO_MODELS: &[&str] = &[
    "glm-5.2",
    "glm-5.1",
    "kimi-k2.7-code",
    "kimi-k2.6",
    "mimo-v2.5",
    "mimo-v2.5-pro",
    "minimax-m3",
    "minimax-m2.7",
    "qwen3.7-max",
    "qwen3.7-plus",
    "qwen3.6-plus",
    "deepseek-v4-pro",
    "deepseek-v4-flash",
];

const ZEN_MODELS: &[&str] = &[
    // Free models use the OpenAI-compatible Chat Completions endpoint.
    // Keep these first so a keyless setup defaults to a free model.
    "mimo-v2.5-free",
    "big-pickle",
    "ling-3.0-flash-fin-free",
    "nemotron-3-ultra-free",
    "nemotron-3.5-lightning-free",
    "glm-5.2",
    "glm-5.1",
    "kimi-k2.7-code",
    "kimi-k2.6",
    "mimo-v2.5",
    "mimo-v2.5-pro",
    "minimax-m3",
    "minimax-m2.7",
    "qwen3.7-max",
    "qwen3.7-plus",
    "qwen3.6-plus",
    "deepseek-v4-pro",
    "deepseek-v4-flash",
];

const CEREBRAS_MODELS: &[&str] = &["gemma-4-31b", "gpt-oss-120b", "zai-glm-4.7"];

/// A missing API key means that no Authorization header should be sent.
///
/// This is required for OpenCode Zen's free models. Sending a placeholder
/// token such as "public" or "lm-studio" makes Zen reject the request as an
/// invalid API key.
pub fn should_send_bearer_auth(api_key: &str) -> bool {
    !api_key.trim().is_empty()
}

pub fn add_opencode_go_headers(
    request: RequestBuilder,
    provider: &str,
    session_id: &str,
) -> RequestBuilder {
    if provider != "OpenCode Go" || session_id.trim().is_empty() {
        return request;
    }

    request
        .header(OPENCODE_SESSION_HEADER, session_id)
        .header(reqwest::header::USER_AGENT, OPENCODE_USER_AGENT)
}

pub async fn fetch_models_impl(
    api_base: &str,
    api_key: &str,
    provider: &str,
    opencode_session_id: &str,
) -> Result<Vec<String>, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .unwrap();
    let url = if api_base.ends_with('/') {
        format!("{}models", api_base)
    } else {
        format!("{}/models", api_base)
    };

    let fallback_models = if api_base.contains("googleapis.com") {
        GOOGLE_MODELS.iter().map(|&s| s.to_string()).collect()
    } else if api_base.contains("opencode.ai/zen/go") {
        OPENCODE_GO_MODELS.iter().map(|&s| s.to_string()).collect()
    } else if api_base.contains("opencode.ai/zen") {
        ZEN_MODELS.iter().map(|&s| s.to_string()).collect()
    } else if api_base.contains("cerebras.ai") {
        CEREBRAS_MODELS.iter().map(|&s| s.to_string()).collect()
    } else {
        LM_STUDIO_MODELS.iter().map(|&s| s.to_string()).collect()
    };

    let mut request = add_opencode_go_headers(client.get(&url), provider, opencode_session_id);
    if should_send_bearer_auth(api_key) {
        request = request.bearer_auth(api_key.trim());
    }

    match request.send().await {
        Ok(res) => {
            if res.status().is_success() {
                if let Ok(model_list) = res.json::<ModelList>().await {
                    let mut models: Vec<String> =
                        model_list.data.into_iter().map(|model| model.id).collect();
                    models.sort();
                    if !models.is_empty() {
                        return Ok(models);
                    }
                }
            }
            Ok(fallback_models)
        }
        Err(_) => Ok(fallback_models),
    }
}

#[cfg(test)]
mod tests {
    use super::{add_opencode_go_headers, should_send_bearer_auth};
    use reqwest::Client;

    #[test]
    fn does_not_authenticate_blank_keys() {
        assert!(!should_send_bearer_auth(""));
        assert!(!should_send_bearer_auth("   "));
    }

    #[test]
    fn authenticates_non_blank_keys() {
        assert!(should_send_bearer_auth("sk-test"));
    }

    #[test]
    fn adds_opencode_session_and_user_agent_only_for_opencode_go() {
        let request = add_opencode_go_headers(
            Client::new().get("https://opencode.ai/zen/go/v1/models"),
            "OpenCode Go",
            "ses_test-session",
        )
        .build()
        .unwrap();

        assert_eq!(
            request
                .headers()
                .get("x-opencode-session")
                .and_then(|value| value.to_str().ok()),
            Some("ses_test-session")
        );
        assert_eq!(
            request
                .headers()
                .get(reqwest::header::USER_AGENT)
                .and_then(|value| value.to_str().ok()),
            Some(concat!("WintarotAI/", env!("CARGO_PKG_VERSION")))
        );
    }

    #[test]
    fn does_not_add_opencode_headers_to_other_providers() {
        let request = add_opencode_go_headers(
            Client::new().get("http://localhost:1234/v1/models"),
            "LM Studio",
            "ses_test-session",
        )
        .build()
        .unwrap();

        assert!(request.headers().get("x-opencode-session").is_none());
        assert!(request.headers().get(reqwest::header::USER_AGENT).is_none());
    }
}
