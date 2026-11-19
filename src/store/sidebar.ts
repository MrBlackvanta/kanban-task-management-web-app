import { SIDEBAR_KEY } from "@/data";

export function setSidebarHidden(hidden: boolean) {
  const root = document.documentElement;
  if (hidden) root.dataset.sidebar = "hidden";
  else delete root.dataset.sidebar;

  try {
    if (hidden) localStorage.setItem(SIDEBAR_KEY, "hidden");
    else localStorage.removeItem(SIDEBAR_KEY);
  } catch {}
}
