import {
  BOARD_KEY,
  DARK_QUERY,
  SIDEBAR_KEY,
  SYNC_GATE_TIMEOUT_MS,
  THEME_COLORS,
  THEME_KEY,
  THEME_META_ID,
  WORKSPACE_KEY,
} from "@/data";

export const PREPAINT_SCRIPT_ID = "prepaint";

export const PREPAINT_SCRIPT = `(() => {
  const root = document.documentElement;
  let theme = null;
  let sidebar = null;
  let restoring = false;
  try {
    theme = localStorage.getItem("${THEME_KEY}");
    sidebar = localStorage.getItem("${SIDEBAR_KEY}");
    restoring =
      localStorage.getItem("${WORKSPACE_KEY}") !== null ||
      localStorage.getItem("${BOARD_KEY}") !== null;
  } catch {}
  if (theme !== "light" && theme !== "dark")
    theme = matchMedia("${DARK_QUERY}").matches ? "dark" : "light";
  root.dataset.theme = theme;
  if (sidebar === "hidden") root.dataset.sidebar = "hidden";
  if (restoring) {
    root.dataset.sync = "pending";
    setTimeout(() => delete root.dataset.sync, ${SYNC_GATE_TIMEOUT_MS});
  }
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.id = "${THEME_META_ID}";
  meta.content = theme === "dark" ? "${THEME_COLORS.dark}" : "${THEME_COLORS.light}";
  document.head.prepend(meta);
})();`;
