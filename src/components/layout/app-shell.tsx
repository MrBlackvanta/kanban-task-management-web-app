import type { ReactNode } from "react";
import Sidebar from "./sidebar";
import { ShowSidebarButton } from "./sidebar-toggle";
import SiteHeader from "./site-header";

export default function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
      <ShowSidebarButton />
    </div>
  );
}
