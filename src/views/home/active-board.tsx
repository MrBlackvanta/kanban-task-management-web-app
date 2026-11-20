"use client";

import { placeTask } from "@/lib";
import {
  cancelDrag,
  getDrag,
  openDialog,
  useActiveBoard,
  useDrag,
} from "@/store";
import { useEffect, useRef, type PointerEvent } from "react";
import BoardColumn from "./board-column";
import DragGhost from "./drag-ghost";
import EmptyBoard from "./empty-board";
import NoBoards from "./no-boards";
import { followPointer } from "./pointer-drag";
import { DRAG_HINT_ID } from "./task-card";

export const NEW_COLUMN_ID = "new-column";

export default function ActiveBoard() {
  const board = useActiveBoard();
  const session = useDrag();
  const ghostRef = useRef<HTMLDivElement>(null);
  const keyboardLift = session?.mode === "keyboard";

  useEffect(() => {
    if (!keyboardLift) return;
    document.addEventListener("pointerdown", cancelDrag);
    return () => document.removeEventListener("pointerdown", cancelDrag);
  }, [keyboardLift]);

  if (!board) return <NoBoards />;
  if (board.columns.length === 0) return <EmptyBoard />;

  const [shown] = keyboardLift
    ? placeTask([board], session.taskId, session.slot)
    : [board];

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const card =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-task-id]")
        : null;
    if (!card || !event.isPrimary || event.button !== 0) return;
    followPointer({
      down: event.nativeEvent,
      board: event.currentTarget,
      card,
      ghost: ghostRef,
    });
  }

  return (
    <div
      ref={blockTouchScroll}
      onPointerDown={onPointerDown}
      className={`flex min-h-full w-max gap-6 px-4 py-6 md:px-6 ${session?.mode === "pointer" ? "cursor-grabbing" : ""}`}
    >
      {shown.columns.map((column, index) => (
        <BoardColumn
          key={column.id}
          column={column}
          index={index}
          session={session}
        />
      ))}
      <button
        id={NEW_COLUMN_ID}
        type="button"
        onClick={() => openDialog({ kind: "editBoard", addColumn: true })}
        className="mt-9.75 w-70 shrink-0 rounded-md bg-linear-to-b/srgb from-column-from to-column-to text-heading-xl text-muted transition-[color] hover:text-accent-ink"
      >
        <span aria-hidden="true">+ </span>New Column
      </button>
      <p id={DRAG_HINT_ID} hidden>
        Press Space to pick up the task, the arrow keys to move it, and Space
        again to drop it.
      </p>
      <DragGhost ref={ghostRef} board={board} session={session} />
    </div>
  );
}

function blockTouchScroll(board: HTMLDivElement) {
  const block = (event: TouchEvent) => {
    if (getDrag()) event.preventDefault();
  };
  board.addEventListener("touchmove", block, { passive: false });
  return () => board.removeEventListener("touchmove", block);
}
