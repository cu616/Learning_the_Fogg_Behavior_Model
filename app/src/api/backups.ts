import { invoke } from "@tauri-apps/api/core";
import type { BackupRecord } from "../types";

export const backup = () => invoke<BackupRecord>("backup");

export const listBackups = () => invoke<BackupRecord[]>("list_backups");

export const deleteBackup = (backupId: number) =>
  invoke<void>("delete_backup", { backupId });

export const restoreBackup = (backupId: number) =>
  invoke<void>("restore_backup", { backupId });

export const exportAll = () => invoke<string>("export_all");

export const exportProject = (projectId: number) =>
  invoke<string>("export_project", { projectId });

export const saveExport = (filename: string, content: string) =>
  invoke<string>("save_export", { filename, content });

export const importJson = (json: string) => invoke<string>("import_json", { json });
