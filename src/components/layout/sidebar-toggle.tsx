"use client";

import { HideSidebarIcon, ShowSidebarIcon } from "@/components/icons";
import { setSidebarHidden } from "@/store";
import NavPill from "./nav-pill";

const HIDE_ID = "hide-sidebar";
const SHOW_ID = "show-sidebar";

function toggleSidebar(hidden: boolean) {
  setSidebarHidden(hidden);
  document.getElementById(hidden ? SHOW_ID : HIDE_ID)?.focus();
}

export function HideSidebarButton() {
  return (
    <NavPill
      id={HIDE_ID}
      icon={<HideSidebarIcon />}
      onClick={() => toggleSidebar(true)}
    >
      Hide Sidebar
    </NavPill>
  );
}

export function ShowSidebarButton() {
  return (
    <button
      type="button"
      id={SHOW_ID}
      aria-label="Show sidebar"
      onClick={() => toggleSidebar(false)}
      className="fixed bottom-8 left-0 hidden h-12 w-14 items-center rounded-r-full bg-purple pl-4.5 text-white transition-[background-color] hover:bg-purple-hover md:sidebar-hidden:flex"
    >
      <ShowSidebarIcon />
    </button>
  );
}
