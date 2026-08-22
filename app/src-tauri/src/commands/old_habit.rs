use crate::commands::conn;
use crate::db::{self, Db};
use crate::models::{
    OldHabitBehavior, OldHabitObservation, OldHabitProject, OldHabitReplacement,
    OldHabitStrategy, SaveOldHabitBehaviorInput, SaveOldHabitObservationInput,
    SaveOldHabitProjectInput, SaveOldHabitReplacementInput, SaveOldHabitStrategyInput,
};
use crate::uuid;
use rusqlite::{params, OptionalExtension, Row};

fn clean(value: Option<String>) -> Option<String> {
    value.and_then(|v| { let t = v.trim().to_string(); if t.is_empty() { None } else { Some(t) } })
}

const PROJECT_SELECT: &str = "SELECT id,uuid,title,general_habit,preparation_mode,preparation_note,linked_habit_project_id,current_stage,status,archived_at,created_at,updated_at FROM old_habit_project";
const BEHAVIOR_SELECT: &str = "SELECT id,uuid,project_id,behavior_text,typical_time,typical_place,people,context,selection_reason,goal_type,goal_value,review_at,status,sort_order,pos_x,pos_y,card_width,card_height,created_at,updated_at FROM old_habit_behavior";
const STRATEGY_SELECT: &str = "SELECT id,uuid,project_id,behavior_id,factor,method,content,situation,status,notes,created_at,updated_at FROM old_habit_strategy";
const OBSERVATION_SELECT: &str = "SELECT id,uuid,project_id,behavior_id,result,prompt,is_new_prompt,uncovered_situation,adjustment,feeling,observed_at,created_at FROM old_habit_observation";
const REPLACEMENT_SELECT: &str = "SELECT id,uuid,project_id,behavior_id,old_prompt,new_behavior,celebration,rehearsal_count,notes,lower_old_motivation,harder_old_behavior,raise_new_motivation,easier_new_behavior,linked_habit_project_id,status,created_at,updated_at FROM old_habit_replacement";

fn project_from_row(r: &Row) -> rusqlite::Result<OldHabitProject> { Ok(OldHabitProject {
    id:r.get(0)?,uuid:r.get(1)?,title:r.get(2)?,general_habit:r.get(3)?,preparation_mode:r.get(4)?,preparation_note:r.get(5)?,linked_habit_project_id:r.get(6)?,current_stage:r.get(7)?,status:r.get(8)?,archived_at:r.get(9)?,created_at:r.get(10)?,updated_at:r.get(11)?,
}) }
fn behavior_from_row(r: &Row) -> rusqlite::Result<OldHabitBehavior> { Ok(OldHabitBehavior {
    id:r.get(0)?,uuid:r.get(1)?,project_id:r.get(2)?,behavior_text:r.get(3)?,typical_time:r.get(4)?,typical_place:r.get(5)?,people:r.get(6)?,context:r.get(7)?,selection_reason:r.get(8)?,goal_type:r.get(9)?,goal_value:r.get(10)?,review_at:r.get(11)?,status:r.get(12)?,sort_order:r.get(13)?,pos_x:r.get(14)?,pos_y:r.get(15)?,card_width:r.get(16)?,card_height:r.get(17)?,created_at:r.get(18)?,updated_at:r.get(19)?,
}) }
fn strategy_from_row(r: &Row) -> rusqlite::Result<OldHabitStrategy> { Ok(OldHabitStrategy {
    id:r.get(0)?,uuid:r.get(1)?,project_id:r.get(2)?,behavior_id:r.get(3)?,factor:r.get(4)?,method:r.get(5)?,content:r.get(6)?,situation:r.get(7)?,status:r.get(8)?,notes:r.get(9)?,created_at:r.get(10)?,updated_at:r.get(11)?,
}) }
fn observation_from_row(r: &Row) -> rusqlite::Result<OldHabitObservation> { Ok(OldHabitObservation {
    id:r.get(0)?,uuid:r.get(1)?,project_id:r.get(2)?,behavior_id:r.get(3)?,result:r.get(4)?,prompt:r.get(5)?,is_new_prompt:r.get(6)?,uncovered_situation:r.get(7)?,adjustment:r.get(8)?,feeling:r.get(9)?,observed_at:r.get(10)?,created_at:r.get(11)?,
}) }
fn replacement_from_row(r: &Row) -> rusqlite::Result<OldHabitReplacement> { Ok(OldHabitReplacement {
    id:r.get(0)?,uuid:r.get(1)?,project_id:r.get(2)?,behavior_id:r.get(3)?,old_prompt:r.get(4)?,new_behavior:r.get(5)?,celebration:r.get(6)?,rehearsal_count:r.get(7)?,notes:r.get(8)?,lower_old_motivation:r.get(9)?,harder_old_behavior:r.get(10)?,raise_new_motivation:r.get(11)?,easier_new_behavior:r.get(12)?,linked_habit_project_id:r.get(13)?,status:r.get(14)?,created_at:r.get(15)?,updated_at:r.get(16)?,
}) }

