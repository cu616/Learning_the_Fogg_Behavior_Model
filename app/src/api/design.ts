import { invoke } from "@tauri-apps/api/core";
import type {
  BehaviorOptionV2,
  BranchAbility,
  BranchAnchor,
  BranchCelebration,
  BranchObstacleDiagnosis,
  BranchPracticeEvent,
  BranchRecipeVersion,
  BranchTinyBehavior,
  FocusPlacementV2,
  GoldenBehaviorV2,
  HabitBranch,
  PersonalReferenceItem,
  ReferenceKind,
} from "../types";

export const listBehaviorOptionsV2 = (projectId: number) =>
  invoke<BehaviorOptionV2[]>("list_behavior_options_v2", { projectId });

export const addBehaviorOptionV2 = (
  projectId: number,
  text: string,
  source = "用户",
  swarmPosX: number | null = null,
  swarmPosY: number | null = null,
) => invoke<BehaviorOptionV2>("add_behavior_option_v2", { projectId, text, source, swarmPosX, swarmPosY });

export const updateBehaviorOptionV2 = (
  id: number,
  data: {
    text?: string | null;
    status?: string | null;
    swarmPosX?: number | null;
    swarmPosY?: number | null;
    updatePosition?: boolean;
    swarmWidth?: number | null;
    swarmHeight?: number | null;
    updateSize?: boolean;
  },
) => invoke<BehaviorOptionV2>("update_behavior_option_v2", {
  id,
  text: data.text ?? null,
  status: data.status ?? null,
  swarmPosX: data.swarmPosX ?? null,
  swarmPosY: data.swarmPosY ?? null,
  updatePosition: data.updatePosition ?? false,
  swarmWidth: data.swarmWidth ?? null,
  swarmHeight: data.swarmHeight ?? null,
  updateSize: data.updateSize ?? false,
});

export const listFocusPlacementsV2 = (projectId: number) =>
  invoke<FocusPlacementV2[]>("list_focus_placements_v2", { projectId });

export const saveFocusPlacementV2 = (
  behaviorOptionId: number,
  impact: number,
  feasibility: number,
  posX: number,
  posY: number,
) => invoke<FocusPlacementV2>("save_focus_placement_v2", { behaviorOptionId, impact, feasibility, posX, posY });

export const listGoldenBehaviors = (projectId: number) =>
  invoke<GoldenBehaviorV2[]>("list_golden_behaviors", { projectId });

export const setGoldenBehavior = (
  projectId: number,
  behaviorOptionId: number,
  selected: boolean,
  reason: string | null = null,
) => invoke<GoldenBehaviorV2[]>("set_golden_behavior", { projectId, behaviorOptionId, selected, reason });

export const listHabitBranches = (projectId: number) =>
  invoke<HabitBranch[]>("list_habit_branches", { projectId });

export const createHabitBranch = (projectId: number, goldenBehaviorId: number | null, name: string | null) =>
  invoke<HabitBranch>("create_habit_branch", { projectId, goldenBehaviorId, name });

export const updateHabitBranch = (branchId: number, name: string | null, status: string | null) =>
  invoke<HabitBranch>("update_habit_branch", { branchId, name, status });

export const deleteHabitBranch = (branchId: number) =>
  invoke<string>("delete_habit_branch", { branchId });

export const getBranchAbility = (branchId: number) =>
  invoke<BranchAbility | null>("get_branch_ability", { branchId });

export const saveBranchAbility = (branchId: number, data: {
  weakestLink: string | null;
  weakestDetails: string | null;
  simplificationMethods: string | null;
  skillTarget: string | null;
  skillPlan: string | null;
  toolsNeeded: string | null;
  resourcesAvailable: string | null;
}) => invoke<BranchAbility>("save_branch_ability", { branchId, ...data });

export const getBranchTiny = (branchId: number) =>
  invoke<BranchTinyBehavior | null>("get_branch_tiny", { branchId });

export const saveBranchTiny = (branchId: number, data: {
  originalBehavior: string | null;
  tinyBehavior: string | null;
  entryStep: string | null;
  baseline: string | null;
  optionalExtension: string | null;
}) => invoke<BranchTinyBehavior>("save_branch_tiny", { branchId, ...data });

export const listBranchAnchors = (branchId: number) =>
  invoke<BranchAnchor[]>("list_branch_anchors", { branchId });

export const addBranchAnchor = (branchId: number, data: {
  anchorText: string;
  lastAction: string | null;
  location: string | null;
  frequency: string | null;
  source?: string;
}) => invoke<BranchAnchor>("add_branch_anchor", { branchId, ...data, source: data.source ?? "用户" });

export const selectBranchAnchor = (branchId: number, anchorId: number) =>
  invoke<void>("select_branch_anchor", { branchId, anchorId });

export const deleteBranchAnchor = (branchId: number, anchorId: number) =>
  invoke<void>("delete_branch_anchor", { branchId, anchorId });

export const listBranchCelebrations = (branchId: number) =>
  invoke<BranchCelebration[]>("list_branch_celebrations", { branchId });

export const addBranchCelebration = (branchId: number, data: {
  celebrationText: string;
  naturalness: number | null;
  successFeeling: number | null;
  source?: string;
}) => invoke<BranchCelebration>("add_branch_celebration", { branchId, ...data, source: data.source ?? "用户" });

export const selectBranchCelebration = (branchId: number, celebrationId: number) =>
  invoke<void>("select_branch_celebration", { branchId, celebrationId });

export const deleteBranchCelebration = (branchId: number, celebrationId: number) =>
  invoke<void>("delete_branch_celebration", { branchId, celebrationId });

export const generateBranchRecipe = (branchId: number) =>
  invoke<BranchRecipeVersion>("generate_branch_recipe", { branchId, rehearsalCount: null, rehearsalFeeling: null });

export const getActiveBranchRecipe = (branchId: number) =>
  invoke<BranchRecipeVersion | null>("get_active_branch_recipe", { branchId });

export const listBranchRecipeVersions = (branchId: number) =>
  invoke<BranchRecipeVersion[]>("list_branch_recipe_versions", { branchId });

export const recordBranchPractice = (branchId: number, result: string, feeling: string | null, context: string | null) =>
  invoke<BranchPracticeEvent>("record_branch_practice", { branchId, result, feeling, context });

export const listBranchPracticeEvents = (branchId: number) =>
  invoke<BranchPracticeEvent[]>("list_branch_practice_events", { branchId });

export const diagnoseBranchPractice = (branchId: number, practiceEventId: number) =>
  invoke<BranchObstacleDiagnosis>("diagnose_branch_practice", { branchId, practiceEventId });

export const listPersonalReferences = (kind?: ReferenceKind) =>
  invoke<PersonalReferenceItem[]>("list_personal_references", { kind: kind ?? null });

export const savePersonalReference = (data: {
  id?: number | null;
  kind: ReferenceKind;
  title?: string | null;
  content: string;
  structuredContent?: string | null;
  category?: string | null;
  tags?: string | null;
  source?: string | null;
}) => invoke<PersonalReferenceItem>("save_personal_reference", {
  id: data.id ?? null,
  kind: data.kind,
  title: data.title ?? null,
  content: data.content,
  structuredContent: data.structuredContent ?? null,
  category: data.category ?? null,
  tags: data.tags ?? null,
  source: data.source ?? "用户",
});

export const deletePersonalReference = (id: number) =>
  invoke<void>("delete_personal_reference", { id });
