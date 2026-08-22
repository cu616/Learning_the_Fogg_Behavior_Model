use serde::{Deserialize, Serialize};

// 所有实体结构体：字段与 DB 列一致（snake_case），JSON 序列化为 camelCase 以匹配前端 TS 类型。

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitProject {
    pub id: i64,
    pub uuid: String,
    pub name: String,
    pub aspiration_area: Option<String>,
    pub phase: String,
    pub paused_at: Option<String>,
    pub archived_at: Option<String>,
    pub current_step: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Aspiration {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub raw_input: Option<String>,
    pub input_type: Option<String>,
    pub final_aspiration: Option<String>,
    pub why_important: Option<String>,
    pub life_difference: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BehaviorOption {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub text: String,
    pub source: String,
    pub status: String,
    pub notes: Option<String>,
    pub batch: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusPlacement {
    pub id: i64,
    pub uuid: String,
    pub behavior_option_id: i64,
    pub impact: Option<i64>,
    pub feasibility: Option<i64>,
    pub willing: Option<bool>,
    pub pos_x: Option<f64>,
    pub pos_y: Option<f64>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoldenBehavior {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub behavior_option_id: i64,
    pub reason: Option<String>,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AbilityAssessment {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub time_factor: Option<String>,
    pub money_factor: Option<String>,
    pub energy_factor: Option<String>,
    pub brain_factor: Option<String>,
    pub schedule_factor: Option<String>,
    pub weakest_link: Option<String>,
    pub simplification_methods: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TinyBehavior {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub original_behavior: Option<String>,
    pub tiny_behavior: Option<String>,
    pub entry_step: Option<String>,
    pub baseline: Option<String>,
    pub optional_extension: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Anchor {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub anchor_text: String,
    pub last_action: Option<String>,
    pub location: Option<String>,
    pub frequency: Option<String>,
    pub source: String,
    pub is_selected: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Celebration {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub celebration_text: String,
    pub naturalness: Option<i64>,
    pub success_feeling: Option<i64>,
    pub source: String,
    pub is_selected: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeVersion {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub version_number: i64,
    pub anchor_last_action: Option<String>,
    pub behavior_text: Option<String>,
    pub celebration_text: Option<String>,
    pub full_recipe_text: Option<String>,
    pub rehearsal_count: Option<i64>,
    pub rehearsal_feeling: Option<String>,
    pub change_id: Option<i64>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PracticeEvent {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub recipe_version_id: i64,
    pub result: String,
    pub feeling: Option<String>,
    pub context: Option<String>,
    pub occurred_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ObstacleDiagnosis {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub practice_event_id: Option<i64>,
    pub obstacle_type: Option<String>,
    pub diagnosis_path: Option<String>,
    pub suggestion: Option<String>,
    pub return_step: Option<i64>,
    pub user_decision: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectChange {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub entity: Option<String>,
    pub field_name: Option<String>,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupRecord {
    pub id: i64,
    pub project_id: Option<i64>,
    pub backup_type: String,
    pub file_path: String,
    pub content_summary: Option<String>,
    pub schema_version: Option<i64>,
    pub created_at: String,
}

// ===== v3：多黄金行为、分支级设计与个人参考库 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BehaviorOptionV2 {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub text: String,
    pub source: String,
    pub status: String,
    pub notes: Option<String>,
    pub sort_order: i64,
    pub swarm_pos_x: Option<f64>,
    pub swarm_pos_y: Option<f64>,
    pub swarm_width: Option<f64>,
    pub swarm_height: Option<f64>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusPlacementV2 {
    pub behavior_option_id: i64,
    pub impact: Option<i64>,
    pub feasibility: Option<i64>,
    pub pos_x: Option<f64>,
    pub pos_y: Option<f64>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoldenBehaviorV2 {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub behavior_option_id: i64,
    pub behavior_text: String,
    pub reason: Option<String>,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitBranch {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub golden_behavior_id: Option<i64>,
    pub behavior_option_id: Option<i64>,
    pub behavior_text: Option<String>,
    pub name: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchAbility {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub branch_id: i64,
    pub weakest_link: Option<String>,
    pub weakest_details: Option<String>,
    pub simplification_methods: Option<String>,
    pub skill_target: Option<String>,
    pub skill_plan: Option<String>,
    pub tools_needed: Option<String>,
    pub resources_available: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchTinyBehavior {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub branch_id: i64,
    pub original_behavior: Option<String>,
    pub tiny_behavior: Option<String>,
    pub entry_step: Option<String>,
    pub baseline: Option<String>,
    pub optional_extension: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchAnchor {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub branch_id: i64,
    pub anchor_text: String,
    pub last_action: Option<String>,
    pub location: Option<String>,
    pub frequency: Option<String>,
    pub source: String,
    pub is_selected: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchCelebration {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub branch_id: i64,
    pub celebration_text: String,
    pub naturalness: Option<i64>,
    pub success_feeling: Option<i64>,
    pub source: String,
    pub is_selected: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchRecipeVersion {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub branch_id: i64,
    pub version_number: i64,
    pub anchor_last_action: Option<String>,
    pub behavior_text: Option<String>,
    pub celebration_text: Option<String>,
    pub full_recipe_text: Option<String>,
    pub rehearsal_count: Option<i64>,
    pub rehearsal_feeling: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchPracticeEvent {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub branch_id: i64,
    pub recipe_version_id: i64,
    pub result: String,
    pub feeling: Option<String>,
    pub context: Option<String>,
    pub occurred_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchObstacleDiagnosis {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub branch_id: i64,
    pub practice_event_id: Option<i64>,
    pub obstacle_type: Option<String>,
    pub diagnosis_path: Option<String>,
    pub suggestion: Option<String>,
    pub return_step: Option<i64>,
    pub user_decision: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalReferenceItem {
    pub id: i64,
    pub uuid: String,
    pub kind: String,
    pub title: Option<String>,
    pub content: String,
    pub structured_content: Option<String>,
    pub category: Option<String>,
    pub tags: Option<String>,
    pub source: String,
    pub created_at: String,
    pub updated_at: String,
}

// ===== v4：一次性行为快速流程 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OneTimeTask {
    pub id: i64,
    pub uuid: String,
    pub title: String,
    pub completion_standard: Option<String>,
    pub next_action: String,
    pub deadline: Option<String>,
    pub completion_evidence: Option<String>,
    pub current_intent: Option<String>,
    pub current_route: String,
    pub status: String,
    pub decision_note: Option<String>,
    pub celebration: Option<String>,
    pub converted_project_id: Option<i64>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OneTimeDiagnosisRound {
    pub id: i64,
    pub uuid: String,
    pub task_id: i64,
    pub round_number: i64,
    pub entry_mode: String,
    pub symptom: Option<String>,
    pub recommended_factor: Option<String>,
    pub selected_factor: String,
    pub target_side: Option<String>,
    pub problem_type: Option<String>,
    pub method: Option<String>,
    pub weakest_link: Option<String>,
    pub details: Option<String>,
    pub adjustment: Option<String>,
    pub updated_next_action: Option<String>,
    pub prompt_time: Option<String>,
    pub prompt_place: Option<String>,
    pub minimum_motivation_easy: Option<bool>,
    pub task_decision: Option<String>,
    pub motivation_conflict: Option<String>,
    pub outcome: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OneTimeTaskEvent {
    pub id: i64,
    pub uuid: String,
    pub task_id: i64,
    pub event_type: String,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOneTimeTaskInput {
    pub id: i64,
    pub title: String,
    pub completion_standard: Option<String>,
    pub next_action: String,
    pub deadline: Option<String>,
    pub completion_evidence: Option<String>,
    pub current_intent: Option<String>,
    pub current_route: String,
    pub status: String,
    pub decision_note: Option<String>,
    pub celebration: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOneTimeDiagnosisInput {
    pub task_id: i64,
    pub entry_mode: String,
    pub symptom: Option<String>,
    pub recommended_factor: Option<String>,
    pub selected_factor: String,
    pub target_side: Option<String>,
    pub problem_type: Option<String>,
    pub method: Option<String>,
    pub weakest_link: Option<String>,
    pub details: Option<String>,
    pub adjustment: Option<String>,
    pub updated_next_action: Option<String>,
    pub prompt_time: Option<String>,
    pub prompt_place: Option<String>,
    pub minimum_motivation_easy: Option<bool>,
    pub task_decision: Option<String>,
    pub motivation_conflict: Option<String>,
    pub outcome: Option<String>,
}

// ===== v6：终止旧习惯工作流 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OldHabitProject {
    pub id: i64,
    pub uuid: String,
    pub title: String,
    pub general_habit: String,
    pub preparation_mode: String,
    pub preparation_note: Option<String>,
    pub linked_habit_project_id: Option<i64>,
    pub current_stage: String,
    pub status: String,
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OldHabitBehavior {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub behavior_text: String,
    pub typical_time: Option<String>,
    pub typical_place: Option<String>,
    pub people: Option<String>,
    pub context: Option<String>,
    pub selection_reason: Option<String>,
    pub goal_type: String,
    pub goal_value: Option<String>,
    pub review_at: Option<String>,
    pub status: String,
    pub sort_order: i64,
    pub pos_x: Option<f64>,
    pub pos_y: Option<f64>,
    pub card_width: Option<f64>,
    pub card_height: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OldHabitStrategy {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub behavior_id: i64,
    pub factor: String,
    pub method: String,
    pub content: String,
    pub situation: Option<String>,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OldHabitObservation {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub behavior_id: i64,
    pub result: String,
    pub prompt: Option<String>,
    pub is_new_prompt: Option<bool>,
    pub uncovered_situation: Option<String>,
    pub adjustment: Option<String>,
    pub feeling: Option<String>,
    pub observed_at: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OldHabitReplacement {
    pub id: i64,
    pub uuid: String,
    pub project_id: i64,
    pub behavior_id: i64,
    pub old_prompt: Option<String>,
    pub new_behavior: String,
    pub celebration: Option<String>,
    pub rehearsal_count: i64,
    pub notes: Option<String>,
    pub lower_old_motivation: Option<String>,
    pub harder_old_behavior: Option<String>,
    pub raise_new_motivation: Option<String>,
    pub easier_new_behavior: Option<String>,
    pub linked_habit_project_id: Option<i64>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOldHabitProjectInput {
    pub id: i64,
    pub title: String,
    pub general_habit: String,
    pub preparation_mode: String,
    pub preparation_note: Option<String>,
    pub linked_habit_project_id: Option<i64>,
    pub current_stage: String,
    pub status: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOldHabitBehaviorInput {
    pub id: Option<i64>,
    pub project_id: i64,
    pub behavior_text: String,
    pub typical_time: Option<String>,
    pub typical_place: Option<String>,
    pub people: Option<String>,
    pub context: Option<String>,
    pub selection_reason: Option<String>,
    pub goal_type: String,
    pub goal_value: Option<String>,
    pub review_at: Option<String>,
    pub status: String,
    pub pos_x: Option<f64>,
    pub pos_y: Option<f64>,
    pub card_width: Option<f64>,
    pub card_height: Option<f64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOldHabitStrategyInput {
    pub id: Option<i64>,
    pub project_id: i64,
    pub behavior_id: i64,
    pub factor: String,
    pub method: String,
    pub content: String,
    pub situation: Option<String>,
    pub status: String,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOldHabitObservationInput {
    pub project_id: i64,
    pub behavior_id: i64,
    pub result: String,
    pub prompt: Option<String>,
    pub is_new_prompt: Option<bool>,
    pub uncovered_situation: Option<String>,
    pub adjustment: Option<String>,
    pub feeling: Option<String>,
    pub observed_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOldHabitReplacementInput {
    pub project_id: i64,
    pub behavior_id: i64,
    pub old_prompt: Option<String>,
    pub new_behavior: String,
    pub celebration: Option<String>,
    pub rehearsal_count: i64,
    pub notes: Option<String>,
    pub lower_old_motivation: Option<String>,
    pub harder_old_behavior: Option<String>,
    pub raise_new_motivation: Option<String>,
    pub easier_new_behavior: Option<String>,
    pub status: String,
}
