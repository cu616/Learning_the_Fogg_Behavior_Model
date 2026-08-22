pub mod applock;
pub mod backups;
pub mod design;
pub mod practice;
pub mod projects;
pub mod steps;
pub mod one_time;
pub mod old_habit;

use crate::db::Db;
use rusqlite::Connection;
use std::sync::MutexGuard;

/// 从 Tauri 状态取数据库连接（锁保护）。
pub fn conn<'a>(state: &'a tauri::State<'_, Db>) -> Result<MutexGuard<'a, Connection>, String> {
    state.0.lock().map_err(|e| e.to_string())
}
