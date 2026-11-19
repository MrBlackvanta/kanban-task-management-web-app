"use client";

import { useEffect, type RefObject } from "react";
import BoardNav from "./board-nav";
import Signature from "./signature";
import ThemeSwitch from "./theme-switch";

export const BOARD_MENU_ID = "board-menu";

const TABLET_QUERY = "(min-width: 48rem)";

type MobileBoardMenuProps = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onClose: () => void;
};

export default function MobileBoardMenu({
  dialogRef,
  onClose,
}: MobileBoardMenuProps) {
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const tablet = window.matchMedia(TABLET_QUERY);
    const closeOnTablet = () => {
      if (tablet.matches) dialogRef.current?.close();
    };
    tablet.addEventListener("change", closeOnTablet);
    return () => tablet.removeEventListener("change", closeOnTablet);
  }, [dialogRef]);

  return (
    <dialog
      ref={dialogRef}
      id={BOARD_MENU_ID}
      aria-label="Boards"
      onClose={onClose}
      className="inset-0 m-0 size-full max-h-none max-w-none overflow-clip bg-transparent text-ink backdrop:bg-transparent"
    >
      <div className="relative mx-auto mt-20 flex max-h-[calc(100%-6rem)] w-66 flex-col rounded-lg bg-surface pt-4 pb-8 shadow-menu">
        <BoardNav onSelect={close} />
        <ThemeSwitch className="mx-4 mt-4" />
        <Signature />
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 -z-10 cursor-default"
      >
        <span className="absolute inset-x-0 top-16 bottom-0 bg-scrim" />
      </button>
    </dialog>
  );
}
