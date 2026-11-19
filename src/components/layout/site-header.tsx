import {
  Logo,
  LogoMark,
  PlusIcon,
  VerticalEllipsisIcon,
} from "@/components/icons";
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
        <button
          type="button"
          className="flex h-8 w-12 shrink-0 items-center justify-center rounded-full bg-purple text-heading-m text-white transition-[background-color] hover:bg-purple-hover md:h-12 md:w-auto md:px-6"
        >
          <PlusIcon className="md:hidden" />
          <span className="sr-only md:not-sr-only">
            <span aria-hidden="true">+ </span>Add New Task
          </span>
        </button>
        <button
          type="button"
          aria-label="Board options"
          className="relative shrink-0 text-grey after:absolute after:-inset-x-2.5 after:-inset-y-3"
        >
          <VerticalEllipsisIcon className="h-4 w-auto md:h-5" />
        </button>
      </div>
    </header>
  );
}
