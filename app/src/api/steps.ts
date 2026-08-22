import { invoke } from "@tauri-apps/api/core";
import type {
  AbilityAssessment,
  Anchor,
  Aspiration,
  BehaviorOption,
  Celebration,
  FocusPlacement,
  GoldenBehavior,
  RecipeVersion,
  TinyBehavior,
} from "../types";

// 第 1 步：愿望
export const getAspiration = (projectId: number) =>
  invoke<Aspiration | null>("get_aspiration", { projectId });

export const saveAspiration = (
  projectId: number,
  data: {
    rawInput: string | null;
    inputType: string | null;
    finalAspiration: string | null;
    whyImportant: string | null;
    lifeDifference: string | null;
    notes: string | null;
  },
) => invoke<Aspiration>("save_aspiration", { projectId, ...data });

// 第 2 步：行为集群
export const listBehaviorOptions = (projectId: number) =>
  invoke<BehaviorOption[]>("list_behavior_options", { projectId });

export const addBehaviorOption = (projectId: number, text: string, source?: string) =>
  invoke<BehaviorOption>("add_behavior_option", { projectId, text, source: source ?? null });

export const updateBehaviorOption = (
  id: number,
  text: string | null,
  status: string | null,
) => invoke<BehaviorOption>("update_behavior_option", { id, text, status });

// 第 3 步：焦点地图 + 黄金行为
export const saveFocusPlacement = (
  behaviorOptionId: number,
  data: {
    impact: number | null;
    feasibility: number | null;
    willing: boolean | null;
    posX: number | null;
    posY: number | null;
  },
) => invoke<FocusPlacement>("save_focus_placement", { behaviorOptionId, ...data });

export const listFocusPlacements = (projectId: number) =>
  invoke<FocusPlacement[]>("list_focus_placements", { projectId });

export const chooseGoldenBehavior = (
  projectId: number,
  behaviorOptionId: number,
  reason: string | null,
) => invoke<GoldenBehavior>("choose_golden_behavior", { projectId, behaviorOptionId, reason });

export const getGoldenBehavior = (projectId: number) =>
  invoke<GoldenBehavior | null>("get_golden_behavior", { projectId });

// 第 4 步：能力链 + 微行为
export const saveAbilityAssessment = (
  projectId: number,
  data: {
    timeFactor: string | null;
    moneyFactor: string | null;
    energyFactor: string | null;
    brainFactor: string | null;
    scheduleFactor: string | null;
    weakestLink: string | null;
    simplificationMethods: string | null;
  },
) => invoke<AbilityAssessment>("save_ability_assessment", { projectId, ...data });

export const getAbilityAssessment = (projectId: number) =>
  invoke<AbilityAssessment | null>("get_ability_assessment", { projectId });

export const saveTinyBehavior = (
  projectId: number,
  data: {
    originalBehavior: string | null;
    tinyBehavior: string | null;
    entryStep: string | null;
    baseline: string | null;
    optionalExtension: string | null;
  },
) => invoke<TinyBehavior>("save_tiny_behavior", { projectId, ...data });

export const getTinyBehavior = (projectId: number) =>
  invoke<TinyBehavior | null>("get_tiny_behavior", { projectId });

// 第 5 步：锚点
export const listAnchors = (projectId: number) =>
  invoke<Anchor[]>("list_anchors", { projectId });

export const addAnchor = (
  projectId: number,
  anchorText: string,
  lastAction: string | null,
  location: string | null,
  frequency: string | null,
  source?: string,
) =>
  invoke<Anchor>("add_anchor", {
    projectId,
    anchorText,
    lastAction,
    location,
    frequency,
    source: source ?? null,
  });

export const updateAnchor = (
  id: number,
  data: {
    anchorText: string | null;
    lastAction: string | null;
    location: string | null;
    frequency: string | null;
  },
) => invoke<Anchor>("update_anchor", { id, ...data });

export const selectAnchor = (projectId: number, anchorId: number) =>
  invoke<void>("select_anchor", { projectId, anchorId });

// 第 6 步：庆祝 + 配方
export const listCelebrations = (projectId: number) =>
  invoke<Celebration[]>("list_celebrations", { projectId });

export const addCelebration = (
  projectId: number,
  celebrationText: string,
  naturalness: number | null,
  successFeeling: number | null,
  source?: string,
) =>
  invoke<Celebration>("add_celebration", {
    projectId,
    celebrationText,
    naturalness,
    successFeeling,
    source: source ?? null,
  });

export const selectCelebration = (projectId: number, celebrationId: number) =>
  invoke<void>("select_celebration", { projectId, celebrationId });

export const generateRecipe = (
  projectId: number,
  rehearsalCount: number | null,
  rehearsalFeeling: string | null,
) => invoke<RecipeVersion>("generate_recipe", { projectId, rehearsalCount, rehearsalFeeling });

export const getActiveRecipe = (projectId: number) =>
  invoke<RecipeVersion | null>("get_active_recipe", { projectId });
