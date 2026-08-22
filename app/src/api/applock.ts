import { invoke } from "@tauri-apps/api/core";

export const hasPasscode = () => invoke<boolean>("has_passcode");

export const setPasscode = (passcode: string) =>
  invoke<void>("set_passcode", { passcode });

export const verifyPasscode = (passcode: string) =>
  invoke<boolean>("verify_passcode", { passcode });
