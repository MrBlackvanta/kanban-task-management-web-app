"use client";

import { BoardIcon } from "@/components/icons";
import { selectBoard, useActiveBoard, useBoards } from "@/store";
import NavPill from "./nav-pill";

export default function BoardNav({ onSelect }: { onSelect?: () => void }) {
  const boards = useBoards();
  const activeBoard = useActiveBoard();

  return (
    <nav aria-label="Boards" className="min-h-0 flex-1 overflow-y-auto">
      <h2 className="px-6 text-heading-s text-muted uppercase lg:px-8">
        All boards ({boards.length})
      </h2>
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
      <NavPill icon={<BoardIcon />} tone="accent">
        + Create New Board
      </NavPill>
    </nav>
  );
}
