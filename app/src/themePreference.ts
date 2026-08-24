import kessokuThemeUrl from "./kessokuTheme.css?url";

const THEME_KEY = "fogg-lab.visual-theme";
const THEME_LINK_ID = "fogg-lab-kessoku-theme";

export type VisualTheme = "professional" | "kessoku";

export function getVisualTheme(): VisualTheme {
  return window.localStorage.getItem(THEME_KEY) === "kessoku" ? "kessoku" : "professional";
}

export function applyVisualTheme(theme: VisualTheme): void {
  const root = document.documentElement;
  root.dataset.visualTheme = theme;
  root.style.colorScheme = theme === "kessoku" ? "light" : "dark";

  const existing = document.getElementById(THEME_LINK_ID);
  if (theme === "kessoku") {
    if (!existing) {
      const link = document.createElement("link");
      link.id = THEME_LINK_ID;
      link.rel = "stylesheet";
      link.href = kessokuThemeUrl;
      document.head.appendChild(link);
    }
  } else {
    existing?.remove();
  }
}

export function loadVisualTheme(): VisualTheme {
  const theme = getVisualTheme();
  applyVisualTheme(theme);
  return theme;
}

export function setVisualTheme(theme: VisualTheme): void {
  window.localStorage.setItem(THEME_KEY, theme);
  applyVisualTheme(theme);
  window.dispatchEvent(new CustomEvent<VisualTheme>("fogg-lab-theme-change", { detail: theme }));
}