#[tauri::command]
pub fn create_old_habit_project(state: tauri::State<Db>, title: String) -> Result<OldHabitProject, String> {
    let title = title.trim(); if title.is_empty() { return Err("请先写下想减少或停止的旧习惯".into()); }
    let c=conn(&state)?; let now=db::now();
    c.execute("INSERT INTO old_habit_project (uuid,title,general_habit,created_at,updated_at) VALUES (?1,?2,?2,?3,?3)",params![uuid::new_id(),title,now]).map_err(|e|e.to_string())?;
    let id=c.last_insert_rowid(); c.query_row(&format!("{PROJECT_SELECT} WHERE id=?1"),[id],project_from_row).map_err(|e|e.to_string())
}

#[tauri::command]
pub fn list_old_habit_projects(state: tauri::State<Db>, include_archived: bool) -> Result<Vec<OldHabitProject>, String> {
    let c=conn(&state)?; let mut s=c.prepare(&format!("{PROJECT_SELECT} WHERE (?1=1 OR archived_at IS NULL) ORDER BY updated_at DESC")).map_err(|e|e.to_string())?;
    let rows=s.query_map([include_archived],project_from_row).map_err(|e|e.to_string())?; rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}

#[tauri::command]
pub fn get_old_habit_project(state: tauri::State<Db>, project_id:i64) -> Result<OldHabitProject,String> {
    let c=conn(&state)?; c.query_row(&format!("{PROJECT_SELECT} WHERE id=?1"),[project_id],project_from_row).map_err(|e|e.to_string())
}

#[tauri::command]
pub fn save_old_habit_project(state: tauri::State<Db>, input:SaveOldHabitProjectInput) -> Result<OldHabitProject,String> {
    let title=input.title.trim().to_string(); if title.is_empty(){return Err("项目名称不能为空".into());}
    let c=conn(&state)?; let now=db::now();
    c.execute("UPDATE old_habit_project SET title=?2,general_habit=?3,preparation_mode=?4,preparation_note=?5,linked_habit_project_id=?6,current_stage=?7,status=?8,updated_at=?9 WHERE id=?1",params![input.id,title,input.general_habit.trim(),input.preparation_mode,clean(input.preparation_note),input.linked_habit_project_id,input.current_stage,input.status,now]).map_err(|e|e.to_string())?;
    c.query_row(&format!("{PROJECT_SELECT} WHERE id=?1"),[input.id],project_from_row).map_err(|e|e.to_string())
}

#[tauri::command]
pub fn set_old_habit_archived(state:tauri::State<Db>,project_id:i64,archived:bool)->Result<(),String>{let c=conn(&state)?;let now=db::now();c.execute("UPDATE old_habit_project SET archived_at=CASE WHEN ?2=1 THEN ?3 ELSE NULL END,updated_at=?3 WHERE id=?1",params![project_id,archived,now]).map_err(|e|e.to_string())?;Ok(())}

#[tauri::command]
pub fn delete_old_habit_project(app:tauri::AppHandle,state:tauri::State<Db>,project_id:i64,confirmation:String)->Result<String,String>{let c=conn(&state)?;let title:String=c.query_row("SELECT title FROM old_habit_project WHERE id=?1",[project_id],|r|r.get(0)).map_err(|e|e.to_string())?;if confirmation.trim()!=title{return Err("删除确认名称不匹配".into());}let path=crate::commands::backups::protective_snapshot(&app,&c,&format!("删除终止旧习惯项目“{}”前的保护快照",title))?;c.execute("DELETE FROM old_habit_project WHERE id=?1",[project_id]).map_err(|e|e.to_string())?;Ok(path)}

