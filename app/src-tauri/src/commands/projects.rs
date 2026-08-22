use crate::commands::conn;
use crate::db::{self, Db};
use crate::models::HabitProject;
use crate::uuid;
use rusqlite::{params, Connection};

const COLS: &str =
    "id, uuid, name, aspiration_area, phase, paused_at, archived_at, current_step, created_at, updated_at";

fn row_to_project(row: &rusqlite::Row) -> rusqlite::Result<HabitProject> {
    Ok(HabitProject {
        id: row.get(0)?,
        uuid: row.get(1)?,
        name: row.get(2)?,
        aspiration_area: row.get(3)?,
        phase: row.get(4)?,
        paused_at: row.get(5)?,
        archived_at: row.get(6)?,
        current_step: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

fn get(conn: &Connection, id: i64) -> Result<HabitProject, String> {
    conn.query_row(
        &format!("SELECT {COLS} FROM habit_project WHERE id = ?1"),
        params![id],
        row_to_project,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(state: tauri::State<Db>, name: String) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    let now = db::now();
    c.execute(
        "INSERT INTO habit_project (uuid, name, phase, created_at, updated_at) VALUES (?1, ?2, 'draft', ?3, ?3)",
        params![uuid::new_id(), name, now],
    )
    .map_err(|e| e.to_string())?;
    get(&c, c.last_insert_rowid())
}

#[tauri::command]
pub fn list_projects(state: tauri::State<Db>) -> Result<Vec<HabitProject>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(&format!("SELECT {COLS} FROM habit_project ORDER BY updated_at DESC"))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_project)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(state: tauri::State<Db>, id: i64) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    get(&c, id)
}

#[tauri::command]
pub fn rename_project(state: tauri::State<Db>, id: i64, name: String) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    c.execute(
        "UPDATE habit_project SET name = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, name, db::now()],
    )
    .map_err(|e| e.to_string())?;
    get(&c, id)
}

#[tauri::command]
pub fn set_project_area(
    state: tauri::State<Db>,
    id: i64,
    area: Option<String>,
) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    c.execute(
        "UPDATE habit_project SET aspiration_area = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, area, db::now()],
    )
    .map_err(|e| e.to_string())?;
    get(&c, id)
}

#[tauri::command]
pub fn set_project_step(
    state: tauri::State<Db>,
    id: i64,
    step: Option<i64>,
) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    c.execute(
        "UPDATE habit_project SET current_step = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, step, db::now()],
    )
    .map_err(|e| e.to_string())?;
    get(&c, id)
}

#[tauri::command]
pub fn set_project_phase(state: tauri::State<Db>, id: i64, phase: String) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    c.execute(
        "UPDATE habit_project SET phase = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, phase, db::now()],
    )
    .map_err(|e| e.to_string())?;
    get(&c, id)
}

#[tauri::command]
pub fn set_project_paused(state: tauri::State<Db>, id: i64, paused: bool) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    let now = if paused { Some(db::now()) } else { None };
    c.execute(
        "UPDATE habit_project SET paused_at = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, now, db::now()],
    )
    .map_err(|e| e.to_string())?;
    get(&c, id)
}

#[tauri::command]
pub fn set_project_archived(
    state: tauri::State<Db>,
    id: i64,
    archived: bool,
) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    let now = if archived { Some(db::now()) } else { None };
    c.execute(
        "UPDATE habit_project SET archived_at = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, now, db::now()],
    )
    .map_err(|e| e.to_string())?;
    get(&c, id)
}

#[tauri::command]
pub fn duplicate_project(state: tauri::State<Db>, id: i64) -> Result<HabitProject, String> {
    let c = conn(&state)?;
    let src = get(&c, id)?;
    let now = db::now();
    c.execute(
        "INSERT INTO habit_project (uuid, name, aspiration_area, phase, created_at, updated_at) VALUES (?1, ?2, ?3, 'draft', ?4, ?4)",
        params![uuid::new_id(), format!("{}（副本）", src.name), src.aspiration_area, now],
    )
    .map_err(|e| e.to_string())?;
    get(&c, c.last_insert_rowid())
}

#[tauri::command]
pub fn delete_project(
    app: tauri::AppHandle,
    state: tauri::State<Db>,
    id: i64,
    confirmation: String,
) -> Result<String, String> {
    let c = conn(&state)?;
    let project = get(&c, id)?;
    if confirmation.trim() != project.name {
        return Err("删除确认名称不匹配".to_string());
    }
    let backup_path = crate::commands::backups::protective_snapshot(
        &app,
        &c,
        &format!("删除行为设计“{}”前的保护快照", project.name),
    )?;
    c.execute("DELETE FROM habit_project WHERE id=?1", [id]).map_err(|e| e.to_string())?;
    Ok(backup_path)
}
