use crate::commands::conn;
use crate::db::{self, Db};
use crate::models::*;
use crate::uuid;
use rusqlite::{params, Connection, OptionalExtension, Row};

// ===== 第二步：行为集群 =====

fn row_to_behavior_v2(row: &Row) -> rusqlite::Result<BehaviorOptionV2> {
    Ok(BehaviorOptionV2 {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        text: row.get(3)?,
        source: row.get(4)?,
        status: row.get(5)?,
        notes: row.get(6)?,
        sort_order: row.get(7)?,
        swarm_pos_x: row.get(8)?,
        swarm_pos_y: row.get(9)?,
        swarm_width: row.get(10)?,
        swarm_height: row.get(11)?,
        created_at: row.get(12)?,
    })
}

const BEHAVIOR_V2_COLS: &str = "bo.id, bo.uuid, bo.project_id, bo.text, bo.source, bo.status, bo.notes, bo.sort_order, bl.swarm_pos_x, bl.swarm_pos_y, bl.swarm_width, bl.swarm_height, bo.created_at";

fn get_behavior_v2(c: &Connection, id: i64) -> Result<BehaviorOptionV2, String> {
    c.query_row(
        &format!("SELECT {BEHAVIOR_V2_COLS} FROM behavior_option bo LEFT JOIN behavior_option_layout bl ON bl.behavior_option_id=bo.id WHERE bo.id=?1"),
        params![id],
        row_to_behavior_v2,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_behavior_options_v2(state: tauri::State<Db>, project_id: i64) -> Result<Vec<BehaviorOptionV2>, String> {
    let c = conn(&state)?;
    let mut stmt = c
        .prepare(&format!("SELECT {BEHAVIOR_V2_COLS} FROM behavior_option bo LEFT JOIN behavior_option_layout bl ON bl.behavior_option_id=bo.id WHERE bo.project_id=?1 ORDER BY bo.sort_order, bo.id"))
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_behavior_v2).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_behavior_option_v2(
    state: tauri::State<Db>,
    project_id: i64,
    text: String,
    source: Option<String>,
    swarm_pos_x: Option<f64>,
    swarm_pos_y: Option<f64>,
) -> Result<BehaviorOptionV2, String> {
    let c = conn(&state)?;
    let now = db::now();
    let source = source.unwrap_or_else(|| "用户".to_string());
    let char_count = text.chars().count() as f64;
    let default_width = (150.0 + char_count.min(60.0) * 1.8).clamp(150.0, 260.0);
    let default_height = (76.0 + (char_count / 18.0).floor() * 22.0).clamp(76.0, 170.0);
    c.execute(
        "INSERT INTO behavior_option (uuid, project_id, text, source, status, sort_order, created_at) VALUES (?1,?2,?3,?4,'活跃',0,?5)",
        params![uuid::new_id(), project_id, text, source, now],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.execute(
        "INSERT INTO behavior_option_layout (behavior_option_id, swarm_pos_x, swarm_pos_y, swarm_width, swarm_height, updated_at) VALUES (?1,?2,?3,?4,?5,?6)",
        params![id, swarm_pos_x, swarm_pos_y, default_width, default_height, db::now()],
    ).map_err(|e| e.to_string())?;
    get_behavior_v2(&c, id)
}

#[tauri::command]
pub fn update_behavior_option_v2(
    state: tauri::State<Db>,
    id: i64,
    text: Option<String>,
    status: Option<String>,
    swarm_pos_x: Option<f64>,
    swarm_pos_y: Option<f64>,
    update_position: Option<bool>,
    swarm_width: Option<f64>,
    swarm_height: Option<f64>,
    update_size: Option<bool>,
) -> Result<BehaviorOptionV2, String> {
    let c = conn(&state)?;
    if let Some(text) = text {
        c.execute("UPDATE behavior_option SET text=?2 WHERE id=?1", params![id, text]).map_err(|e| e.to_string())?;
    }
    if let Some(status) = status {
        c.execute("UPDATE behavior_option SET status=?2 WHERE id=?1", params![id, status]).map_err(|e| e.to_string())?;
    }
    if update_position.unwrap_or(false) {
        c.execute(
            "INSERT INTO behavior_option_layout (behavior_option_id, swarm_pos_x, swarm_pos_y, updated_at) VALUES (?1,?2,?3,?4) ON CONFLICT(behavior_option_id) DO UPDATE SET swarm_pos_x=excluded.swarm_pos_x, swarm_pos_y=excluded.swarm_pos_y, updated_at=excluded.updated_at",
            params![id, swarm_pos_x, swarm_pos_y, db::now()],
        ).map_err(|e| e.to_string())?;
    }
    if update_size.unwrap_or(false) {
        let width = swarm_width.unwrap_or(190.0).clamp(140.0, 420.0);
        let height = swarm_height.unwrap_or(86.0).clamp(72.0, 280.0);
        c.execute(
            "INSERT INTO behavior_option_layout (behavior_option_id, swarm_width, swarm_height, updated_at) VALUES (?1,?2,?3,?4) ON CONFLICT(behavior_option_id) DO UPDATE SET swarm_width=excluded.swarm_width, swarm_height=excluded.swarm_height, updated_at=excluded.updated_at",
            params![id, width, height, db::now()],
        ).map_err(|e| e.to_string())?;
    }
    get_behavior_v2(&c, id)
}

// ===== 第三步：九级焦点地图与多黄金行为 =====

fn focus_score_from_storage(value: Option<i64>) -> Option<i64> {
    value.map(|score| score - 5)
}

fn focus_score_to_storage(value: Option<i64>) -> Option<i64> {
    value.map(|score| score + 5)
}

fn row_to_focus_v2(row: &Row) -> rusqlite::Result<FocusPlacementV2> {
    let stored_impact: Option<i64> = row.get(1)?;
    let stored_feasibility: Option<i64> = row.get(2)?;
    Ok(FocusPlacementV2 {
        behavior_option_id: row.get(0)?,
        impact: focus_score_from_storage(stored_impact),
        feasibility: focus_score_from_storage(stored_feasibility),
        pos_x: row.get(3)?,
        pos_y: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

#[tauri::command]
pub fn save_focus_placement_v2(
    state: tauri::State<Db>,
    behavior_option_id: i64,
    impact: Option<i64>,
    feasibility: Option<i64>,
    pos_x: Option<f64>,
    pos_y: Option<f64>,
) -> Result<FocusPlacementV2, String> {
    if impact.is_some_and(|v| !(-4..=4).contains(&v)) || feasibility.is_some_and(|v| !(-4..=4).contains(&v)) {
        return Err("影响和可行性必须在 -4 到 4 之间".to_string());
    }
    let c = conn(&state)?;
    let stored_impact = focus_score_to_storage(impact);
    let stored_feasibility = focus_score_to_storage(feasibility);
    c.execute(
        "INSERT INTO behavior_option_layout (behavior_option_id, focus_pos_x, focus_pos_y, impact_score, feasibility_score, updated_at) VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT(behavior_option_id) DO UPDATE SET focus_pos_x=excluded.focus_pos_x, focus_pos_y=excluded.focus_pos_y, impact_score=excluded.impact_score, feasibility_score=excluded.feasibility_score, updated_at=excluded.updated_at",
        params![behavior_option_id, pos_x, pos_y, stored_impact, stored_feasibility, db::now()],
    ).map_err(|e| e.to_string())?;
    c.query_row(
        "SELECT behavior_option_id, impact_score, feasibility_score, focus_pos_x, focus_pos_y, updated_at FROM behavior_option_layout WHERE behavior_option_id=?1",
        params![behavior_option_id],
        row_to_focus_v2,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_focus_placements_v2(state: tauri::State<Db>, project_id: i64) -> Result<Vec<FocusPlacementV2>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare(
        "SELECT bl.behavior_option_id, bl.impact_score, bl.feasibility_score, bl.focus_pos_x, bl.focus_pos_y, bl.updated_at FROM behavior_option_layout bl JOIN behavior_option bo ON bo.id=bl.behavior_option_id WHERE bo.project_id=?1"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_focus_v2).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn row_to_golden_v2(row: &Row) -> rusqlite::Result<GoldenBehaviorV2> {
    Ok(GoldenBehaviorV2 {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        behavior_option_id: row.get(3)?,
        behavior_text: row.get(4)?,
        reason: row.get(5)?,
        is_active: row.get(6)?,
        created_at: row.get(7)?,
    })
}

fn list_golden(c: &Connection, project_id: i64) -> Result<Vec<GoldenBehaviorV2>, String> {
    let mut stmt = c.prepare(
        "SELECT gb.id, gb.uuid, gb.project_id, gb.behavior_option_id, bo.text, gb.reason, gb.is_active, gb.created_at FROM golden_behavior gb JOIN behavior_option bo ON bo.id=gb.behavior_option_id WHERE gb.project_id=?1 AND gb.is_active=1 ORDER BY gb.id"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_golden_v2).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_golden_behaviors(state: tauri::State<Db>, project_id: i64) -> Result<Vec<GoldenBehaviorV2>, String> {
    let c = conn(&state)?;
    list_golden(&c, project_id)
}

#[tauri::command]
pub fn set_golden_behavior(
    state: tauri::State<Db>,
    project_id: i64,
    behavior_option_id: i64,
    selected: bool,
    reason: Option<String>,
) -> Result<Vec<GoldenBehaviorV2>, String> {
    let c = conn(&state)?;
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    if selected {
        let existing: Option<i64> = tx.query_row(
            "SELECT id FROM golden_behavior WHERE project_id=?1 AND behavior_option_id=?2 ORDER BY id DESC LIMIT 1",
            params![project_id, behavior_option_id], |r| r.get(0)
        ).optional().map_err(|e| e.to_string())?;
        let golden_id = if let Some(id) = existing {
            tx.execute("UPDATE golden_behavior SET is_active=1, reason=?2 WHERE id=?1", params![id, reason]).map_err(|e| e.to_string())?;
            id
        } else {
            tx.execute(
                "INSERT INTO golden_behavior (uuid, project_id, behavior_option_id, reason, is_active, created_at) VALUES (?1,?2,?3,?4,1,?5)",
                params![uuid::new_id(), project_id, behavior_option_id, reason, db::now()],
            ).map_err(|e| e.to_string())?;
            tx.last_insert_rowid()
        };
        let existing_branch: Option<i64> = tx.query_row(
            "SELECT id FROM habit_branch WHERE golden_behavior_id=?1 ORDER BY id LIMIT 1",
            params![golden_id], |r| r.get(0)
        ).optional().map_err(|e| e.to_string())?;
        if let Some(branch_id) = existing_branch {
            tx.execute(
                "UPDATE habit_branch SET status=CASE WHEN status='archived' THEN 'designing' ELSE status END, updated_at=?2 WHERE id=?1",
                params![branch_id, db::now()],
            ).map_err(|e| e.to_string())?;
        }
    } else {
        tx.execute(
            "UPDATE golden_behavior SET is_active=0 WHERE project_id=?1 AND behavior_option_id=?2",
            params![project_id, behavior_option_id],
        ).map_err(|e| e.to_string())?;
        tx.execute(
            "UPDATE habit_branch SET status='archived', updated_at=?3 WHERE project_id=?1 AND golden_behavior_id IN (SELECT id FROM golden_behavior WHERE project_id=?1 AND behavior_option_id=?2)",
            params![project_id, behavior_option_id, db::now()],
        ).map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    list_golden(&c, project_id)
}

// ===== 微习惯分支 =====

fn row_to_branch(row: &Row) -> rusqlite::Result<HabitBranch> {
    Ok(HabitBranch {
        id: row.get(0)?,
        uuid: row.get(1)?,
        project_id: row.get(2)?,
        golden_behavior_id: row.get(3)?,
        behavior_option_id: row.get(4)?,
        behavior_text: row.get(5)?,
        name: row.get(6)?,
        status: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

const BRANCH_SELECT: &str = "SELECT hb.id, hb.uuid, hb.project_id, hb.golden_behavior_id, gb.behavior_option_id, bo.text, hb.name, hb.status, hb.created_at, hb.updated_at FROM habit_branch hb LEFT JOIN golden_behavior gb ON gb.id=hb.golden_behavior_id LEFT JOIN behavior_option bo ON bo.id=gb.behavior_option_id";

#[tauri::command]
pub fn list_habit_branches(state: tauri::State<Db>, project_id: i64) -> Result<Vec<HabitBranch>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare(&format!("{BRANCH_SELECT} WHERE hb.project_id=?1 AND hb.status!='archived' ORDER BY hb.id")).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], row_to_branch).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_habit_branch(
    state: tauri::State<Db>,
    project_id: i64,
    golden_behavior_id: Option<i64>,
    name: Option<String>,
) -> Result<HabitBranch, String> {
    let c = conn(&state)?;
    let default_name = if let Some(gid) = golden_behavior_id {
        let _: i64 = c.query_row(
            "SELECT id FROM golden_behavior WHERE id=?1 AND project_id=?2",
            params![gid, project_id], |r| r.get(0)
        ).map_err(|_| "所选黄金行为不存在".to_string())?;
        let count: i64 = c.query_row(
            "SELECT count(*) FROM habit_branch WHERE golden_behavior_id=?1",
            [gid], |r| r.get(0)
        ).map_err(|e| e.to_string())?;
        format!("微习惯方案 {}", count + 1)
    } else {
        "微习惯方案 1".to_string()
    };
    let now = db::now();
    c.execute(
        "INSERT INTO habit_branch (uuid, project_id, golden_behavior_id, name, status, created_at, updated_at) VALUES (?1,?2,?3,?4,'designing',?5,?5)",
        params![uuid::new_id(), project_id, golden_behavior_id, name.filter(|x| !x.trim().is_empty()).unwrap_or(default_name), now],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.query_row(&format!("{BRANCH_SELECT} WHERE hb.id=?1"), params![id], row_to_branch).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_habit_branch(
    state: tauri::State<Db>,
    branch_id: i64,
    name: Option<String>,
    status: Option<String>,
) -> Result<HabitBranch, String> {
    let c = conn(&state)?;
    if let Some(name) = name {
        c.execute("UPDATE habit_branch SET name=?2, updated_at=?3 WHERE id=?1", params![branch_id, name, db::now()]).map_err(|e| e.to_string())?;
    }
    if let Some(status) = status {
        c.execute("UPDATE habit_branch SET status=?2, updated_at=?3 WHERE id=?1", params![branch_id, status, db::now()]).map_err(|e| e.to_string())?;
    }
    c.query_row(&format!("{BRANCH_SELECT} WHERE hb.id=?1"), params![branch_id], row_to_branch).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_habit_branch(
    app: tauri::AppHandle,
    state: tauri::State<Db>,
    branch_id: i64,
) -> Result<String, String> {
    let c = conn(&state)?;
    let name: String = c
        .query_row("SELECT name FROM habit_branch WHERE id=?1", params![branch_id], |r| r.get(0))
        .map_err(|_| "微习惯方案不存在".to_string())?;
    let backup_path = crate::commands::backups::protective_snapshot(
        &app,
        &c,
        &format!("删除微习惯方案前的保护备份：{}", name),
    )?;
    c.execute("DELETE FROM habit_branch WHERE id=?1", params![branch_id]).map_err(|e| e.to_string())?;
    Ok(backup_path)
}

fn branch_project(c: &Connection, branch_id: i64) -> Result<i64, String> {
    c.query_row("SELECT project_id FROM habit_branch WHERE id=?1", params![branch_id], |r| r.get(0)).map_err(|_| "微习惯分支不存在".to_string())
}

// ===== 第四步：分支能力与微行为 =====

fn row_to_branch_ability(row: &Row) -> rusqlite::Result<BranchAbility> {
    Ok(BranchAbility {
        id: row.get(0)?, uuid: row.get(1)?, project_id: row.get(2)?, branch_id: row.get(3)?,
        weakest_link: row.get(4)?, weakest_details: row.get(5)?, simplification_methods: row.get(6)?,
        skill_target: row.get(7)?, skill_plan: row.get(8)?, tools_needed: row.get(9)?,
        resources_available: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)?,
    })
}

const ABILITY_COLS: &str = "id, uuid, project_id, branch_id, weakest_link, weakest_details, simplification_methods, skill_target, skill_plan, tools_needed, resources_available, created_at, updated_at";

#[tauri::command]
pub fn get_branch_ability(state: tauri::State<Db>, branch_id: i64) -> Result<Option<BranchAbility>, String> {
    let c = conn(&state)?;
    c.query_row(&format!("SELECT {ABILITY_COLS} FROM branch_ability WHERE branch_id=?1"), params![branch_id], row_to_branch_ability).optional().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_branch_ability(
    state: tauri::State<Db>, branch_id: i64, weakest_link: Option<String>, weakest_details: Option<String>,
    simplification_methods: Option<String>, skill_target: Option<String>, skill_plan: Option<String>,
    tools_needed: Option<String>, resources_available: Option<String>,
) -> Result<BranchAbility, String> {
    let c = conn(&state)?;
    let project_id = branch_project(&c, branch_id)?;
    let now = db::now();
    c.execute(
        "INSERT INTO branch_ability (uuid, project_id, branch_id, weakest_link, weakest_details, simplification_methods, skill_target, skill_plan, tools_needed, resources_available, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?11) ON CONFLICT(branch_id) DO UPDATE SET weakest_link=excluded.weakest_link, weakest_details=excluded.weakest_details, simplification_methods=excluded.simplification_methods, skill_target=excluded.skill_target, skill_plan=excluded.skill_plan, tools_needed=excluded.tools_needed, resources_available=excluded.resources_available, updated_at=excluded.updated_at",
        params![uuid::new_id(), project_id, branch_id, weakest_link, weakest_details, simplification_methods, skill_target, skill_plan, tools_needed, resources_available, now],
    ).map_err(|e| e.to_string())?;
    c.query_row(&format!("SELECT {ABILITY_COLS} FROM branch_ability WHERE branch_id=?1"), params![branch_id], row_to_branch_ability).map_err(|e| e.to_string())
}

fn row_to_branch_tiny(row: &Row) -> rusqlite::Result<BranchTinyBehavior> {
    Ok(BranchTinyBehavior {
        id: row.get(0)?, uuid: row.get(1)?, project_id: row.get(2)?, branch_id: row.get(3)?,
        original_behavior: row.get(4)?, tiny_behavior: row.get(5)?, entry_step: row.get(6)?,
        baseline: row.get(7)?, optional_extension: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)?,
    })
}

const TINY_COLS: &str = "id, uuid, project_id, branch_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, created_at, updated_at";

#[tauri::command]
pub fn get_branch_tiny(state: tauri::State<Db>, branch_id: i64) -> Result<Option<BranchTinyBehavior>, String> {
    let c = conn(&state)?;
    c.query_row(&format!("SELECT {TINY_COLS} FROM branch_tiny_behavior WHERE branch_id=?1"), params![branch_id], row_to_branch_tiny).optional().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_branch_tiny(
    state: tauri::State<Db>, branch_id: i64, original_behavior: Option<String>, tiny_behavior: Option<String>,
    entry_step: Option<String>, baseline: Option<String>, optional_extension: Option<String>,
) -> Result<BranchTinyBehavior, String> {
    let c = conn(&state)?;
    let project_id = branch_project(&c, branch_id)?;
    let now = db::now();
    c.execute(
        "INSERT INTO branch_tiny_behavior (uuid, project_id, branch_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9) ON CONFLICT(branch_id) DO UPDATE SET original_behavior=excluded.original_behavior, tiny_behavior=excluded.tiny_behavior, entry_step=excluded.entry_step, baseline=excluded.baseline, optional_extension=excluded.optional_extension, updated_at=excluded.updated_at",
        params![uuid::new_id(), project_id, branch_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, now],
    ).map_err(|e| e.to_string())?;
    c.query_row(&format!("SELECT {TINY_COLS} FROM branch_tiny_behavior WHERE branch_id=?1"), params![branch_id], row_to_branch_tiny).map_err(|e| e.to_string())
}

// ===== 第五步：分支锚点 =====

fn row_to_branch_anchor(row: &Row) -> rusqlite::Result<BranchAnchor> {
    Ok(BranchAnchor {
        id: row.get(0)?, uuid: row.get(1)?, project_id: row.get(2)?, branch_id: row.get(3)?,
        anchor_text: row.get(4)?, last_action: row.get(5)?, location: row.get(6)?, frequency: row.get(7)?,
        source: row.get(8)?, is_selected: row.get(9)?, created_at: row.get(10)?,
    })
}

const BRANCH_ANCHOR_COLS: &str = "id, uuid, project_id, branch_id, anchor_text, last_action, location, frequency, source, is_selected, created_at";

#[tauri::command]
pub fn list_branch_anchors(state: tauri::State<Db>, branch_id: i64) -> Result<Vec<BranchAnchor>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare(&format!("SELECT {BRANCH_ANCHOR_COLS} FROM branch_anchor WHERE branch_id=?1 ORDER BY is_selected DESC, id DESC")).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![branch_id], row_to_branch_anchor).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_branch_anchor(
    state: tauri::State<Db>, branch_id: i64, anchor_text: String, last_action: Option<String>,
    location: Option<String>, frequency: Option<String>, source: Option<String>,
) -> Result<BranchAnchor, String> {
    let c = conn(&state)?;
    let project_id = branch_project(&c, branch_id)?;
    c.execute(
        "INSERT INTO branch_anchor (uuid, project_id, branch_id, anchor_text, last_action, location, frequency, source, is_selected, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,0,?9)",
        params![uuid::new_id(), project_id, branch_id, anchor_text, last_action, location, frequency, source.unwrap_or_else(|| "用户".to_string()), db::now()],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.query_row(&format!("SELECT {BRANCH_ANCHOR_COLS} FROM branch_anchor WHERE id=?1"), params![id], row_to_branch_anchor).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn select_branch_anchor(state: tauri::State<Db>, branch_id: i64, anchor_id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute("UPDATE branch_anchor SET is_selected=0 WHERE branch_id=?1", params![branch_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE branch_anchor SET is_selected=1 WHERE id=?1 AND branch_id=?2", params![anchor_id, branch_id]).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_branch_anchor(state: tauri::State<Db>, branch_id: i64, anchor_id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    c.execute("DELETE FROM branch_anchor WHERE id=?1 AND branch_id=?2", params![anchor_id, branch_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ===== 第六步：分支庆祝与配方 =====

fn row_to_branch_celebration(row: &Row) -> rusqlite::Result<BranchCelebration> {
    Ok(BranchCelebration {
        id: row.get(0)?, uuid: row.get(1)?, project_id: row.get(2)?, branch_id: row.get(3)?,
        celebration_text: row.get(4)?, naturalness: row.get(5)?, success_feeling: row.get(6)?,
        source: row.get(7)?, is_selected: row.get(8)?, created_at: row.get(9)?,
    })
}

const BRANCH_CELEBRATION_COLS: &str = "id, uuid, project_id, branch_id, celebration_text, naturalness, success_feeling, source, is_selected, created_at";

#[tauri::command]
pub fn list_branch_celebrations(state: tauri::State<Db>, branch_id: i64) -> Result<Vec<BranchCelebration>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare(&format!("SELECT {BRANCH_CELEBRATION_COLS} FROM branch_celebration WHERE branch_id=?1 ORDER BY is_selected DESC, id DESC")).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![branch_id], row_to_branch_celebration).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_branch_celebration(
    state: tauri::State<Db>, branch_id: i64, celebration_text: String, naturalness: Option<i64>,
    success_feeling: Option<i64>, source: Option<String>,
) -> Result<BranchCelebration, String> {
    let c = conn(&state)?;
    let project_id = branch_project(&c, branch_id)?;
    c.execute(
        "INSERT INTO branch_celebration (uuid, project_id, branch_id, celebration_text, naturalness, success_feeling, source, is_selected, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,0,?8)",
        params![uuid::new_id(), project_id, branch_id, celebration_text, naturalness, success_feeling, source.unwrap_or_else(|| "用户".to_string()), db::now()],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.query_row(&format!("SELECT {BRANCH_CELEBRATION_COLS} FROM branch_celebration WHERE id=?1"), params![id], row_to_branch_celebration).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn select_branch_celebration(state: tauri::State<Db>, branch_id: i64, celebration_id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute("UPDATE branch_celebration SET is_selected=0 WHERE branch_id=?1", params![branch_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE branch_celebration SET is_selected=1 WHERE id=?1 AND branch_id=?2", params![celebration_id, branch_id]).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_branch_celebration(state: tauri::State<Db>, branch_id: i64, celebration_id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    c.execute("DELETE FROM branch_celebration WHERE id=?1 AND branch_id=?2", params![celebration_id, branch_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn row_to_branch_recipe(row: &Row) -> rusqlite::Result<BranchRecipeVersion> {
    Ok(BranchRecipeVersion {
        id: row.get(0)?, uuid: row.get(1)?, project_id: row.get(2)?, branch_id: row.get(3)?, version_number: row.get(4)?,
        anchor_last_action: row.get(5)?, behavior_text: row.get(6)?, celebration_text: row.get(7)?, full_recipe_text: row.get(8)?,
        rehearsal_count: row.get(9)?, rehearsal_feeling: row.get(10)?, status: row.get(11)?, created_at: row.get(12)?,
    })
}

const BRANCH_RECIPE_COLS: &str = "id, uuid, project_id, branch_id, version_number, anchor_last_action, behavior_text, celebration_text, full_recipe_text, rehearsal_count, rehearsal_feeling, status, created_at";

#[tauri::command]
pub fn generate_branch_recipe(
    state: tauri::State<Db>, branch_id: i64, rehearsal_count: Option<i64>, rehearsal_feeling: Option<String>,
) -> Result<BranchRecipeVersion, String> {
    let c = conn(&state)?;
    let project_id = branch_project(&c, branch_id)?;
    let anchor_last: Option<String> = c.query_row(
        "SELECT COALESCE(last_action, anchor_text) FROM branch_anchor WHERE branch_id=?1 AND is_selected=1 ORDER BY id DESC LIMIT 1",
        params![branch_id], |r| r.get(0)
    ).optional().map_err(|e| e.to_string())?;
    let behavior: Option<String> = c.query_row(
        "SELECT COALESCE(NULLIF(baseline,''), NULLIF(tiny_behavior,''), entry_step) FROM branch_tiny_behavior WHERE branch_id=?1",
        params![branch_id], |r| r.get(0)
    ).optional().map_err(|e| e.to_string())?.flatten();
    let celebration: Option<String> = c.query_row(
        "SELECT celebration_text FROM branch_celebration WHERE branch_id=?1 AND is_selected=1 ORDER BY id DESC LIMIT 1",
        params![branch_id], |r| r.get(0)
    ).optional().map_err(|e| e.to_string())?;
    if anchor_last.as_deref().unwrap_or("").trim().is_empty() { return Err("请先选定一个明确的锚点".to_string()); }
    if behavior.as_deref().unwrap_or("").trim().is_empty() { return Err("请先填写基线行为或微行为".to_string()); }
    if celebration.as_deref().unwrap_or("").trim().is_empty() { return Err("请先选定一种庆祝方式".to_string()); }
    let full = format!(
        "在我完成【{}】之后，\n我会【{}】，\n然后立即【{}】。",
        anchor_last.as_deref().unwrap_or(""), behavior.as_deref().unwrap_or(""), celebration.as_deref().unwrap_or("")
    );
    let next_ver: i64 = c.query_row(
        "SELECT COALESCE(MAX(version_number),0)+1 FROM branch_recipe_version WHERE branch_id=?1",
        params![branch_id], |r| r.get(0)
    ).map_err(|e| e.to_string())?;
    let now = db::now();
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute("UPDATE branch_recipe_version SET status='superseded' WHERE branch_id=?1 AND status='active'", params![branch_id]).map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO branch_recipe_version (uuid, project_id, branch_id, version_number, anchor_last_action, behavior_text, celebration_text, full_recipe_text, rehearsal_count, rehearsal_feeling, status, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'active',?11)",
        params![uuid::new_id(), project_id, branch_id, next_ver, anchor_last, behavior, celebration, full, rehearsal_count, rehearsal_feeling, now],
    ).map_err(|e| e.to_string())?;
    let id = tx.last_insert_rowid();
    tx.execute("UPDATE habit_branch SET status='practicing', updated_at=?2 WHERE id=?1", params![branch_id, now]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE habit_project SET phase='ready', updated_at=?2 WHERE id=?1", params![project_id, now]).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    c.query_row(&format!("SELECT {BRANCH_RECIPE_COLS} FROM branch_recipe_version WHERE id=?1"), params![id], row_to_branch_recipe).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_active_branch_recipe(state: tauri::State<Db>, branch_id: i64) -> Result<Option<BranchRecipeVersion>, String> {
    let c = conn(&state)?;
    c.query_row(&format!("SELECT {BRANCH_RECIPE_COLS} FROM branch_recipe_version WHERE branch_id=?1 AND status='active' ORDER BY version_number DESC LIMIT 1"), params![branch_id], row_to_branch_recipe).optional().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_branch_recipe_versions(state: tauri::State<Db>, branch_id: i64) -> Result<Vec<BranchRecipeVersion>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare(&format!("SELECT {BRANCH_RECIPE_COLS} FROM branch_recipe_version WHERE branch_id=?1 ORDER BY version_number DESC")).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![branch_id], row_to_branch_recipe).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ===== 第七步：分支实践、感受与诊断 =====

fn row_to_branch_practice(row: &Row) -> rusqlite::Result<BranchPracticeEvent> {
    Ok(BranchPracticeEvent {
        id: row.get(0)?, uuid: row.get(1)?, project_id: row.get(2)?, branch_id: row.get(3)?, recipe_version_id: row.get(4)?,
        result: row.get(5)?, feeling: row.get(6)?, context: row.get(7)?, occurred_at: row.get(8)?, created_at: row.get(9)?,
    })
}

const BRANCH_PRACTICE_COLS: &str = "id, uuid, project_id, branch_id, recipe_version_id, result, feeling, context, occurred_at, created_at";

#[tauri::command]
pub fn record_branch_practice(
    state: tauri::State<Db>, branch_id: i64, result: String, feeling: Option<String>, context: Option<String>,
) -> Result<BranchPracticeEvent, String> {
    let c = conn(&state)?;
    let project_id = branch_project(&c, branch_id)?;
    let recipe_id: i64 = c.query_row(
        "SELECT id FROM branch_recipe_version WHERE branch_id=?1 AND status='active' ORDER BY version_number DESC LIMIT 1",
        params![branch_id], |r| r.get(0)
    ).map_err(|_| "还没有配方，请先完成第 6 步".to_string())?;
    let now = db::now();
    c.execute(
        "INSERT INTO branch_practice_event (uuid, project_id, branch_id, recipe_version_id, result, feeling, context, occurred_at, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)",
        params![uuid::new_id(), project_id, branch_id, recipe_id, result, feeling, context, now],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.execute("UPDATE habit_project SET phase='experimenting', updated_at=?2 WHERE id=?1", params![project_id, now]).map_err(|e| e.to_string())?;
    c.query_row(&format!("SELECT {BRANCH_PRACTICE_COLS} FROM branch_practice_event WHERE id=?1"), params![id], row_to_branch_practice).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_branch_practice_events(state: tauri::State<Db>, branch_id: i64) -> Result<Vec<BranchPracticeEvent>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare(&format!("SELECT {BRANCH_PRACTICE_COLS} FROM branch_practice_event WHERE branch_id=?1 ORDER BY occurred_at DESC, id DESC LIMIT 200")).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![branch_id], row_to_branch_practice).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn diagnosis_for(result: &str) -> (&'static str, &'static str, &'static str, i64) {
    match result {
        "完全忘记" => ("提示不明确", "提示", "锚点不够可靠或明确，试试更精确的最后动作。", 5),
        "锚点没出现" => ("锚点不匹配", "提示", "重新匹配一个在相同地点、频率合适且更稳定的锚点。", 5),
        "想起但没做" => ("能力不足", "能力", "检查能力链最薄弱环节，把基线再缩小，或增加技能与工具支持。", 4),
        "不方便记录" => ("记录方式有阻力", "能力", "不必追求完整记录；可以稍后只写结果，或减少记录步骤。", 7),
        _ => ("", "", "", 0),
    }
}

fn row_to_branch_diagnosis(row: &Row) -> rusqlite::Result<BranchObstacleDiagnosis> {
    Ok(BranchObstacleDiagnosis {
        id: row.get(0)?, uuid: row.get(1)?, project_id: row.get(2)?, branch_id: row.get(3)?, practice_event_id: row.get(4)?,
        obstacle_type: row.get(5)?, diagnosis_path: row.get(6)?, suggestion: row.get(7)?, return_step: row.get(8)?,
        user_decision: row.get(9)?, created_at: row.get(10)?,
    })
}

#[tauri::command]
pub fn diagnose_branch_practice(state: tauri::State<Db>, branch_id: i64, practice_event_id: i64) -> Result<BranchObstacleDiagnosis, String> {
    let c = conn(&state)?;
    let (project_id, result): (i64, String) = c.query_row(
        "SELECT project_id, result FROM branch_practice_event WHERE id=?1 AND branch_id=?2",
        params![practice_event_id, branch_id], |r| Ok((r.get(0)?, r.get(1)?))
    ).map_err(|_| "实践记录不存在".to_string())?;
    let (obstacle, path, suggestion, step) = diagnosis_for(&result);
    c.execute(
        "INSERT INTO branch_obstacle_diagnosis (uuid, project_id, branch_id, practice_event_id, obstacle_type, diagnosis_path, suggestion, return_step, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![uuid::new_id(), project_id, branch_id, practice_event_id, obstacle, path, suggestion, step, db::now()],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    c.query_row(
        "SELECT id, uuid, project_id, branch_id, practice_event_id, obstacle_type, diagnosis_path, suggestion, return_step, user_decision, created_at FROM branch_obstacle_diagnosis WHERE id=?1",
        params![id], row_to_branch_diagnosis
    ).map_err(|e| e.to_string())
}

// ===== 个人参考库 =====

fn row_to_reference(row: &Row) -> rusqlite::Result<PersonalReferenceItem> {
    Ok(PersonalReferenceItem {
        id: row.get(0)?, uuid: row.get(1)?, kind: row.get(2)?, title: row.get(3)?, content: row.get(4)?,
        structured_content: row.get(5)?, category: row.get(6)?, tags: row.get(7)?, source: row.get(8)?,
        created_at: row.get(9)?, updated_at: row.get(10)?,
    })
}

const REFERENCE_COLS: &str = "id, uuid, kind, title, content, structured_content, category, tags, source, created_at, updated_at";

#[tauri::command]
pub fn list_personal_references(state: tauri::State<Db>, kind: Option<String>) -> Result<Vec<PersonalReferenceItem>, String> {
    let c = conn(&state)?;
    let sql = if kind.is_some() {
        format!("SELECT {REFERENCE_COLS} FROM personal_reference_item WHERE kind=?1 ORDER BY updated_at DESC")
    } else {
        format!("SELECT {REFERENCE_COLS} FROM personal_reference_item ORDER BY updated_at DESC")
    };
    let mut stmt = c.prepare(&sql).map_err(|e| e.to_string())?;
    if let Some(kind) = kind {
        let rows = stmt.query_map(params![kind], row_to_reference).map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    } else {
        let rows = stmt.query_map([], row_to_reference).map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn save_personal_reference(
    state: tauri::State<Db>, id: Option<i64>, kind: String, title: Option<String>, content: String,
    structured_content: Option<String>, category: Option<String>, tags: Option<String>, source: Option<String>,
) -> Result<PersonalReferenceItem, String> {
    let c = conn(&state)?;
    if !["behavior", "recipe", "anchor", "celebration", "affirmation"].contains(&kind.as_str()) {
        return Err("不支持的个人库类型".to_string());
    }
    let now = db::now();
    let saved_id = if let Some(id) = id {
        c.execute(
            "UPDATE personal_reference_item SET kind=?2, title=?3, content=?4, structured_content=?5, category=?6, tags=?7, source=?8, updated_at=?9 WHERE id=?1",
            params![id, kind, title, content, structured_content, category, tags, source.unwrap_or_else(|| "用户".to_string()), now],
        ).map_err(|e| e.to_string())?;
        id
    } else {
        let duplicate: Option<i64> = c.query_row(
            "SELECT id FROM personal_reference_item WHERE kind=?1 AND trim(content)=trim(?2) ORDER BY id DESC LIMIT 1",
            params![kind, content], |r| r.get(0)
        ).optional().map_err(|e| e.to_string())?;
        if let Some(id) = duplicate {
            c.execute("UPDATE personal_reference_item SET updated_at=?2 WHERE id=?1", params![id, now]).map_err(|e| e.to_string())?;
            id
        } else {
            c.execute(
                "INSERT INTO personal_reference_item (uuid, kind, title, content, structured_content, category, tags, source, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)",
                params![uuid::new_id(), kind, title, content, structured_content, category, tags, source.unwrap_or_else(|| "用户".to_string()), now],
            ).map_err(|e| e.to_string())?;
            c.last_insert_rowid()
        }
    };
    c.query_row(&format!("SELECT {REFERENCE_COLS} FROM personal_reference_item WHERE id=?1"), params![saved_id], row_to_reference).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_personal_reference(state: tauri::State<Db>, id: i64) -> Result<(), String> {
    let c = conn(&state)?;
    c.execute("DELETE FROM personal_reference_item WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{diagnosis_for, focus_score_from_storage, focus_score_to_storage};

    #[test]
    fn diagnosis_covers_all_non_success_results() {
        for result in ["完全忘记", "锚点没出现", "想起但没做", "不方便记录"] {
            let (obstacle, _, _, step) = diagnosis_for(result);
            assert!(!obstacle.is_empty());
            assert!(step > 0);
        }
    }


    #[test]
    fn focus_scores_use_centered_negative_four_to_four_scale() {
        assert_eq!(focus_score_from_storage(Some(1)), Some(-4));
        assert_eq!(focus_score_from_storage(Some(5)), Some(0));
        assert_eq!(focus_score_from_storage(Some(9)), Some(4));
        assert_eq!(focus_score_to_storage(Some(-4)), Some(1));
        assert_eq!(focus_score_to_storage(Some(0)), Some(5));
        assert_eq!(focus_score_to_storage(Some(4)), Some(9));
    }
}