#[tauri::command]
pub fn list_old_habit_behaviors(state:tauri::State<Db>,project_id:i64)->Result<Vec<OldHabitBehavior>,String>{let c=conn(&state)?;let mut s=c.prepare(&format!("{BEHAVIOR_SELECT} WHERE project_id=?1 ORDER BY sort_order,id")).map_err(|e|e.to_string())?;let rows=s.query_map([project_id],behavior_from_row).map_err(|e|e.to_string())?;rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())}

#[tauri::command]
pub fn save_old_habit_behavior(state:tauri::State<Db>,input:SaveOldHabitBehaviorInput)->Result<OldHabitBehavior,String>{let text=input.behavior_text.trim().to_string();if text.is_empty(){return Err("具体旧行为不能为空".into());}let c=conn(&state)?;let now=db::now();let id=if let Some(id)=input.id{c.execute("UPDATE old_habit_behavior SET behavior_text=?2,typical_time=?3,typical_place=?4,people=?5,context=?6,selection_reason=?7,goal_type=?8,goal_value=?9,review_at=?10,status=?11,pos_x=COALESCE(?12,pos_x),pos_y=COALESCE(?13,pos_y),card_width=COALESCE(?14,card_width),card_height=COALESCE(?15,card_height),updated_at=?16 WHERE id=?1",params![id,text,clean(input.typical_time),clean(input.typical_place),clean(input.people),clean(input.context),clean(input.selection_reason),input.goal_type,clean(input.goal_value),clean(input.review_at),input.status,input.pos_x,input.pos_y,input.card_width,input.card_height,now]).map_err(|e|e.to_string())?;id}else{let order:i64=c.query_row("SELECT COALESCE(MAX(sort_order),-1)+1 FROM old_habit_behavior WHERE project_id=?1",[input.project_id],|r|r.get(0)).map_err(|e|e.to_string())?;c.execute("INSERT INTO old_habit_behavior (uuid,project_id,behavior_text,typical_time,typical_place,people,context,selection_reason,goal_type,goal_value,review_at,status,sort_order,pos_x,pos_y,card_width,card_height,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?18)",params![uuid::new_id(),input.project_id,text,clean(input.typical_time),clean(input.typical_place),clean(input.people),clean(input.context),clean(input.selection_reason),input.goal_type,clean(input.goal_value),clean(input.review_at),input.status,order,input.pos_x,input.pos_y,input.card_width,input.card_height,now]).map_err(|e|e.to_string())?;c.last_insert_rowid()};c.query_row(&format!("{BEHAVIOR_SELECT} WHERE id=?1"),[id],behavior_from_row).map_err(|e|e.to_string())}

