use regex::Regex;
use std::sync::LazyLock;

static RE_THOUGHT_FULL: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<\|channel>thought.*?<channel\|>").unwrap());
static RE_THOUGHT_UNCLOSED: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<\|channel>thought.*$").unwrap());
static RE_THOUGHT_BLOCK: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<thought>.*?</thought>").unwrap());
static RE_THOUGHT_OPEN: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<thought>.*$").unwrap());
static RE_THINK_BLOCK: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<think>.*?</think>").unwrap());
static RE_THINK_OPEN: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?s)<think>.*$").unwrap());

pub fn clean_thought_tags(text: &str) -> String {
    // Ported from app.py: Remove internal reasoning tags like <|channel>thought ... <channel|>
    // 1. Complete blocks
    let text = RE_THOUGHT_FULL.replace_all(text, "");

    // 2. Unclosed blocks at the end of a stream
    let text = RE_THOUGHT_UNCLOSED.replace_all(&text, "");

    // 3. Alternative <thought> tags
    let text = RE_THOUGHT_BLOCK.replace_all(&text, "");
    let text = RE_THOUGHT_OPEN.replace_all(&text, "");

    // 3b. Alternative <think> tags
    let text = RE_THINK_BLOCK.replace_all(&text, "");
    let text = RE_THINK_OPEN.replace_all(&text, "");

    // 4. Individual leaked tokens
    text.replace("<|channel>thought", "")
        .replace("<channel|>", "")
        .replace("<|thought|>", "")
        .replace("<thought>", "")
        .replace("</thought>", "")
        .replace("<think>", "")
        .replace("</think>", "")
        .trim()
        .to_string()
}
