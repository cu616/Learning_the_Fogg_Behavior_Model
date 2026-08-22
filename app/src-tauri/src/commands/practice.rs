use crate::commands::conn;
use crate::db::{self, Db};
use crate::models::{ObstacleDiagnosis, PracticeEvent, RecipeVersion};
use crate::uuid;
use rusqlite::{params, OptionalExtension, Row};

fn row_to_practice(row: &Row) -> rusqlite::Result<PracticeEvent> {
    Ok(PracticeEvent {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        recipe_version_id: row.get(3)?,
        result: row.get(4)?,
        feeling: row.get(5)?,
        context: row.get(6)?,
        occurred_at: row.get(7)?,
        created_at: row.get(8)?,
    })
}

fn row_to_diagnosis(row: &Row) -> rusqlite::Result<ObstacleDiagnosis> {
    Ok(ObstacleDiagnosis {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        practice_event_id: row.get(3)?,
        obstacle_type: row.get(4)?,
        diagnosis_path: row.get(5)?,
        suggestion: row.get(6)?,
        return_step: row.get(7)?,
        user_decision: row.get(8)?,
        created_at: row.get(9)?,
    })
}

fn row_to_recipe(row: &Row) -> rusqlite::Result<RecipeVersion> {
    Ok(RecipeVersion {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        version_number: row.get(3)?,
        anchor_last_action: row.get(4)?,
        behavior_text: row.get(5)?,
        celebration_text: row.get(6)?,
        full_recipe_text: row.get(7)?,
        rehearsal_count: row.get(8)?,
        rehearsal_feeling: row.get(9)?,
        change_id: row.get(10)?,
        status: row.get(11)?,
        created_at: row.get(12)?,
    })
}

/// 纯规则诊断映射：反馈 → (障碍类型, 诊断路径, 建议, 返回步骤)。
fn diagnosis_for(result: &str) -> (&'static str, &'static str, &'static str, i64) {
    match result {
        "完全忘记" => ("提示不明确", "提示", "锚点不够可靠或明确，试试更精确的「最后动作」作为提示。", 5),
        "锚点没出现" => ("锚点不匹配", "提示", "锚点频率或日程与目标不匹配，重新匹配一个更稳定的锚点。", 5),
        "想起但没做" => ("能力不足", "能力", "行为还不够容易，检查能力链最薄弱环节，把基线再缩小一点。", 4),
        _ => ("", "", "", 0),
    }
}

#[tauri::command]
pub fn record_practice(
    state: tauri::State<Db>,
    project_id: i64,
    result: String,
    feeling: Option<String>,
    context: Option<String>,
) -> Result<PracticeEvent, String> {
    let c = conn(&state)?;
    let now = db::now();

    let rv_id: Option<i64> = c
        .query_row(
            "SELECT id FROM recipe_version WHERE project_id=?1 AND status='active' ORDER BY version_number DESC LIMIT 1",
            params![project_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    let rv_id = rv_id.ok_or("还没有配方，请先完成第 6 步生成配方")?;

    c.execute(
        "INSERT INTO practice_event (uuid, project_id, recipe_version_id, result, feeling, context, occurred_at, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?7)",
        params![uuid::new_id(), project_id, rv_id, result, feeling, context, now],
    )
    .map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();

    // 首次实践：ready → experimenting
    c.execute(
        "UPDATE habit_project SET phase='experimenting', updated_at=?2 WHERE id=?1 AND phase='ready'",
        params![project_id, now],
    )
    .map_err(|e| e.to_string())?;

    c.query_row(
        "SELECT id, uuid, project_id, recipe_version_id, result, feeling, context, occurred_at, created_at FROM practice_event WHERE id=?1",
        params![id],
        row_to_practice,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_practice_events(state: tauri::State<Db>, project_id: i64) -> Result<Vec<PracticeEvent>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(
            "SELECT id, uuid, project_id, recipe_version_id, result, feeling, context, occurred_at, created_at FROM practice_event WHERE project_id=?1 ORDER BY occurred_at DESC, id DESC LIMIT 200",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_practice).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn diagnose(state: tauri::State<Db>, project_id: i64, practice_event_id: i64) -> Result<ObstacleDiagnosis, String> {
    let c = conn(&state)?;
    let result: String = c
        .query_row("SELECT result FROM practice_event WHERE id=?1", params![practice_event_id], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let (obstacle, path, suggestion, step) = diagnosis_for(&result);

    c.execute(
        "INSERT INTO obstacle_diagnosis (uuid, project_id, practice_event_id, obstacle_type, diagnosis_path, suggestion, return_step, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![uuid::new_id(), project_id, practice_event_id, obstacle, path, suggestion, step, db::now()],
    )
    .map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();

    c.query_row(
        "SELECT id, uuid, project_id, practice_event_id, obstacle_type, diagnosis_path, suggestion, return_step, user_decision, created_at FROM obstacle_diagnosis WHERE id=?1",
        params![id],
        row_to_diagnosis,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_diagnoses(state: tauri::State<Db>, project_id: i64) -> Result<Vec<ObstacleDiagnosis>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(
            "SELECT id, uuid, project_id, practice_event_id, obstacle_type, diagnosis_path, suggestion, return_step, user_decision, created_at FROM obstacle_diagnosis WHERE project_id=?1 ORDER BY id DESC LIMIT 100",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_diagnosis).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_recipe_versions(state: tauri::State<Db>, project_id: i64) -> Result<Vec<RecipeVersion>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(
            "SELECT id, uuid, project_id, version_number, anchor_last_action, behavior_text, celebration_text, full_recipe_text, rehearsal_count, rehearsal_feeling, change_id, status, created_at FROM recipe_version WHERE project_id=?1 ORDER BY version_number DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_recipe).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::diagnosis_for;

    #[test]
    fn diagnosis_maps_feedback_to_step() {
        let (_, path, _, step) = diagnosis_for("完全忘记");
        assert_eq!(path, "提示");
        assert_eq!(step, 5);

        let (_, path, _, step) = diagnosis_for("锚点没出现");
        assert_eq!(path, "提示");
        assert_eq!(step, 5);

        let (_, path, _, step) = diagnosis_for("想起但没做");
        assert_eq!(path, "能力");
        assert_eq!(step, 4);

        // 成功类反馈不触发诊断
        let (obstacle, _, _, step) = diagnosis_for("自然完成");
        assert_eq!(obstacle, "");
        assert_eq!(step, 0);
    }
}
