import type { ReactNode } from "react";
import LiveRegion from "./live-region";
import SaveNotice from "./save-notice";
import Sidebar from "./sidebar";
import { ShowSidebarButton } from "./sidebar-toggle";
import SiteHeader from "./site-header";

export default function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="min-h-0 flex-1 overflow-auto syncing:invisible motion-sidebar:[view-transition-name:board]">
          {children}
        </main>
      </div>
      <ShowSidebarButton />
      <SaveNotice />
      <LiveRegion />
    </div>
  );
}
