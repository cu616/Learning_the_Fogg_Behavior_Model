import { invoke } from "@tauri-apps/api/core";
import type { ObstacleDiagnosis, PracticeEvent, RecipeVersion } from "../types";

export const recordPractice = (
  projectId: number,
  result: string,
  feeling: string | null,
  context: string | null,
) => invoke<PracticeEvent>("record_practice", { projectId, result, feeling, context });

export const listPracticeEvents = (projectId: number) =>
  invoke<PracticeEvent[]>("list_practice_events", { projectId });

export const diagnose = (projectId: number, practiceEventId: number) =>
  invoke<ObstacleDiagnosis>("diagnose", { projectId, practiceEventId });

export const listDiagnoses = (projectId: number) =>
  invoke<ObstacleDiagnosis[]>("list_diagnoses", { projectId });

export const listRecipeVersions = (projectId: number) =>
  invoke<RecipeVersion[]>("list_recipe_versions", { projectId });
