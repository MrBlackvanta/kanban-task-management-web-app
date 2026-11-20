import { Logo, LogoMark } from "@/components/icons";
import AddTaskButton from "./add-task-button";
import BoardOptions from "./board-options";
import BoardTitle from "./board-title";

export default function SiteHeader() {
  return (
    <header className="flex h-16 shrink-0 bg-surface md:box-content md:h-20 md:border-b md:border-line lg:h-24">
      <div className="flex shrink-0 items-center px-4 md:hidden md:border-r md:border-line md:px-6 lg:pr-8 md:sidebar-hidden:flex">
        <LogoMark className="md:hidden" />
        <Logo className="hidden text-ink md:block" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-4 pr-4 md:gap-6 md:px-6 lg:pr-8 lg:sidebar-hidden:pl-8">
        <BoardTitle />
        <AddTaskButton />
        <BoardOptions />
      </div>
    </header>
  );
}
