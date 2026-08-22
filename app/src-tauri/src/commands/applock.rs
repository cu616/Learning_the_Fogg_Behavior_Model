use crate::commands::conn;
use crate::db::Db;
use crate::uuid;
use rusqlite::{params, OptionalExtension};
use sha2::{Digest, Sha256};

const HASH_KEY: &str = "passcode_hash";
const SALT_KEY: &str = "passcode_salt";

fn hash(salt: &str, passcode: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(b":");
    hasher.update(passcode.as_bytes());
    hasher.finalize().iter().map(|b| format!("{:02x}", b)).collect()
}

#[tauri::command]
pub fn has_passcode(state: tauri::State<Db>) -> Result<bool, String> {
    let c = conn(&state)?;
    let v: Option<String> = c
        .query_row("SELECT value FROM settings WHERE key=?1", params![HASH_KEY], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(v.is_some())
}

#[tauri::command]
pub fn set_passcode(state: tauri::State<Db>, passcode: String) -> Result<(), String> {
    let c = conn(&state)?;
    if passcode.is_empty() {
        c.execute(
            "DELETE FROM settings WHERE key IN (?1, ?2)",
            params![HASH_KEY, SALT_KEY],
        )
        .map_err(|e| e.to_string())?;
    } else {
        let salt = uuid::new_id();
        let h = hash(&salt, &passcode);
        c.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            params![HASH_KEY, h],
        )
        .map_err(|e| e.to_string())?;
        c.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            params![SALT_KEY, salt],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn verify_passcode(state: tauri::State<Db>, passcode: String) -> Result<bool, String> {
    let c = conn(&state)?;
    let salt: Option<String> = c
        .query_row("SELECT value FROM settings WHERE key=?1", params![SALT_KEY], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    let stored: Option<String> = c
        .query_row("SELECT value FROM settings WHERE key=?1", params![HASH_KEY], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(match (salt, stored) {
        (Some(s), Some(h)) => hash(&s, &passcode) == h,
        _ => false,
    })
}
