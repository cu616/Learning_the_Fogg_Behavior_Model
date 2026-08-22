import { invoke } from "@tauri-apps/api/core";
import type { OneTimeDiagnosisRound, OneTimeTask, OneTimeTaskEvent, SaveOneTimeDiagnosisInput, SaveOneTimeTaskInput } from "../types";

export const createOneTimeTask = (title: string) => invoke<OneTimeTask>("create_one_time_task", { title });
export const listOneTimeTasks = (includeArchived = false) => invoke<OneTimeTask[]>("list_one_time_tasks", { includeArchived });
export const getOneTimeTask = (taskId: number) => invoke<OneTimeTask>("get_one_time_task", { taskId });
export const saveOneTimeTask = (input: SaveOneTimeTaskInput) => invoke<OneTimeTask>("save_one_time_task", { input });
export const setOneTimeArchived = (taskId: number, archived: boolean) => invoke<void>("set_one_time_archived", { taskId, archived });
export const saveOneTimeDiagnosis = (input: SaveOneTimeDiagnosisInput) => invoke<OneTimeDiagnosisRound>("save_one_time_diagnosis", { input });
export const listOneTimeDiagnoses = (taskId: number) => invoke<OneTimeDiagnosisRound[]>("list_one_time_diagnoses", { taskId });
export const recordOneTimeEvent = (taskId: number, eventType: string, notes?: string) => invoke<void>("record_one_time_event", { taskId, eventType, notes });
export const listOneTimeEvents = (taskId: number) => invoke<OneTimeTaskEvent[]>("list_one_time_events", { taskId });
export const convertOneTimeToHabit = (taskId: number) => invoke<number>("convert_one_time_to_habit", { taskId });
export const deleteOneTimeTask = (taskId: number, confirmation: string) => invoke<string>("delete_one_time_task", { taskId, confirmation });
