use crate::commands::conn;
use crate::db::{self, Db};
use crate::models::{
    OneTimeDiagnosisRound, OneTimeTask, OneTimeTaskEvent, SaveOneTimeDiagnosisInput,
    SaveOneTimeTaskInput,
};
use crate::uuid;
use rusqlite::{params, OptionalExtension, Row};

fn task_from_row(r: &Row) -> rusqlite::Result<OneTimeTask> {
    Ok(OneTimeTask {
        id: r.get(0)?, uuid: r.get(1)?, title: r.get(2)?, completion_standard: r.get(3)?,
        next_action: r.get(4)?, deadline: r.get(5)?, completion_evidence: r.get(6)?,
        current_intent: r.get(7)?, current_route: r.get(8)?, status: r.get(9)?,
        decision_note: r.get(10)?, celebration: r.get(11)?, converted_project_id: r.get(12)?,
        started_at: r.get(13)?, completed_at: r.get(14)?, archived_at: r.get(15)?,
        created_at: r.get(16)?, updated_at: r.get(17)?,
    })
}

const TASK_SELECT: &str = "SELECT id,uuid,title,completion_standard,next_action,deadline,completion_evidence,current_intent,current_route,status,decision_note,celebration,converted_project_id,started_at,completed_at,archived_at,created_at,updated_at FROM one_time_task";

fn round_from_row(r: &Row) -> rusqlite::Result<OneTimeDiagnosisRound> {
    Ok(OneTimeDiagnosisRound {
        id: r.get(0)?, uuid: r.get(1)?, task_id: r.get(2)?, round_number: r.get(3)?,
        entry_mode: r.get(4)?, symptom: r.get(5)?, recommended_factor: r.get(6)?,
        selected_factor: r.get(7)?, target_side: r.get(8)?, problem_type: r.get(9)?,
        method: r.get(10)?, weakest_link: r.get(11)?, details: r.get(12)?,
        adjustment: r.get(13)?, updated_next_action: r.get(14)?, prompt_time: r.get(15)?,
        prompt_place: r.get(16)?, minimum_motivation_easy: r.get(17)?, task_decision: r.get(18)?,
        motivation_conflict: r.get(19)?, outcome: r.get(20)?, created_at: r.get(21)?, updated_at: r.get(22)?,
    })
}

const ROUND_SELECT: &str = "SELECT id,uuid,task_id,round_number,entry_mode,symptom,recommended_factor,selected_factor,target_side,problem_type,method,weakest_link,details,adjustment,updated_next_action,prompt_time,prompt_place,minimum_motivation_easy,task_decision,motivation_conflict,outcome,created_at,updated_at FROM one_time_diagnosis_round";

fn event_from_row(r: &Row) -> rusqlite::Result<OneTimeTaskEvent> {
    Ok(OneTimeTaskEvent { id: r.get(0)?, uuid: r.get(1)?, task_id: r.get(2)?, event_type: r.get(3)?, notes: r.get(4)?, created_at: r.get(5)? })
}

fn clean(value: Option<String>) -> Option<String> {
    value.and_then(|v| { let t = v.trim().to_string(); if t.is_empty() { None } else { Some(t) } })
}

