import { invoke } from "@tauri-apps/api/core";
import type { HabitProject, Phase } from "../types";

export const listProjects = () => invoke<HabitProject[]>("list_projects");

export const getProject = (id: number) =>
  invoke<HabitProject>("get_project", { id });

export const createProject = (name: string) =>
  invoke<HabitProject>("create_project", { name });

export const renameProject = (id: number, name: string) =>
  invoke<HabitProject>("rename_project", { id, name });

export const setProjectArea = (id: number, area: string | null) =>
  invoke<HabitProject>("set_project_area", { id, area });

export const setProjectStep = (id: number, step: number | null) =>
  invoke<HabitProject>("set_project_step", { id, step });

export const setProjectPhase = (id: number, phase: Phase) =>
  invoke<HabitProject>("set_project_phase", { id, phase });

export const setProjectPaused = (id: number, paused: boolean) =>
  invoke<HabitProject>("set_project_paused", { id, paused });

export const setProjectArchived = (id: number, archived: boolean) =>
  invoke<HabitProject>("set_project_archived", { id, archived });

export const duplicateProject = (id: number) =>
  invoke<HabitProject>("duplicate_project", { id });

export const deleteProject = (id: number, confirmation: string) =>
  invoke<string>("delete_project", { id, confirmation });
