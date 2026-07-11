use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct StreamEvent {
    pub content: String,
    pub is_finished: bool,
    pub error: Option<String>,
    pub status: Option<String>,
}

impl StreamEvent {
    pub(crate) fn full(
        content: String,
        is_finished: bool,
        error: Option<String>,
        status: Option<String>,
    ) -> Self {
        Self {
            content,
            is_finished,
            error,
            status,
        }
    }
}