#[tauri::command]
pub fn save_old_habit_behavior_layout(state:tauri::State<Db>,behavior_id:i64,pos_x:f64,pos_y:f64,card_width:f64,card_height:f64)->Result<(),String>{
    let c=conn(&state)?;
    c.execute("UPDATE old_habit_behavior SET pos_x=?2,pos_y=?3,card_width=?4,card_height=?5,updated_at=?6 WHERE id=?1",params![behavior_id,pos_x.clamp(0.0,1.0),pos_y.clamp(0.0,1.0),card_width.clamp(140.0,420.0),card_height.clamp(72.0,280.0),db::now()]).map_err(|e|e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn focus_old_habit_behavior(state:tauri::State<Db>,project_id:i64,behavior_id:i64)->Result<(),String>{let c=conn(&state)?;let now=db::now();let tx=c.unchecked_transaction().map_err(|e|e.to_string())?;tx.execute("UPDATE old_habit_behavior SET status=CASE WHEN id=?2 THEN 'active' WHEN status='active' THEN 'queued' ELSE status END,updated_at=?3 WHERE project_id=?1",params![project_id,behavior_id,now]).map_err(|e|e.to_string())?;tx.execute("UPDATE old_habit_project SET current_stage='strategies',status='active',updated_at=?2 WHERE id=?1",params![project_id,now]).map_err(|e|e.to_string())?;tx.commit().map_err(|e|e.to_string())}

#[tauri::command]
pub fn delete_old_habit_behavior(app:tauri::AppHandle,state:tauri::State<Db>,behavior_id:i64)->Result<(),String>{let c=conn(&state)?;let text:String=c.query_row("SELECT behavior_text FROM old_habit_behavior WHERE id=?1",[behavior_id],|r|r.get(0)).map_err(|e|e.to_string())?;crate::commands::backups::protective_snapshot(&app,&c,&format!("删除具体旧行为“{}”及其记录前的保护快照",text))?;c.execute("DELETE FROM old_habit_behavior WHERE id=?1",[behavior_id]).map_err(|e|e.to_string())?;Ok(())}

#[tauri::command]
pub fn list_old_habit_strategies(state:tauri::State<Db>,behavior_id:i64)->Result<Vec<OldHabitStrategy>,String>{let c=conn(&state)?;let mut s=c.prepare(&format!("{STRATEGY_SELECT} WHERE behavior_id=?1 ORDER BY CASE factor WHEN 'P' THEN 1 WHEN 'A' THEN 2 ELSE 3 END,id")).map_err(|e|e.to_string())?;let rows=s.query_map([behavior_id],strategy_from_row).map_err(|e|e.to_string())?;rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())}

#[tauri::command]
pub fn save_old_habit_strategy(state:tauri::State<Db>,input:SaveOldHabitStrategyInput)->Result<OldHabitStrategy,String>{if !matches!(input.factor.as_str(),"P"|"A"|"M"){return Err("对策因素必须是 P、A 或 M".into());}let content=input.content.trim().to_string();if content.is_empty(){return Err("请写下具体对策".into());}let c=conn(&state)?;let now=db::now();let id=if let Some(id)=input.id{c.execute("UPDATE old_habit_strategy SET factor=?2,method=?3,content=?4,situation=?5,status=?6,notes=?7,updated_at=?8 WHERE id=?1",params![id,input.factor,input.method,content,clean(input.situation),input.status,clean(input.notes),now]).map_err(|e|e.to_string())?;id}else{c.execute("INSERT INTO old_habit_strategy (uuid,project_id,behavior_id,factor,method,content,situation,status,notes,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?10)",params![uuid::new_id(),input.project_id,input.behavior_id,input.factor,input.method,content,clean(input.situation),input.status,clean(input.notes),now]).map_err(|e|e.to_string())?;c.last_insert_rowid()};c.query_row(&format!("{STRATEGY_SELECT} WHERE id=?1"),[id],strategy_from_row).map_err(|e|e.to_string())}

#[tauri::command]
pub fn delete_old_habit_strategy(state:tauri::State<Db>,strategy_id:i64)->Result<(),String>{let c=conn(&state)?;c.execute("DELETE FROM old_habit_strategy WHERE id=?1",[strategy_id]).map_err(|e|e.to_string())?;Ok(())}

#[tauri::command]
pub fn list_old_habit_observations(state:tauri::State<Db>,behavior_id:i64)->Result<Vec<OldHabitObservation>,String>{let c=conn(&state)?;let mut s=c.prepare(&format!("{OBSERVATION_SELECT} WHERE behavior_id=?1 ORDER BY observed_at DESC,id DESC")).map_err(|e|e.to_string())?;let rows=s.query_map([behavior_id],observation_from_row).map_err(|e|e.to_string())?;rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())}

#[tauri::command]
pub fn save_old_habit_observation(state:tauri::State<Db>,input:SaveOldHabitObservationInput)->Result<OldHabitObservation,String>{if !matches!(input.result.as_str(),"not_happened"|"reduced"|"happened"|"no_context"|"brief"){return Err("观察结果无效".into());}let c=conn(&state)?;let now=db::now();let observed=clean(input.observed_at).unwrap_or_else(||now.clone());c.execute("INSERT INTO old_habit_observation (uuid,project_id,behavior_id,result,prompt,is_new_prompt,uncovered_situation,adjustment,feeling,observed_at,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",params![uuid::new_id(),input.project_id,input.behavior_id,input.result,clean(input.prompt),input.is_new_prompt,clean(input.uncovered_situation),clean(input.adjustment),clean(input.feeling),observed,now]).map_err(|e|e.to_string())?;let id=c.last_insert_rowid();c.execute("UPDATE old_habit_project SET current_stage='observe',status='observing',updated_at=?2 WHERE id=?1",params![input.project_id,db::now()]).map_err(|e|e.to_string())?;c.query_row(&format!("{OBSERVATION_SELECT} WHERE id=?1"),[id],observation_from_row).map_err(|e|e.to_string())}

