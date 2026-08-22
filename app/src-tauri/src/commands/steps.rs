use crate::commands::conn;
use crate::db::{self, Db};
use crate::models::*;
use crate::uuid;
use rusqlite::{params, OptionalExtension, Row};

// ===== 第 1 步：明确愿望 =====

fn row_to_aspiration(row: &Row) -> rusqlite::Result<Aspiration> {
    Ok(Aspiration {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        raw_input: row.get(3)?,
        input_type: row.get(4)?,
        final_aspiration: row.get(5)?,
        why_important: row.get(6)?,
        life_difference: row.get(7)?,
        notes: row.get(8)?,
        created_at: row.get(9)?,
    })
}

#[tauri::command]
pub fn get_aspiration(state: tauri::State<Db>, project_id: i64) -> Result<Option<Aspiration>, String> {
    let c = conn(&state)?;
    c.query_row(
        "SELECT id, uuid, project_id, raw_input, input_type, final_aspiration, why_important, life_difference, notes, created_at FROM aspiration WHERE project_id = ?1 ORDER BY id DESC LIMIT 1",
        params![project_id],
        row_to_aspiration,
    )
    .optional()
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_aspiration(
    state: tauri::State<Db>,
    project_id: i64,
    raw_input: Option<String>,
    input_type: Option<String>,
    final_aspiration: Option<String>,
    why_important: Option<String>,
    life_difference: Option<String>,
    notes: Option<String>,
) -> Result<Aspiration, String> {
    let c = conn(&state)?;
    let now = db::now();
    let existing: Option<i64> = c
        .query_row("SELECT id FROM aspiration WHERE project_id = ?1", params![project_id], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;

    let id = match existing {
        Some(id) => {
            c.execute(
                "UPDATE aspiration SET raw_input=?2, input_type=?3, final_aspiration=?4, why_important=?5, life_difference=?6, notes=?7 WHERE id=?1",
                params![id, raw_input, input_type, final_aspiration, why_important, life_difference, notes],
            ).map_err(|e| e.to_string())?;
            id
        }
        None => {
            c.execute(
                "INSERT INTO aspiration (uuid, project_id, raw_input, input_type, final_aspiration, why_important, life_difference, notes, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
                params![uuid::new_id(), project_id, raw_input, input_type, final_aspiration, why_important, life_difference, notes, now],
            ).map_err(|e| e.to_string())?;
            c.last_insert_rowid()
        }
    };

    c.query_row(
        "SELECT id, uuid, project_id, raw_input, input_type, final_aspiration, why_important, life_difference, notes, created_at FROM aspiration WHERE id = ?1",
        params![id],
        row_to_aspiration,
    )
    .map_err(|e| e.to_string())
}

// ===== 第 2 步：探索行为选项 =====

fn row_to_behavior(row: &Row) -> rusqlite::Result<BehaviorOption> {
    Ok(BehaviorOption {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        text: row.get(3)?,
        source: row.get(4)?,
        status: row.get(5)?,
        notes: row.get(6)?,
        batch: row.get(7)?,
        sort_order: row.get(8)?,
        created_at: row.get(9)?,
    })
}

const BEHAVIOR_COLS: &str = "id, uuid, project_id, text, source, status, notes, batch, sort_order, created_at";

#[tauri::command]
pub fn list_behavior_options(state: tauri::State<Db>, project_id: i64) -> Result<Vec<BehaviorOption>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(&format!("SELECT {BEHAVIOR_COLS} FROM behavior_option WHERE project_id=?1 ORDER BY sort_order, id"))
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_behavior).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_behavior_option(state: tauri::State<Db>, project_id: i64, text: String, source: Option<String>) -> Result<BehaviorOption, String> {
    let c = conn(&state)?;
    let source = source.unwrap_or_else(|| "用户".to_string());
    c.execute(
        "INSERT INTO behavior_option (uuid, project_id, text, source, status, sort_order, created_at) VALUES (?1,?2,?3,?4,'活跃',0,?5)",
        params![uuid::new_id(), project_id, text, source, db::now()],
    )
    .map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.query_row(&format!("SELECT {BEHAVIOR_COLS} FROM behavior_option WHERE id=?1"), params![id], row_to_behavior).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_behavior_option(state: tauri::State<Db>, id: i64, text: Option<String>, status: Option<String>) -> Result<BehaviorOption, String> {
    let c = conn(&state)?;
    if let Some(text) = text {
        c.execute("UPDATE behavior_option SET text=?2 WHERE id=?1", params![id, text]).map_err(|e| e.to_string())?;
    }
    if let Some(status) = status {
        c.execute("UPDATE behavior_option SET status=?2 WHERE id=?1", params![id, status]).map_err(|e| e.to_string())?;
    }
    c.query_row(&format!("SELECT {BEHAVIOR_COLS} FROM behavior_option WHERE id=?1"), params![id], row_to_behavior).map_err(|e| e.to_string())
}

// ===== 第 3 步：焦点地图 + 黄金行为 =====

fn row_to_focus(row: &Row) -> rusqlite::Result<FocusPlacement> {
    Ok(FocusPlacement {
        id: row.get(0)?,
        uuid: row.get(1)?,
        behavior_option_id: row.get(2)?,
        impact: row.get(3)?,
        feasibility: row.get(4)?,
        willing: row.get(5)?,
        pos_x: row.get(6)?,
        pos_y: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

#[tauri::command]
pub fn save_focus_placement(
    state: tauri::State<Db>,
    behavior_option_id: i64,
    impact: Option<i64>,
    feasibility: Option<i64>,
    willing: Option<bool>,
    pos_x: Option<f64>,
    pos_y: Option<f64>,
) -> Result<FocusPlacement, String> {
    let c = conn(&state)?;
    let now = db::now();
    let existing: Option<i64> = c
        .query_row("SELECT id FROM focus_placement WHERE behavior_option_id=?1", params![behavior_option_id], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    let id = match existing {
        Some(id) => {
            c.execute(
                "UPDATE focus_placement SET impact=?2, feasibility=?3, willing=?4, pos_x=?5, pos_y=?6, updated_at=?7 WHERE id=?1",
                params![id, impact, feasibility, willing, pos_x, pos_y, now],
            ).map_err(|e| e.to_string())?;
            id
        }
        None => {
            c.execute(
                "INSERT INTO focus_placement (uuid, behavior_option_id, impact, feasibility, willing, pos_x, pos_y, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
                params![uuid::new_id(), behavior_option_id, impact, feasibility, willing, pos_x, pos_y, now],
            ).map_err(|e| e.to_string())?;
            c.last_insert_rowid()
        }
    };
    c.query_row(
        "SELECT id, uuid, behavior_option_id, impact, feasibility, willing, pos_x, pos_y, updated_at FROM focus_placement WHERE id=?1",
        params![id],
        row_to_focus,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_focus_placements(state: tauri::State<Db>, project_id: i64) -> Result<Vec<FocusPlacement>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(
            "SELECT fp.id, fp.uuid, fp.behavior_option_id, fp.impact, fp.feasibility, fp.willing, fp.pos_x, fp.pos_y, fp.updated_at \
             FROM focus_placement fp JOIN behavior_option bo ON bo.id = fp.behavior_option_id WHERE bo.project_id = ?1",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_focus).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn row_to_golden(row: &Row) -> rusqlite::Result<GoldenBehavior> {
    Ok(GoldenBehavior {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        behavior_option_id: row.get(3)?,
        reason: row.get(4)?,
        is_active: row.get(5)?,
        created_at: row.get(6)?,
    })
}

#[tauri::command]
pub fn choose_golden_behavior(state: tauri::State<Db>, project_id: i64, behavior_option_id: i64, reason: Option<String>) -> Result<GoldenBehavior, String> {
    let c = conn(&state)?;
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute("UPDATE golden_behavior SET is_active=0 WHERE project_id=?1", params![project_id]).map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO golden_behavior (uuid, project_id, behavior_option_id, reason, is_active, created_at) VALUES (?1,?2,?3,?4,1,?5)",
        params![uuid::new_id(), project_id, behavior_option_id, reason, db::now()],
    ).map_err(|e| e.to_string())?;
    let id = tx.last_insert_rowid();
    tx.commit().map_err(|e| e.to_string())?;
    c.query_row("SELECT id, uuid, project_id, behavior_option_id, reason, is_active, created_at FROM golden_behavior WHERE id=?1", params![id], row_to_golden).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_golden_behavior(state: tauri::State<Db>, project_id: i64) -> Result<Option<GoldenBehavior>, String> {
    let c = conn(&state)?;
    c.query_row(
        "SELECT id, uuid, project_id, behavior_option_id, reason, is_active, created_at FROM golden_behavior WHERE project_id=?1 AND is_active=1 ORDER BY id DESC LIMIT 1",
        params![project_id],
        row_to_golden,
    )
    .optional()
    .map_err(|e| e.to_string())
}

// ===== 第 4 步：能力链 + 微行为 =====

fn row_to_ability(row: &Row) -> rusqlite::Result<AbilityAssessment> {
    Ok(AbilityAssessment {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        time_factor: row.get(3)?,
        money_factor: row.get(4)?,
        energy_factor: row.get(5)?,
        brain_factor: row.get(6)?,
        schedule_factor: row.get(7)?,
        weakest_link: row.get(8)?,
        simplification_methods: row.get(9)?,
        created_at: row.get(10)?,
    })
}

#[tauri::command]
pub fn save_ability_assessment(
    state: tauri::State<Db>,
    project_id: i64,
    time_factor: Option<String>,
    money_factor: Option<String>,
    energy_factor: Option<String>,
    brain_factor: Option<String>,
    schedule_factor: Option<String>,
    weakest_link: Option<String>,
    simplification_methods: Option<String>,
) -> Result<AbilityAssessment, String> {
    let c = conn(&state)?;
    let now = db::now();
    let existing: Option<i64> = c
        .query_row("SELECT id FROM ability_assessment WHERE project_id=?1", params![project_id], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    let id = match existing {
        Some(id) => {
            c.execute(
                "UPDATE ability_assessment SET time_factor=?2, money_factor=?3, energy_factor=?4, brain_factor=?5, schedule_factor=?6, weakest_link=?7, simplification_methods=?8 WHERE id=?1",
                params![id, time_factor, money_factor, energy_factor, brain_factor, schedule_factor, weakest_link, simplification_methods],
            ).map_err(|e| e.to_string())?;
            id
        }
        None => {
            c.execute(
                "INSERT INTO ability_assessment (uuid, project_id, time_factor, money_factor, energy_factor, brain_factor, schedule_factor, weakest_link, simplification_methods, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
                params![uuid::new_id(), project_id, time_factor, money_factor, energy_factor, brain_factor, schedule_factor, weakest_link, simplification_methods, now],
            ).map_err(|e| e.to_string())?;
            c.last_insert_rowid()
        }
    };
    c.query_row(
        "SELECT id, uuid, project_id, time_factor, money_factor, energy_factor, brain_factor, schedule_factor, weakest_link, simplification_methods, created_at FROM ability_assessment WHERE id=?1",
        params![id],
        row_to_ability,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_ability_assessment(state: tauri::State<Db>, project_id: i64) -> Result<Option<AbilityAssessment>, String> {
    let c = conn(&state)?;
    c.query_row(
        "SELECT id, uuid, project_id, time_factor, money_factor, energy_factor, brain_factor, schedule_factor, weakest_link, simplification_methods, created_at FROM ability_assessment WHERE project_id=?1 ORDER BY id DESC LIMIT 1",
        params![project_id],
        row_to_ability,
    )
    .optional()
    .map_err(|e| e.to_string())
}

fn row_to_tiny(row: &Row) -> rusqlite::Result<TinyBehavior> {
    Ok(TinyBehavior {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        original_behavior: row.get(3)?,
        tiny_behavior: row.get(4)?,
        entry_step: row.get(5)?,
        baseline: row.get(6)?,
        optional_extension: row.get(7)?,
        created_at: row.get(8)?,
    })
}

#[tauri::command]
pub fn save_tiny_behavior(
    state: tauri::State<Db>,
    project_id: i64,
    original_behavior: Option<String>,
    tiny_behavior: Option<String>,
    entry_step: Option<String>,
    baseline: Option<String>,
    optional_extension: Option<String>,
) -> Result<TinyBehavior, String> {
    let c = conn(&state)?;
    let now = db::now();
    let existing: Option<i64> = c
        .query_row("SELECT id FROM tiny_behavior WHERE project_id=?1", params![project_id], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    let id = match existing {
        Some(id) => {
            c.execute(
                "UPDATE tiny_behavior SET original_behavior=?2, tiny_behavior=?3, entry_step=?4, baseline=?5, optional_extension=?6 WHERE id=?1",
                params![id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension],
            ).map_err(|e| e.to_string())?;
            id
        }
        None => {
            c.execute(
                "INSERT INTO tiny_behavior (uuid, project_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
                params![uuid::new_id(), project_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, now],
            ).map_err(|e| e.to_string())?;
            c.last_insert_rowid()
        }
    };
    c.query_row(
        "SELECT id, uuid, project_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, created_at FROM tiny_behavior WHERE id=?1",
        params![id],
        row_to_tiny,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_tiny_behavior(state: tauri::State<Db>, project_id: i64) -> Result<Option<TinyBehavior>, String> {
    let c = conn(&state)?;
    c.query_row(
        "SELECT id, uuid, project_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, created_at FROM tiny_behavior WHERE project_id=?1 ORDER BY id DESC LIMIT 1",
        params![project_id],
        row_to_tiny,
    )
    .optional()
    .map_err(|e| e.to_string())
}

// ===== 第 5 步：锚点 =====

fn row_to_anchor(row: &Row) -> rusqlite::Result<Anchor> {
    Ok(Anchor {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        anchor_text: row.get(3)?,
        last_action: row.get(4)?,
        location: row.get(5)?,
        frequency: row.get(6)?,
        source: row.get(7)?,
        is_selected: row.get(8)?,
        created_at: row.get(9)?,
    })
}

const ANCHOR_COLS: &str = "id, uuid, project_id, anchor_text, last_action, location, frequency, source, is_selected, created_at";

#[tauri::command]
pub fn list_anchors(state: tauri::State<Db>, project_id: i64) -> Result<Vec<Anchor>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(&format!("SELECT {ANCHOR_COLS} FROM anchor WHERE project_id=?1 ORDER BY is_selected DESC, id"))
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_anchor).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_anchor(
    state: tauri::State<Db>,
    project_id: i64,
    anchor_text: String,
    last_action: Option<String>,
    location: Option<String>,
    frequency: Option<String>,
    source: Option<String>,
) -> Result<Anchor, String> {
    let c = conn(&state)?;
    let source = source.unwrap_or_else(|| "用户".to_string());
    c.execute(
        "INSERT INTO anchor (uuid, project_id, anchor_text, last_action, location, frequency, source, is_selected, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,0,?8)",
        params![uuid::new_id(), project_id, anchor_text, last_action, location, frequency, source, db::now()],
    )
    .map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.query_row(&format!("SELECT {ANCHOR_COLS} FROM anchor WHERE id=?1"), params![id], row_to_anchor).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_anchor(
    state: tauri::State<Db>,
    id: i64,
    anchor_text: Option<String>,
    last_action: Option<String>,
    location: Option<String>,
    frequency: Option<String>,
) -> Result<Anchor, String> {
    let c = conn(&state)?;
    c.execute(
        "UPDATE anchor SET anchor_text=COALESCE(?2, anchor_text), last_action=COALESCE(?3, last_action), location=COALESCE(?4, location), frequency=COALESCE(?5, frequency) WHERE id=?1",
        params![id, anchor_text, last_action, location, frequency],
    )
    .map_err(|e| e.to_string())?;
    c.query_row(&format!("SELECT {ANCHOR_COLS} FROM anchor WHERE id=?1"), params![id], row_to_anchor).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn select_anchor(state: tauri::State<Db>, project_id: i64, anchor_id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute("UPDATE anchor SET is_selected=0 WHERE project_id=?1", params![project_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE anchor SET is_selected=1 WHERE id=?1", params![anchor_id]).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// ===== 第 6 步：庆祝 + 配方 =====

fn row_to_celebration(row: &Row) -> rusqlite::Result<Celebration> {
    Ok(Celebration {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        celebration_text: row.get(3)?,
        naturalness: row.get(4)?,
        success_feeling: row.get(5)?,
        source: row.get(6)?,
        is_selected: row.get(7)?,
        created_at: row.get(8)?,
    })
}

const CELEBRATION_COLS: &str = "id, uuid, project_id, celebration_text, naturalness, success_feeling, source, is_selected, created_at";

#[tauri::command]
pub fn list_celebrations(state: tauri::State<Db>, project_id: i64) -> Result<Vec<Celebration>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(&format!("SELECT {CELEBRATION_COLS} FROM celebration WHERE project_id=?1 ORDER BY is_selected DESC, id"))
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_celebration).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_celebration(
    state: tauri::State<Db>,
    project_id: i64,
    celebration_text: String,
    naturalness: Option<i64>,
    success_feeling: Option<i64>,
    source: Option<String>,
) -> Result<Celebration, String> {
    let c = conn(&state)?;
    let source = source.unwrap_or_else(|| "用户".to_string());
    c.execute(
        "INSERT INTO celebration (uuid, project_id, celebration_text, naturalness, success_feeling, source, is_selected, created_at) VALUES (?1,?2,?3,?4,?5,?6,0,?7)",
        params![uuid::new_id(), project_id, celebration_text, naturalness, success_feeling, source, db::now()],
    )
    .map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.query_row(&format!("SELECT {CELEBRATION_COLS} FROM celebration WHERE id=?1"), params![id], row_to_celebration).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn select_celebration(state: tauri::State<Db>, project_id: i64, celebration_id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute("UPDATE celebration SET is_selected=0 WHERE project_id=?1", params![project_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE celebration SET is_selected=1 WHERE id=?1", params![celebration_id]).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
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

const RECIPE_COLS: &str = "id, uuid, project_id, version_number, anchor_last_action, behavior_text, celebration_text, full_recipe_text, rehearsal_count, rehearsal_feeling, change_id, status, created_at";

#[tauri::command]
pub fn generate_recipe(
    state: tauri::State<Db>,
    project_id: i64,
    rehearsal_count: Option<i64>,
    rehearsal_feeling: Option<String>,
) -> Result<RecipeVersion, String> {
    let c = conn(&state)?;
    let now = db::now();

    let anchor_last: Option<String> = c
        .query_row(
            "SELECT last_action FROM anchor WHERE project_id=?1 AND is_selected=1 ORDER BY id DESC LIMIT 1",
            params![project_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .flatten();
    let behavior: Option<String> = c
        .query_row(
            "SELECT baseline FROM tiny_behavior WHERE project_id=?1 ORDER BY id DESC LIMIT 1",
            params![project_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .flatten();
    let celebration: Option<String> = c
        .query_row(
            "SELECT celebration_text FROM celebration WHERE project_id=?1 AND is_selected=1 ORDER BY id DESC LIMIT 1",
            params![project_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .flatten();

    let full = format!(
        "在我完成【{}】之后，\n我会【{}】，\n然后立即【{}】。",
        anchor_last.clone().unwrap_or_default(),
        behavior.clone().unwrap_or_default(),
        celebration.clone().unwrap_or_default()
    );

    let next_ver: i64 = c
        .query_row(
            "SELECT COALESCE(MAX(version_number),0)+1 FROM recipe_version WHERE project_id=?1",
            params![project_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "UPDATE recipe_version SET status='superseded' WHERE project_id=?1 AND status='active'",
        params![project_id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO recipe_version (uuid, project_id, version_number, anchor_last_action, behavior_text, celebration_text, full_recipe_text, rehearsal_count, rehearsal_feeling, status, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'active',?10)",
        params![uuid::new_id(), project_id, next_ver, anchor_last, behavior, celebration, full, rehearsal_count, rehearsal_feeling, now],
    )
    .map_err(|e| e.to_string())?;
    let id = tx.last_insert_rowid();
    tx.execute(
        "UPDATE habit_project SET phase='ready', updated_at=?2 WHERE id=?1",
        params![project_id, now],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;

    c.query_row(&format!("SELECT {RECIPE_COLS} FROM recipe_version WHERE id=?1"), params![id], row_to_recipe).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_active_recipe(state: tauri::State<Db>, project_id: i64) -> Result<Option<RecipeVersion>, String> {
    let c = conn(&state)?;
    c.query_row(
        &format!("SELECT {RECIPE_COLS} FROM recipe_version WHERE project_id=?1 AND status='active' ORDER BY version_number DESC LIMIT 1"),
        params![project_id],
        row_to_recipe,
    )
    .optional()
    .map_err(|e| e.to_string())
}
