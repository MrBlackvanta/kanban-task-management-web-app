"use client";

import { ChevronDownIcon } from "@/components/icons";
import { useActiveBoard } from "@/store";
import { useRef, useState } from "react";
import MobileBoardMenu, { BOARD_MENU_ID } from "./mobile-board-menu";

export const BOARD_MENU_TRIGGER_ID = "board-menu-trigger";

export default function BoardTitle() {
  const board = useActiveBoard();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const title = board?.name ?? "No boards";

  return (
    <>
      <h1 className="min-w-0 flex-1 text-heading-l md:text-heading-tablet lg:text-heading-xl syncing:invisible">
        <button
          ref={triggerRef}
          id={BOARD_MENU_TRIGGER_ID}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isMenuOpen}
          aria-controls={BOARD_MENU_ID}
          onClick={() => {
            menuRef.current?.showModal();
            setMenuOpen(true);
          }}
          className="group/title flex max-w-full items-center gap-2 md:hidden"
        >
          <span className="truncate">{title}</span>
          <ChevronDownIcon className="shrink-0 text-purple group-aria-expanded/title:rotate-180" />
        </button>
        <span className="hidden truncate md:block">{title}</span>
      </h1>
      <MobileBoardMenu
        dialogRef={menuRef}
        onClose={() => {
          setMenuOpen(false);
          triggerRef.current?.focus();
        }}
      />
    </>
  );
}
