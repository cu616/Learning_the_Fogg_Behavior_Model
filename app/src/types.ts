// 与 Rust 后端 models.rs（serde camelCase）对齐的前端类型。

export type Phase = "draft" | "designing" | "ready" | "experimenting" | "stable";

export type DisplayStatus = "设计中" | "实践中" | "稳定" | "暂停" | "归档";

export interface HabitProject {
  id: number;
  uuid: string;
  name: string;
  aspirationArea: string | null;
  phase: Phase;
  pausedAt: string | null;
  archivedAt: string | null;
  currentStep: number | null;
  createdAt: string;
  updatedAt: string;
}

/** 由 phase + 暂停/归档 推导出的展示状态（用于首页筛选）。 */
export function displayStatusOf(p: HabitProject): DisplayStatus {
  if (p.archivedAt) return "归档";
  if (p.pausedAt) return "暂停";
  switch (p.phase) {
    case "draft":
    case "designing":
      return "设计中";
    case "ready":
    case "experimenting":
      return "实践中";
    case "stable":
      return "稳定";
  }
}

export const PHASE_LABEL: Record<Phase, string> = {
  draft: "草稿",
  designing: "七步设计中",
  ready: "准备实践",
  experimenting: "实验中",
  stable: "稳定",
};

export interface Aspiration {
  id: number;
  uuid: string;
  projectId: number;
  rawInput: string | null;
  inputType: string | null;
  finalAspiration: string | null;
  whyImportant: string | null;
  lifeDifference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface BehaviorOption {
  id: number;
  uuid: string;
  projectId: number;
  text: string;
  source: string;
  status: string;
  notes: string | null;
  batch: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface FocusPlacement {
  id: number;
  uuid: string;
  behaviorOptionId: number;
  impact: number | null;
  feasibility: number | null;
  willing: boolean | null;
  posX: number | null;
  posY: number | null;
  updatedAt: string;
}

export interface GoldenBehavior {
  id: number;
  uuid: string;
  projectId: number;
  behaviorOptionId: number;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AbilityAssessment {
  id: number;
  uuid: string;
  projectId: number;
  timeFactor: string | null;
  moneyFactor: string | null;
  energyFactor: string | null;
  brainFactor: string | null;
  scheduleFactor: string | null;
  weakestLink: string | null;
  simplificationMethods: string | null;
  createdAt: string;
}

export interface TinyBehavior {
  id: number;
  uuid: string;
  projectId: number;
  originalBehavior: string | null;
  tinyBehavior: string | null;
  entryStep: string | null;
  baseline: string | null;
  optionalExtension: string | null;
  createdAt: string;
}

export interface Anchor {
  id: number;
  uuid: string;
  projectId: number;
  anchorText: string;
  lastAction: string | null;
  location: string | null;
  frequency: string | null;
  source: string;
  isSelected: boolean;
  createdAt: string;
}

export interface Celebration {
  id: number;
  uuid: string;
  projectId: number;
  celebrationText: string;
  naturalness: number | null;
  successFeeling: number | null;
  source: string;
  isSelected: boolean;
  createdAt: string;
}

export interface RecipeVersion {
  id: number;
  uuid: string;
  projectId: number;
  versionNumber: number;
  anchorLastAction: string | null;
  behaviorText: string | null;
  celebrationText: string | null;
  fullRecipeText: string | null;
  rehearsalCount: number | null;
  rehearsalFeeling: string | null;
  changeId: number | null;
  status: string;
  createdAt: string;
}

export interface PracticeEvent {
  id: number;
  uuid: string;
  projectId: number;
  recipeVersionId: number;
  result: string;
  feeling: string | null;
  context: string | null;
  occurredAt: string | null;
  createdAt: string;
}

export interface ObstacleDiagnosis {
  id: number;
  uuid: string;
  projectId: number;
  practiceEventId: number | null;
  obstacleType: string | null;
  diagnosisPath: string | null;
  suggestion: string | null;
  returnStep: number | null;
  userDecision: string | null;
  createdAt: string;
}

export interface BackupRecord {
  id: number;
  projectId: number | null;
  backupType: string;
  filePath: string;
  contentSummary: string | null;
  schemaVersion: number | null;
  createdAt: string;
}

export interface BehaviorOptionV2 {
  id: number;
  uuid: string;
  projectId: number;
  text: string;
  source: string;
  status: string;
  notes: string | null;
  sortOrder: number;
  swarmPosX: number | null;
  swarmPosY: number | null;
  swarmWidth: number | null;
  swarmHeight: number | null;
  createdAt: string;
}

export interface FocusPlacementV2 {
  behaviorOptionId: number;
  impact: number | null;
  feasibility: number | null;
  posX: number | null;
  posY: number | null;
  updatedAt: string | null;
}

export interface GoldenBehaviorV2 {
  id: number;
  uuid: string;
  projectId: number;
  behaviorOptionId: number;
  behaviorText: string;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
}

export type BranchStatus = "designing" | "practicing" | "stable" | "paused" | "archived";

export interface HabitBranch {
  id: number;
  uuid: string;
  projectId: number;
  goldenBehaviorId: number | null;
  behaviorOptionId: number | null;
  behaviorText: string | null;
  name: string;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAbility {
  id: number;
  uuid: string;
  projectId: number;
  branchId: number;
  weakestLink: string | null;
  weakestDetails: string | null;
  simplificationMethods: string | null;
  skillTarget: string | null;
  skillPlan: string | null;
  toolsNeeded: string | null;
  resourcesAvailable: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchTinyBehavior {
  id: number;
  uuid: string;
  projectId: number;
  branchId: number;
  originalBehavior: string | null;
  tinyBehavior: string | null;
  entryStep: string | null;
  baseline: string | null;
  optionalExtension: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAnchor {
  id: number;
  uuid: string;
  projectId: number;
  branchId: number;
  anchorText: string;
  lastAction: string | null;
  location: string | null;
  frequency: string | null;
  source: string;
  isSelected: boolean;
  createdAt: string;
}

export interface BranchCelebration {
  id: number;
  uuid: string;
  projectId: number;
  branchId: number;
  celebrationText: string;
  naturalness: number | null;
  successFeeling: number | null;
  source: string;
  isSelected: boolean;
  createdAt: string;
}

export interface BranchRecipeVersion {
  id: number;
  uuid: string;
  projectId: number;
  branchId: number;
  versionNumber: number;
  anchorLastAction: string | null;
  behaviorText: string | null;
  celebrationText: string | null;
  fullRecipeText: string | null;
  rehearsalCount: number | null;
  rehearsalFeeling: string | null;
  status: string;
  createdAt: string;
}

export interface BranchPracticeEvent {
  id: number;
  uuid: string;
  projectId: number;
  branchId: number;
  recipeVersionId: number;
  result: string;
  feeling: string | null;
  context: string | null;
  occurredAt: string | null;
  createdAt: string;
}

export interface BranchObstacleDiagnosis {
  id: number;
  uuid: string;
  projectId: number;
  branchId: number;
  practiceEventId: number | null;
  obstacleType: string | null;
  diagnosisPath: string | null;
  suggestion: string | null;
  returnStep: number | null;
  userDecision: string | null;
  createdAt: string;
}

export type ReferenceKind = "behavior" | "recipe" | "anchor" | "celebration" | "affirmation";

export interface PersonalReferenceItem {
  id: number;
  uuid: string;
  kind: ReferenceKind;
  title: string | null;
  content: string;
  structuredContent: string | null;
  category: string | null;
  tags: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type OneTimeStatus = "draft" | "prepared" | "in_progress" | "completed" | "cancelled" | "delegated" | "deferred";

export interface OneTimeTask {
  id: number;
  uuid: string;
  title: string;
  completionStandard?: string;
  nextAction: string;
  deadline?: string;
  completionEvidence?: string;
  currentIntent?: string;
  currentRoute: string;
  status: OneTimeStatus;
  decisionNote?: string;
  celebration?: string;
  convertedProjectId?: number;
  startedAt?: string;
  completedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveOneTimeTaskInput {
  id: number;
  title: string;
  completionStandard?: string;
  nextAction: string;
  deadline?: string;
  completionEvidence?: string;
  currentIntent?: string;
  currentRoute: string;
  status: OneTimeStatus;
  decisionNote?: string;
  celebration?: string;
}

export interface OneTimeDiagnosisRound {
  id: number;
  uuid: string;
  taskId: number;
  roundNumber: number;
  entryMode: string;
  symptom?: string;
  recommendedFactor?: string;
  selectedFactor: "P" | "A" | "M";
  targetSide?: string;
  problemType?: string;
  method?: string;
  weakestLink?: string;
  details?: string;
  adjustment?: string;
  updatedNextAction?: string;
  promptTime?: string;
  promptPlace?: string;
  minimumMotivationEasy?: boolean;
  taskDecision?: string;
  motivationConflict?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export type SaveOneTimeDiagnosisInput = Omit<OneTimeDiagnosisRound, "id" | "uuid" | "roundNumber" | "createdAt" | "updatedAt">;

export interface OneTimeTaskEvent {
  id: number;
  uuid: string;
  taskId: number;
  eventType: string;
  notes?: string;
  createdAt: string;
}

export type OldHabitStage = "prepare" | "clarify" | "strategies" | "observe" | "replace";
export type OldHabitProjectStatus = "draft" | "active" | "observing" | "replacing" | "paused" | "achieved";

export interface OldHabitProject {
  id: number; uuid: string; title: string; generalHabit: string;
  preparationMode: string; preparationNote?: string; linkedHabitProjectId?: number;
  currentStage: OldHabitStage; status: OldHabitProjectStatus; archivedAt?: string;
  createdAt: string; updatedAt: string;
}

export type SaveOldHabitProjectInput = Pick<OldHabitProject, "id" | "title" | "generalHabit" | "preparationMode" | "preparationNote" | "linkedHabitProjectId" | "currentStage" | "status">;

export interface OldHabitBehavior {
  id: number; uuid: string; projectId: number; behaviorText: string;
  typicalTime?: string; typicalPlace?: string; people?: string; context?: string;
  selectionReason?: string; goalType: string; goalValue?: string; reviewAt?: string;
  status: string; sortOrder: number; posX?: number; posY?: number;
  cardWidth?: number; cardHeight?: number; createdAt: string; updatedAt: string;
}

export type SaveOldHabitBehaviorInput = Omit<OldHabitBehavior, "id" | "uuid" | "sortOrder" | "createdAt" | "updatedAt"> & { id?: number };

export interface OldHabitStrategy {
  id: number; uuid: string; projectId: number; behaviorId: number;
  factor: "P" | "A" | "M"; method: string; content: string; situation?: string;
  status: string; notes?: string; createdAt: string; updatedAt: string;
}

export type SaveOldHabitStrategyInput = Omit<OldHabitStrategy, "id" | "uuid" | "createdAt" | "updatedAt"> & { id?: number };

export interface OldHabitObservation {
  id: number; uuid: string; projectId: number; behaviorId: number; result: string;
  prompt?: string; isNewPrompt?: boolean; uncoveredSituation?: string; adjustment?: string;
  feeling?: string; observedAt: string; createdAt: string;
}

export type SaveOldHabitObservationInput = Omit<OldHabitObservation, "id" | "uuid" | "createdAt" | "observedAt"> & { observedAt?: string };

export interface OldHabitReplacement {
  id: number; uuid: string; projectId: number; behaviorId: number; oldPrompt?: string;
  newBehavior: string; celebration?: string; rehearsalCount: number; notes?: string;
  lowerOldMotivation?: string; harderOldBehavior?: string; raiseNewMotivation?: string; easierNewBehavior?: string;
  linkedHabitProjectId?: number; status: string; createdAt: string; updatedAt: string;
}

export type SaveOldHabitReplacementInput = Omit<OldHabitReplacement, "id" | "uuid" | "linkedHabitProjectId" | "createdAt" | "updatedAt">;
