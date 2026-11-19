"use client";

import { useActiveBoard } from "@/store";
import BoardColumn from "./board-column";
import EmptyBoard from "./empty-board";

export default function ActiveBoard() {
  const board = useActiveBoard();

  if (!board) return null;
  if (board.columns.length === 0) return <EmptyBoard />;

  return (
    <div className="flex min-h-full w-max gap-6 px-4 py-6 md:px-6">
      {board.columns.map((column, index) => (
        <BoardColumn key={column.id} column={column} index={index} />
      ))}
      <button
        type="button"
        className="mt-9.75 w-70 shrink-0 rounded-md bg-linear-to-b/srgb from-column-from to-column-to text-heading-xl text-muted transition-[color] hover:text-accent-ink"
      >
        <span aria-hidden="true">+ </span>New Column
      </button>
    </div>
  );
}
