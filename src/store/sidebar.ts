import { SIDEBAR_KEY } from "@/data";
import { writeStorage } from "./storage";

export function setSidebarHidden(hidden: boolean) {
  const root = document.documentElement;
  if (hidden) root.dataset.sidebar = "hidden";
  else delete root.dataset.sidebar;

  writeStorage(SIDEBAR_KEY, hidden ? "hidden" : null);
}