fn insert_event(c: &rusqlite::Connection, task_id: i64, event_type: &str, notes: Option<&str>) -> Result<(), String> {
    c.execute(
        "INSERT INTO one_time_task_event (uuid,task_id,event_type,notes,created_at) VALUES (?1,?2,?3,?4,?5)",
        params![uuid::new_id(), task_id, event_type, notes, db::now()],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_one_time_task(state: tauri::State<Db>, title: String) -> Result<OneTimeTask, String> {
    let title = title.trim();
    if title.is_empty() { return Err("请先写下要完成的事情".into()); }
    let c = conn(&state)?;
    let now = db::now();
    c.execute(
        "INSERT INTO one_time_task (uuid,title,created_at,updated_at) VALUES (?1,?2,?3,?3)",
        params![uuid::new_id(), title, now],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    insert_event(&c, id, "created", Some("已捕获一次性行为"))?;
    c.query_row(&format!("{TASK_SELECT} WHERE id=?1"), [id], task_from_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_one_time_tasks(state: tauri::State<Db>, include_archived: bool) -> Result<Vec<OneTimeTask>, String> {
    let c = conn(&state)?;
    let sql = format!("{TASK_SELECT} WHERE (?1=1 OR archived_at IS NULL) ORDER BY CASE WHEN status IN ('completed','cancelled','delegated') THEN 1 ELSE 0 END, updated_at DESC");
    let mut stmt = c.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([include_archived], task_from_row).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_one_time_task(state: tauri::State<Db>, task_id: i64) -> Result<OneTimeTask, String> {
    let c = conn(&state)?;
    c.query_row(&format!("{TASK_SELECT} WHERE id=?1"), [task_id], task_from_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_one_time_task(state: tauri::State<Db>, input: SaveOneTimeTaskInput) -> Result<OneTimeTask, String> {
    let title = input.title.trim().to_string();
    let next_action = input.next_action.trim().to_string();
    if title.is_empty() { return Err("任务内容不能为空".into()); }
    if input.status != "draft" && next_action.is_empty() { return Err("继续前请写下当前唯一的下一动作".into()); }
    if input.status == "completed" && clean(input.completion_standard.clone()).is_none() {
        return Err("标记完成前，请确认怎样算完成".into());
    }
    let c = conn(&state)?;
    let old_status: String = c.query_row("SELECT status FROM one_time_task WHERE id=?1", [input.id], |r| r.get(0)).map_err(|e| e.to_string())?;
    let now = db::now();
    c.execute(
        "UPDATE one_time_task SET title=?2,completion_standard=?3,next_action=?4,deadline=?5,completion_evidence=?6,current_intent=?7,current_route=?8,status=?9,decision_note=?10,celebration=?11,started_at=CASE WHEN ?9='in_progress' THEN COALESCE(started_at,?12) ELSE started_at END,completed_at=CASE WHEN ?9='completed' THEN COALESCE(completed_at,?12) WHEN ?9!='completed' THEN NULL ELSE completed_at END,updated_at=?12 WHERE id=?1",
        params![input.id, title, clean(input.completion_standard), next_action, clean(input.deadline), clean(input.completion_evidence), clean(input.current_intent), input.current_route, input.status, clean(input.decision_note.clone()), clean(input.celebration), now],
    ).map_err(|e| e.to_string())?;
    if old_status != input.status {
        insert_event(&c, input.id, &format!("status:{}", input.status), clean(input.decision_note).as_deref())?;
    }
    c.query_row(&format!("{TASK_SELECT} WHERE id=?1"), [input.id], task_from_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_one_time_archived(state: tauri::State<Db>, task_id: i64, archived: bool) -> Result<(), String> {
    let c = conn(&state)?;
    let now = db::now();
    c.execute("UPDATE one_time_task SET archived_at=CASE WHEN ?2=1 THEN ?3 ELSE NULL END,updated_at=?3 WHERE id=?1", params![task_id, archived, now]).map_err(|e| e.to_string())?;
    insert_event(&c, task_id, if archived { "archived" } else { "restored" }, None)
}

#[tauri::command]
pub fn save_one_time_diagnosis(state: tauri::State<Db>, input: SaveOneTimeDiagnosisInput) -> Result<OneTimeDiagnosisRound, String> {
    if !matches!(input.selected_factor.as_str(), "P" | "A" | "M") { return Err("诊断因素必须是 P、A 或 M".into()); }
    let c = conn(&state)?;
    let round_number: i64 = c.query_row(
        "SELECT COALESCE(MAX(round_number),0)+1 FROM one_time_diagnosis_round WHERE task_id=?1",
        [input.task_id], |r| r.get(0),
    ).map_err(|e| e.to_string())?;
    let now = db::now();
    c.execute(
        "INSERT INTO one_time_diagnosis_round (uuid,task_id,round_number,entry_mode,symptom,recommended_factor,selected_factor,target_side,problem_type,method,weakest_link,details,adjustment,updated_next_action,prompt_time,prompt_place,minimum_motivation_easy,task_decision,motivation_conflict,outcome,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?21)",
        params![uuid::new_id(),input.task_id,round_number,input.entry_mode,clean(input.symptom),clean(input.recommended_factor),input.selected_factor,clean(input.target_side),clean(input.problem_type),clean(input.method),clean(input.weakest_link),clean(input.details),clean(input.adjustment),clean(input.updated_next_action.clone()),clean(input.prompt_time),clean(input.prompt_place),input.minimum_motivation_easy,clean(input.task_decision.clone()),clean(input.motivation_conflict),clean(input.outcome.clone()),now],
    ).map_err(|e| e.to_string())?;
    let id = c.last_insert_rowid();
    let new_action = clean(input.updated_next_action);
    let decision = clean(input.task_decision);
    let status = match decision.as_deref() { Some("cancelled") => Some("cancelled"), Some("delegated") => Some("delegated"), Some("deferred") => Some("deferred"), _ => None };
    c.execute(
        "UPDATE one_time_task SET next_action=COALESCE(?2,next_action),current_route='action',current_intent=?3,status=COALESCE(?4,status),updated_at=?5 WHERE id=?1",
        params![input.task_id,new_action,input.outcome,status,db::now()],
    ).map_err(|e| e.to_string())?;
    insert_event(&c, input.task_id, "diagnosis", Some(&format!("第 {round_number} 轮：{}", input.selected_factor)))?;
    c.query_row(&format!("{ROUND_SELECT} WHERE id=?1"), [id], round_from_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_one_time_diagnoses(state: tauri::State<Db>, task_id: i64) -> Result<Vec<OneTimeDiagnosisRound>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare(&format!("{ROUND_SELECT} WHERE task_id=?1 ORDER BY round_number DESC")).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([task_id], round_from_row).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn record_one_time_event(state: tauri::State<Db>, task_id: i64, event_type: String, notes: Option<String>) -> Result<(), String> {
    let c = conn(&state)?;
    insert_event(&c, task_id, &event_type, clean(notes).as_deref())
}

#[tauri::command]
pub fn list_one_time_events(state: tauri::State<Db>, task_id: i64) -> Result<Vec<OneTimeTaskEvent>, String> {
    let c = conn(&state)?;
    let mut stmt = c.prepare("SELECT id,uuid,task_id,event_type,notes,created_at FROM one_time_task_event WHERE task_id=?1 ORDER BY created_at DESC,id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([task_id], event_from_row).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn convert_one_time_to_habit(state: tauri::State<Db>, task_id: i64) -> Result<i64, String> {
    let c = conn(&state)?;
    if let Some(existing) = c.query_row("SELECT converted_project_id FROM one_time_task WHERE id=?1", [task_id], |r| r.get::<_, Option<i64>>(0)).optional().map_err(|e| e.to_string())?.flatten() {
        return Ok(existing);
    }
    let (title, standard, action): (String, Option<String>, String) = c.query_row(
        "SELECT title,completion_standard,next_action FROM one_time_task WHERE id=?1", [task_id],
        |r| Ok((r.get(0)?,r.get(1)?,r.get(2)?)),
    ).map_err(|e| e.to_string())?;
    let now = db::now();
    c.execute("INSERT INTO habit_project (uuid,name,phase,current_step,created_at,updated_at) VALUES (?1,?2,'designing',1,?3,?3)", params![uuid::new_id(),title,now]).map_err(|e| e.to_string())?;
    let project_id = c.last_insert_rowid();
    let notes = format!("由一次性行为转换。\n完成标准：{}\n当时的下一动作：{}", standard.unwrap_or_default(), action);
    c.execute("INSERT INTO aspiration (uuid,project_id,raw_input,final_aspiration,notes,created_at) VALUES (?1,?2,?3,?3,?4,?5)", params![uuid::new_id(),project_id,title,notes,now]).map_err(|e| e.to_string())?;
    c.execute("UPDATE one_time_task SET converted_project_id=?2,updated_at=?3 WHERE id=?1", params![task_id,project_id,db::now()]).map_err(|e| e.to_string())?;
    insert_event(&c, task_id, "converted_to_habit", Some(&format!("已转为长期习惯设计 #{project_id}")))?;
    Ok(project_id)
}

#[tauri::command]
pub fn delete_one_time_task(
    app: tauri::AppHandle,
    state: tauri::State<Db>,
    task_id: i64,
    confirmation: String,
) -> Result<String, String> {
    let c = conn(&state)?;
    let title: String = c.query_row("SELECT title FROM one_time_task WHERE id=?1", [task_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    if confirmation.trim() != title {
        return Err("删除确认名称不匹配".to_string());
    }
    let backup_path = crate::commands::backups::protective_snapshot(
        &app,
        &c,
        &format!("删除一次性行为“{}”前的保护快照", title),
    )?;
    c.execute("DELETE FROM one_time_task WHERE id=?1", [task_id]).map_err(|e| e.to_string())?;
    Ok(backup_path)
}
