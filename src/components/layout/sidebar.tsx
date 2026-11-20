import { Logo } from "@/components/icons";
import BoardNav, { CREATE_BOARD_ID } from "./board-nav";
import { HideSidebarButton } from "./sidebar-toggle";
import Signature from "./signature";
import ThemeSwitch from "./theme-switch";

export default function Sidebar() {
  return (
    <aside
      aria-label="Sidebar"
      className="relative hidden w-65.25 shrink-0 flex-col border-r border-line bg-surface pb-8 md:flex lg:w-75 md:sidebar-hidden:hidden"
    >
      <Logo className="mt-8 mb-13.5 ml-6 shrink-0 text-ink lg:ml-8" />
      <BoardNav createButtonId={CREATE_BOARD_ID} />
      <ThemeSwitch className="mx-3 mb-4 lg:mx-6 lg:mb-2" />
      <HideSidebarButton />
      <Signature />
    </aside>
  );
}
