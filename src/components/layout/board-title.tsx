"use client";

import { ChevronDownIcon } from "@/components/icons";
import { useActiveBoard } from "@/store";
import { useRef, useState } from "react";
import MobileBoardMenu, { BOARD_MENU_ID } from "./mobile-board-menu";

export default function BoardTitle() {
  const board = useActiveBoard();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <h1 className="min-w-0 flex-1 text-heading-l md:text-heading-tablet lg:text-heading-xl">
        <button
          ref={triggerRef}
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
          <span className="truncate">{board?.name}</span>
          <ChevronDownIcon className="shrink-0 text-purple group-aria-expanded/title:rotate-180" />
        </button>
        <span className="hidden truncate md:block">{board?.name}</span>
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
