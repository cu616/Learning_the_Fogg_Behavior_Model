use crate::commands::conn;
use crate::db::{self, Db};
use crate::models::BackupRecord;
use rusqlite::backup::Backup;
use rusqlite::types::Value as SqlValue;
use rusqlite::{params, Connection, OptionalExtension, Row, ToSql};
use std::collections::{HashMap, HashSet};
use std::time::Duration;
use tauri::Manager;

/// 自动滚动备份保留份数。
const KEEP_BACKUPS: i64 = 7;

const BUSINESS_TABLES: &[&str] = &[
    "habit_project",
    "aspiration",
    "behavior_option",
    "behavior_option_layout",
    "focus_placement",
    "golden_behavior",
    "habit_branch",
    "branch_ability",
    "branch_tiny_behavior",
    "branch_anchor",
    "branch_celebration",
    "branch_recipe_version",
    "branch_practice_event",
    "branch_obstacle_diagnosis",
    "ability_assessment",
    "tiny_behavior",
    "anchor",
    "celebration",
    "recipe_version",
    "practice_event",
    "obstacle_diagnosis",
    "project_change",
    "personal_reference_item",
    "one_time_task",
    "one_time_diagnosis_round",
    "one_time_task_event",
    "old_habit_project",
    "old_habit_behavior",
    "old_habit_strategy",
    "old_habit_observation",
    "old_habit_replacement",
];

fn row_to_json(row: &Row, names: &[String]) -> rusqlite::Result<serde_json::Value> {
    let mut m = serde_json::Map::new();
    for (i, name) in names.iter().enumerate() {
        let v = row.get::<_, SqlValue>(i)?;
        let jv = match v {
            SqlValue::Null => serde_json::Value::Null,
            SqlValue::Integer(n) => serde_json::json!(n),
            SqlValue::Real(f) => serde_json::json!(f),
            SqlValue::Text(s) => serde_json::json!(s),
            SqlValue::Blob(b) => serde_json::json!(b),
        };
        m.insert(name.clone(), jv);
    }
    Ok(serde_json::Value::Object(m))
}

