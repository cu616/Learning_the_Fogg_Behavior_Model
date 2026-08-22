const REQUIRE_DELETE_NAME_KEY = "fogg-lab.require-delete-name";

export function requiresDeleteNameConfirmation(): boolean {
  return window.localStorage.getItem(REQUIRE_DELETE_NAME_KEY) === "true";
}

export function setRequiresDeleteNameConfirmation(value: boolean): void {
  window.localStorage.setItem(REQUIRE_DELETE_NAME_KEY, String(value));
}
