import {
  DARK_QUERY,
  SIDEBAR_KEY,
  THEME_COLORS,
  THEME_KEY,
  THEME_META_ID,
} from "@/data";

export const PREPAINT_SCRIPT_ID = "prepaint";

export const PREPAINT_SCRIPT = `(() => {
  const root = document.documentElement;
  let theme = null;
  let sidebar = null;
  try {
    theme = localStorage.getItem("${THEME_KEY}");
    sidebar = localStorage.getItem("${SIDEBAR_KEY}");
  } catch {}
  if (theme !== "light" && theme !== "dark")
    theme = matchMedia("${DARK_QUERY}").matches ? "dark" : "light";
  root.dataset.theme = theme;
  if (sidebar === "hidden") root.dataset.sidebar = "hidden";
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.id = "${THEME_META_ID}";
  meta.content = theme === "dark" ? "${THEME_COLORS.dark}" : "${THEME_COLORS.light}";
  document.head.prepend(meta);
})();`;
