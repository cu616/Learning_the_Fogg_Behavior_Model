const REQUIRE_DELETE_NAME_KEY = "fogg-lab.require-delete-name";
const HOME_SECTIONS_KEY = "fogg-lab.home-sections";

export type HomeSectionKey = "habit" | "oneTime" | "oldHabit";

export function requiresDeleteNameConfirmation(): boolean {
  return window.localStorage.getItem(REQUIRE_DELETE_NAME_KEY) === "true";
}

export function setRequiresDeleteNameConfirmation(value: boolean): void {
  window.localStorage.setItem(REQUIRE_DELETE_NAME_KEY, String(value));
}

export function getHomeSections(): Record<HomeSectionKey, boolean> {
  const fallback = { habit: false, oneTime: false, oldHabit: false };
  try {
    const value = JSON.parse(window.localStorage.getItem(HOME_SECTIONS_KEY) || "null") as Partial<Record<HomeSectionKey, boolean>> | null;
    return value ? { ...fallback, ...value } : fallback;
  } catch {
    return fallback;
  }
}

export function setHomeSection(key: HomeSectionKey, open: boolean): void {
  window.localStorage.setItem(HOME_SECTIONS_KEY, JSON.stringify({ ...getHomeSections(), [key]: open }));
}
