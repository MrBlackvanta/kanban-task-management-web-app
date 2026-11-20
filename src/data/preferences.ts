export const THEME_KEY = "kanban-theme";
export const SIDEBAR_KEY = "kanban-sidebar";
export const THEME_META_ID = "theme-color";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export const THEME_COLORS = { light: "#ffffff", dark: "#2b2c37" } as const;

export type Theme = keyof typeof THEME_COLORS;

export const WORKSPACE_KEY = "kanban-workspace";
export const BOARD_KEY = "kanban-board";
export const SYNC_GATE_TIMEOUT_MS = 3000;