fn dump(conn: &Connection, sql: &str, params: &[&dyn ToSql]) -> Result<Vec<serde_json::Value>, String> {
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    let rows = stmt
        .query_map(params, |row| row_to_json(row, &names))
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn backup_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("backups");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// 在不可逆删除前创建完整保护快照，并让它出现在现有备份列表中。
pub(crate) fn protective_snapshot(app: &tauri::AppHandle, c: &Connection, summary: &str) -> Result<String, String> {
    let dir = backup_dir(app)?;
    let stamp = db::now().replace([':', '.', 'T'], "_");
    let path = dir.join(format!("before-delete-{}.db", stamp));
    let path_str = path.to_string_lossy().replace('\'', "''");
    c.execute_batch(&format!("VACUUM INTO '{}'", path_str)).map_err(|e| e.to_string())?;
    c.execute(
        "INSERT INTO backup_record (backup_type,file_path,content_summary,schema_version,created_at) VALUES ('full',?1,?2,6,?3)",
        params![path.to_string_lossy(), summary, db::now()],
    ).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

fn row_to_backup(row: &Row) -> rusqlite::Result<BackupRecord> {
    Ok(BackupRecord {
        id: row.get(0)?,
        project_id: row.get(1)?,
        backup_type: row.get(2)?,
        file_path: row.get(3)?,
        content_summary: row.get(4)?,
        schema_version: row.get(5)?,
        created_at: row.get(6)?,
    })
}

#[tauri::command]
pub fn backup(app: tauri::AppHandle, state: tauri::State<Db>) -> Result<BackupRecord, String> {
    let c = conn(&state)?;
    let dir = backup_dir(&app)?;
    let stamp = db::now().replace([':', '.', 'T'], "_");
    let path = dir.join(format!("fogg-lab-{}.db", stamp));
    let path_str = path.to_string_lossy().replace('\'', "''");
    c.execute_batch(&format!("VACUUM INTO '{}'", path_str)).map_err(|e| e.to_string())?;

    let summary = "完整数据库快照".to_string();
    c.execute(
        "INSERT INTO backup_record (backup_type, file_path, content_summary, schema_version, created_at) VALUES ('full', ?1, ?2, 6, ?3)",
        params![path.to_string_lossy(), summary, db::now()],
    )
    .map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();

    // 自动滚动：只保留最近 KEEP_BACKUPS 份，删除更早的记录与文件
    let old: Vec<(i64, String)> = {
        let mut stmt = c
            .prepare("SELECT id, file_path FROM backup_record ORDER BY id DESC LIMIT -1 OFFSET ?1")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![KEEP_BACKUPS], |r| Ok((r.get(0)?, r.get(1)?)))
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?
    };
    for (oid, opath) in old {
        let _ = std::fs::remove_file(&opath);
        c.execute("DELETE FROM backup_record WHERE id=?1", params![oid]).map_err(|e| e.to_string())?;
    }

    c.query_row(
        "SELECT id, project_id, backup_type, file_path, content_summary, schema_version, created_at FROM backup_record WHERE id=?1",
        params![id],
        row_to_backup,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_backups(state: tauri::State<Db>) -> Result<Vec<BackupRecord>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare("SELECT id, project_id, backup_type, file_path, content_summary, schema_version, created_at FROM backup_record ORDER BY id DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], row_to_backup).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_backup(app: tauri::AppHandle, state: tauri::State<Db>, backup_id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    let file_path: String = c
        .query_row("SELECT file_path FROM backup_record WHERE id=?1", params![backup_id], |r| r.get(0))
        .map_err(|_| "备份记录不存在".to_string())?;
    let path = std::path::PathBuf::from(&file_path);
    if path.exists() {
        let allowed = std::fs::canonicalize(backup_dir(&app)?).map_err(|e| e.to_string())?;
        let resolved = std::fs::canonicalize(&path).map_err(|e| e.to_string())?;
        if !resolved.starts_with(&allowed) {
            return Err("拒绝删除应用备份目录之外的文件".to_string());
        }
        std::fs::remove_file(&resolved).map_err(|e| e.to_string())?;
    }
    c.execute("DELETE FROM backup_record WHERE id=?1", params![backup_id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn restore_backup(_app: tauri::AppHandle, state: tauri::State<Db>, backup_id: i64) -> Result<(), String> {
    let mut c = conn(&state)?;
    let path: String = c
        .query_row("SELECT file_path FROM backup_record WHERE id=?1", params![backup_id], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let src = Connection::open(&path).map_err(|e| e.to_string())?;
    let backup = Backup::new(&src, &mut *c).map_err(|e| e.to_string())?;
    backup.run_to_completion(64, Duration::from_millis(5), None).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn export_all(state: tauri::State<Db>) -> Result<String, String> {
    let c = conn(&state)?;
    let mut tables = serde_json::Map::new();
    for table in BUSINESS_TABLES {
        let sql = format!("SELECT * FROM \"{}\"", table);
        tables.insert((*table).to_string(), serde_json::Value::Array(dump(&c, &sql, &[])?));
    }
    let root = serde_json::json!({
        "format": "fogg-lab-export-v4",
        "exportedAt": db::now(),
        "tables": serde_json::Value::Object(tables),
    });
    serde_json::to_string_pretty(&root).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_project(state: tauri::State<Db>, project_id: i64) -> Result<String, String> {
    let c = conn(&state)?;
    let pid: &dyn ToSql = &project_id;
    let mut tables = serde_json::Map::new();
    for table in BUSINESS_TABLES {
        let sql = if *table == "focus_placement" {
            "SELECT fp.* FROM focus_placement fp JOIN behavior_option bo ON bo.id = fp.behavior_option_id WHERE bo.project_id = ?1".to_string()
        } else if *table == "behavior_option_layout" {
            "SELECT bl.* FROM behavior_option_layout bl JOIN behavior_option bo ON bo.id = bl.behavior_option_id WHERE bo.project_id = ?1".to_string()
        } else if *table == "habit_project" {
            "SELECT * FROM habit_project WHERE id = ?1".to_string()
        } else if matches!(*table, "personal_reference_item" | "one_time_task" | "one_time_diagnosis_round" | "one_time_task_event" | "old_habit_project" | "old_habit_behavior" | "old_habit_strategy" | "old_habit_observation" | "old_habit_replacement") {
            format!("SELECT * FROM \"{}\" WHERE id < ?1 AND 0", table)
        } else {
            format!("SELECT * FROM \"{}\" WHERE project_id = ?1", table)
        };
        tables.insert((*table).to_string(), serde_json::Value::Array(dump(&c, &sql, &[pid])?));
    }
    let root = serde_json::json!({
        "format": "fogg-lab-export-v4",
        "exportedAt": db::now(),
        "projectId": project_id,
        "tables": serde_json::Value::Object(tables),
    });
    serde_json::to_string_pretty(&root).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_export(app: tauri::AppHandle, filename: String, content: String) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("exports");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(&filename);
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

// (表名, 外键列映射 [(列, 引用表)], 父级判定 [(父列, 父表)])
const IMPORT_TABLES: &[(&str, &[(&str, &str)], Option<(&str, &str)>)] = &[
    ("habit_project", &[], None),
    ("aspiration", &[("project_id", "habit_project")], Some(("project_id", "habit_project"))),
    ("behavior_option", &[("project_id", "habit_project")], Some(("project_id", "habit_project"))),
    ("behavior_option_layout", &[("behavior_option_id", "behavior_option")], Some(("behavior_option_id", "behavior_option"))),
    ("focus_placement", &[("behavior_option_id", "behavior_option")], Some(("behavior_option_id", "behavior_option"))),
    ("golden_behavior", &[("project_id", "habit_project"), ("behavior_option_id", "behavior_option")], Some(("project_id", "habit_project"))),
    ("habit_branch", &[("project_id", "habit_project"), ("golden_behavior_id", "golden_behavior")], Some(("project_id", "habit_project"))),
    ("branch_ability", &[("project_id", "habit_project"), ("branch_id", "habit_branch")], Some(("project_id", "habit_project"))),
    ("branch_tiny_behavior", &[("project_id", "habit_project"), ("branch_id", "habit_branch")], Some(("project_id", "habit_project"))),
    ("branch_anchor", &[("project_id", "habit_project"), ("branch_id", "habit_branch")], Some(("project_id", "habit_project"))),
    ("branch_celebration", &[("project_id", "habit_project"), ("branch_id", "habit_branch")], Some(("project_id", "habit_project"))),
    ("ability_assessment", &[("project_id", "habit_project")], Some(("project_id", "habit_project"))),
    ("tiny_behavior", &[("project_id", "habit_project")], Some(("project_id", "habit_project"))),
    ("anchor", &[("project_id", "habit_project")], Some(("project_id", "habit_project"))),
    ("celebration", &[("project_id", "habit_project")], Some(("project_id", "habit_project"))),
    ("project_change", &[("project_id", "habit_project")], Some(("project_id", "habit_project"))),
    ("recipe_version", &[("project_id", "habit_project"), ("change_id", "project_change")], Some(("project_id", "habit_project"))),
    ("branch_recipe_version", &[("project_id", "habit_project"), ("branch_id", "habit_branch")], Some(("project_id", "habit_project"))),
    ("practice_event", &[("project_id", "habit_project"), ("recipe_version_id", "recipe_version")], Some(("project_id", "habit_project"))),
    ("branch_practice_event", &[("project_id", "habit_project"), ("branch_id", "habit_branch"), ("recipe_version_id", "branch_recipe_version")], Some(("project_id", "habit_project"))),
    ("obstacle_diagnosis", &[("project_id", "habit_project"), ("practice_event_id", "practice_event")], Some(("project_id", "habit_project"))),
    ("branch_obstacle_diagnosis", &[("project_id", "habit_project"), ("branch_id", "habit_branch"), ("practice_event_id", "branch_practice_event")], Some(("project_id", "habit_project"))),
    ("personal_reference_item", &[], None),
    ("one_time_task", &[("converted_project_id", "habit_project")], None),
    ("one_time_diagnosis_round", &[("task_id", "one_time_task")], Some(("task_id", "one_time_task"))),
    ("one_time_task_event", &[("task_id", "one_time_task")], Some(("task_id", "one_time_task"))),
    ("old_habit_project", &[("linked_habit_project_id", "habit_project")], None),
    ("old_habit_behavior", &[("project_id", "old_habit_project")], Some(("project_id", "old_habit_project"))),
    ("old_habit_strategy", &[("project_id", "old_habit_project"), ("behavior_id", "old_habit_behavior")], Some(("project_id", "old_habit_project"))),
    ("old_habit_observation", &[("project_id", "old_habit_project"), ("behavior_id", "old_habit_behavior")], Some(("project_id", "old_habit_project"))),
    ("old_habit_replacement", &[("project_id", "old_habit_project"), ("behavior_id", "old_habit_behavior"), ("linked_habit_project_id", "habit_project")], Some(("project_id", "old_habit_project"))),
];

fn insert_row(
    c: &Connection,
    table: &str,
    obj: &serde_json::Map<String, serde_json::Value>,
    fk_cols: &[(&str, &str)],
    maps: &HashMap<String, HashMap<i64, i64>>,
) -> Result<i64, String> {
    let mut cols = Vec::new();
    let mut vals: Vec<serde_json::Value> = Vec::new();
    for (col, val) in obj {
        if col == "id" || col.starts_with("legacy_") {
            continue;
        }
        let mut v = val.clone();
        if let Some((_, ref_table)) = fk_cols.iter().find(|(c, _)| c == col) {
            if let Some(old_id) = val.as_i64() {
                if let Some(new_id) = maps.get(*ref_table).and_then(|m| m.get(&old_id)) {
                    v = serde_json::json!(new_id);
                }
            }
        }
        cols.push(col.clone());
        vals.push(v);
    }
    let ph = (1..=cols.len()).map(|i| format!("?{}", i)).collect::<Vec<_>>().join(",");
    let sql = format!("INSERT INTO \"{}\" ({}) VALUES ({})", table, cols.join(","), ph);
    c.execute(&sql, rusqlite::params_from_iter(vals.iter())).map_err(|e| e.to_string())?;
    Ok(c.last_insert_rowid())
}

#[tauri::command]
pub fn import_json(state: tauri::State<Db>, json: String) -> Result<String, String> {
    let c = conn(&state)?;
    let root: serde_json::Value = serde_json::from_str(&json).map_err(|e| format!("JSON 解析失败：{}", e))?;
    let tables = root.get("tables").and_then(|v| v.as_object()).ok_or("格式错误：缺少 tables 字段")?;

    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    let mut maps: HashMap<String, HashMap<i64, i64>> = HashMap::new();
    let mut new_ids: HashMap<&str, HashSet<i64>> = HashMap::new();
    let mut imported_projects = 0usize;
    let mut imported_tasks = 0usize;
    let mut imported_old_habits = 0usize;

    for &(table, fk_cols, parent) in IMPORT_TABLES {
        let rows = match tables.get(table).and_then(|v| v.as_array()) {
            Some(r) => r,
            None => continue,
        };
        for row in rows {
            let obj = row.as_object().ok_or("行格式错误")?;
            let old_id = obj.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
            let uuid = obj.get("uuid").and_then(|v| v.as_str());

            // 两类顶层对象和个人参考条目按 uuid 去重。
            if table == "habit_project" || table == "personal_reference_item" || table == "one_time_task" || table == "old_habit_project" {
                if let Some(u) = uuid {
                    let sql = format!("SELECT id FROM \"{}\" WHERE uuid=?1", table);
                    let existing: Option<i64> = tx
                        .query_row(&sql, params![u], |r| r.get(0))
                        .optional()
                        .map_err(|e| e.to_string())?;
                    if let Some(eid) = existing {
                        maps.entry(table.to_string()).or_default().insert(old_id, eid);
                        continue;
                    }
                }
            }

            // 父级未导入则跳过（跳过已存在项目的子数据）
            if let Some((pcol, ptable)) = parent {
                if let Some(p_old) = obj.get(pcol).and_then(|v| v.as_i64()) {
                    if !new_ids.get(ptable).map(|s| s.contains(&p_old)).unwrap_or(false) {
                        continue;
                    }
                }
            }

            let new_id = insert_row(&tx, table, obj, fk_cols, &maps)?;
            maps.entry(table.to_string()).or_default().insert(old_id, new_id);
            new_ids.entry(table).or_default().insert(old_id);
            if table == "habit_project" {
                imported_projects += 1;
            } else if table == "one_time_task" {
                imported_tasks += 1;
            } else if table == "old_habit_project" {
                imported_old_habits += 1;
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(format!("导入完成：新增 {} 个习惯项目，{} 个一次性行为，{} 个终止旧习惯项目", imported_projects, imported_tasks, imported_old_habits))
}
