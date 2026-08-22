mod commands;
mod db;
mod models;
mod uuid;

use db::Db;
use tauri::Manager;

/// 返回当前数据库中的业务表名（用于验证迁移是否执行）。
#[tauri::command]
fn db_tables(state: tauri::State<Db>) -> Result<Vec<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .map_err(|e| e.to_string())?;
    let tables = stmt
        .query_map([], |r| r.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(tables)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let db = db::open(&dir.join("fogg-lab.db"))?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db_tables,
            commands::projects::create_project,
            commands::projects::list_projects,
            commands::projects::get_project,
            commands::projects::rename_project,
            commands::projects::set_project_area,
            commands::projects::set_project_step,
            commands::projects::set_project_phase,
            commands::projects::set_project_paused,
            commands::projects::set_project_archived,
            commands::projects::duplicate_project,
            commands::projects::delete_project,
            commands::steps::get_aspiration,
            commands::steps::save_aspiration,
            commands::steps::list_behavior_options,
            commands::steps::add_behavior_option,
            commands::steps::update_behavior_option,
            commands::steps::save_focus_placement,
            commands::steps::list_focus_placements,
            commands::steps::choose_golden_behavior,
            commands::steps::get_golden_behavior,
            commands::steps::save_ability_assessment,
            commands::steps::get_ability_assessment,
            commands::steps::save_tiny_behavior,
            commands::steps::get_tiny_behavior,
            commands::steps::list_anchors,
            commands::steps::add_anchor,
            commands::steps::update_anchor,
            commands::steps::select_anchor,
            commands::steps::list_celebrations,
            commands::steps::add_celebration,
            commands::steps::select_celebration,
            commands::steps::generate_recipe,
            commands::steps::get_active_recipe,
            commands::design::list_behavior_options_v2,
            commands::design::add_behavior_option_v2,
            commands::design::update_behavior_option_v2,
            commands::design::save_focus_placement_v2,
            commands::design::list_focus_placements_v2,
            commands::design::list_golden_behaviors,
            commands::design::set_golden_behavior,
            commands::design::list_habit_branches,
            commands::design::create_habit_branch,
            commands::design::update_habit_branch,
            commands::design::delete_habit_branch,
            commands::design::get_branch_ability,
            commands::design::save_branch_ability,
            commands::design::get_branch_tiny,
            commands::design::save_branch_tiny,
            commands::design::list_branch_anchors,
            commands::design::add_branch_anchor,
            commands::design::select_branch_anchor,
            commands::design::delete_branch_anchor,
            commands::design::list_branch_celebrations,
            commands::design::add_branch_celebration,
            commands::design::select_branch_celebration,
            commands::design::delete_branch_celebration,
            commands::design::generate_branch_recipe,
            commands::design::get_active_branch_recipe,
            commands::design::list_branch_recipe_versions,
            commands::design::record_branch_practice,
            commands::design::list_branch_practice_events,
            commands::design::diagnose_branch_practice,
            commands::design::list_personal_references,
            commands::design::save_personal_reference,
            commands::design::delete_personal_reference,
            commands::one_time::create_one_time_task,
            commands::one_time::list_one_time_tasks,
            commands::one_time::get_one_time_task,
            commands::one_time::save_one_time_task,
            commands::one_time::set_one_time_archived,
            commands::one_time::save_one_time_diagnosis,
            commands::one_time::list_one_time_diagnoses,
            commands::one_time::record_one_time_event,
            commands::one_time::list_one_time_events,
            commands::one_time::convert_one_time_to_habit,
            commands::one_time::delete_one_time_task,
            commands::old_habit::create_old_habit_project,
            commands::old_habit::list_old_habit_projects,
            commands::old_habit::get_old_habit_project,
            commands::old_habit::save_old_habit_project,
            commands::old_habit::set_old_habit_archived,
            commands::old_habit::delete_old_habit_project,
            commands::old_habit::list_old_habit_behaviors,
            commands::old_habit::save_old_habit_behavior,
            commands::old_habit::save_old_habit_behavior_layout,
            commands::old_habit::focus_old_habit_behavior,
            commands::old_habit::delete_old_habit_behavior,
            commands::old_habit::list_old_habit_strategies,
            commands::old_habit::save_old_habit_strategy,
            commands::old_habit::delete_old_habit_strategy,
            commands::old_habit::list_old_habit_observations,
            commands::old_habit::save_old_habit_observation,
            commands::old_habit::get_old_habit_replacement,
            commands::old_habit::save_old_habit_replacement,
            commands::old_habit::create_replacement_habit_project,
            commands::practice::record_practice,
            commands::practice::list_practice_events,
            commands::practice::diagnose,
            commands::practice::list_diagnoses,
            commands::practice::list_recipe_versions,
            commands::backups::backup,
            commands::backups::list_backups,
            commands::backups::delete_backup,
            commands::backups::restore_backup,
            commands::backups::export_all,
            commands::backups::export_project,
            commands::backups::save_export,
            commands::backups::import_json,
            commands::applock::has_passcode,
            commands::applock::set_passcode,
            commands::applock::verify_passcode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
