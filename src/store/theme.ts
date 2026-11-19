import {
  DARK_QUERY,
  THEME_COLORS,
  THEME_KEY,
  THEME_META_ID,
  type Theme,
} from "@/data";
import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function storedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.getElementById(THEME_META_ID);
  if (meta instanceof HTMLMetaElement) meta.content = THEME_COLORS[theme];
  for (const listener of listeners) listener();
}

function followSystem(event: MediaQueryListEvent) {
  if (storedTheme() === null) applyTheme(event.matches ? "dark" : "light");
}

function subscribe(listener: () => void) {
  const system = window.matchMedia(DARK_QUERY);
  listeners.add(listener);
  system.addEventListener("change", followSystem);
  return () => {
    listeners.delete(listener);
    system.removeEventListener("change", followSystem);
  };
}

export function chooseTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function useTheme() {
  return useSyncExternalStore(subscribe, currentTheme, (): Theme => "light");
}
