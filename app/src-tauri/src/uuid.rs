use uuid::Uuid;

/// 生成时间有序的 UUIDv7，作为跨导出的稳定身份（主键仍用 INTEGER）。
pub fn new_id() -> String {
    Uuid::now_v7().to_string()
}