#[tauri::command]
pub fn get_old_habit_replacement(state:tauri::State<Db>,behavior_id:i64)->Result<Option<OldHabitReplacement>,String>{let c=conn(&state)?;c.query_row(&format!("{REPLACEMENT_SELECT} WHERE behavior_id=?1"),[behavior_id],replacement_from_row).optional().map_err(|e|e.to_string())}

#[tauri::command]
pub fn save_old_habit_replacement(state:tauri::State<Db>,input:SaveOldHabitReplacementInput)->Result<OldHabitReplacement,String>{let c=conn(&state)?;let now=db::now();let existing:Option<i64>=c.query_row("SELECT id FROM old_habit_replacement WHERE behavior_id=?1",[input.behavior_id],|r|r.get(0)).optional().map_err(|e|e.to_string())?;let id=if let Some(id)=existing{c.execute("UPDATE old_habit_replacement SET old_prompt=?2,new_behavior=?3,celebration=?4,rehearsal_count=?5,notes=?6,lower_old_motivation=?7,harder_old_behavior=?8,raise_new_motivation=?9,easier_new_behavior=?10,status=?11,updated_at=?12 WHERE id=?1",params![id,clean(input.old_prompt),input.new_behavior.trim(),clean(input.celebration),input.rehearsal_count.max(0),clean(input.notes),clean(input.lower_old_motivation),clean(input.harder_old_behavior),clean(input.raise_new_motivation),clean(input.easier_new_behavior),input.status,now]).map_err(|e|e.to_string())?;id}else{c.execute("INSERT INTO old_habit_replacement (uuid,project_id,behavior_id,old_prompt,new_behavior,celebration,rehearsal_count,notes,lower_old_motivation,harder_old_behavior,raise_new_motivation,easier_new_behavior,status,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?14)",params![uuid::new_id(),input.project_id,input.behavior_id,clean(input.old_prompt),input.new_behavior.trim(),clean(input.celebration),input.rehearsal_count.max(0),clean(input.notes),clean(input.lower_old_motivation),clean(input.harder_old_behavior),clean(input.raise_new_motivation),clean(input.easier_new_behavior),input.status,now]).map_err(|e|e.to_string())?;c.last_insert_rowid()};c.execute("UPDATE old_habit_project SET current_stage='replace',status='replacing',updated_at=?2 WHERE id=?1",params![input.project_id,db::now()]).map_err(|e|e.to_string())?;c.query_row(&format!("{REPLACEMENT_SELECT} WHERE id=?1"),[id],replacement_from_row).map_err(|e|e.to_string())}

#[tauri::command]
pub fn create_replacement_habit_project(state:tauri::State<Db>,behavior_id:i64)->Result<i64,String>{let c=conn(&state)?;if let Some(id)=c.query_row("SELECT linked_habit_project_id FROM old_habit_replacement WHERE behavior_id=?1",[behavior_id],|r|r.get::<_,Option<i64>>(0)).optional().map_err(|e|e.to_string())?.flatten(){return Ok(id);}let (replacement_id,new_behavior,old_prompt):(i64,String,Option<String>)=c.query_row("SELECT id,new_behavior,old_prompt FROM old_habit_replacement WHERE behavior_id=?1",[behavior_id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).map_err(|_|"请先填写并保存替代行为".to_string())?;if new_behavior.trim().is_empty(){return Err("请先填写替代行为".into());}let now=db::now();c.execute("INSERT INTO habit_project (uuid,name,phase,current_step,created_at,updated_at) VALUES (?1,?2,'designing',1,?3,?3)",params![uuid::new_id(),new_behavior,now]).map_err(|e|e.to_string())?;let project_id=c.last_insert_rowid();let notes=format!("由终止旧习惯的替代方案创建。\n原提示：{}",old_prompt.unwrap_or_default());c.execute("INSERT INTO aspiration (uuid,project_id,raw_input,final_aspiration,notes,created_at) VALUES (?1,?2,?3,?3,?4,?5)",params![uuid::new_id(),project_id,new_behavior,notes,now]).map_err(|e|e.to_string())?;c.execute("UPDATE old_habit_replacement SET linked_habit_project_id=?2,updated_at=?3 WHERE id=?1",params![replacement_id,project_id,db::now()]).map_err(|e|e.to_string())?;Ok(project_id)}
