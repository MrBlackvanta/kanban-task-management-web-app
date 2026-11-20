"use client";

import { BoardIcon } from "@/components/icons";
import { LIMITS } from "@/lib";
import { openDialog, selectBoard, useActiveBoard, useBoards } from "@/store";
import { useId } from "react";
import NavPill from "./nav-pill";

export const CREATE_BOARD_ID = "create-board";

type BoardNavProps = { createButtonId?: string; onSelect?: () => void };

export default function BoardNav({ createButtonId, onSelect }: BoardNavProps) {
  const boards = useBoards();
  const activeBoard = useActiveBoard();
  const atLimit = boards.length >= LIMITS.boards;
  const labelId = useId();

  function createBoard() {
    if (atLimit) return;
    onSelect?.();
    openDialog({ kind: "addBoard", returnFocusId: createButtonId });
  }

  return (
    <nav
      aria-labelledby={labelId}
      className="min-h-0 flex-1 overflow-y-auto syncing:invisible"
    >
      <p
        id={labelId}
        className="px-6 text-heading-s text-muted uppercase lg:px-8"
      >
        All boards ({boards.length})
      </p>
      <ul className="mt-4.75">
        {boards.map((board) => {
          const isCurrent = board.id === activeBoard?.id;
          return (
            <li key={board.id}>
              <NavPill
                icon={<BoardIcon />}
                tone={isCurrent ? "current" : "idle"}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => {
                  selectBoard(board.id);
                  onSelect?.();
                }}
              >
                {board.name}
              </NavPill>
            </li>
          );
        })}
      </ul>
      <NavPill
        id={createButtonId}
        icon={<BoardIcon />}
        tone="accent"
        aria-disabled={atLimit || undefined}
        onClick={createBoard}
      >
        <span aria-hidden="true">+ </span>Create New Board
      </NavPill>
    </nav>
  );
}
