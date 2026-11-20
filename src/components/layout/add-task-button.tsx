"use client";

import { PlusIcon } from "@/components/icons";
import { openDialog, useActiveBoard } from "@/store";

export const ADD_TASK_BUTTON_ID = "add-task";

export default function AddTaskButton() {
  const board = useActiveBoard();

  return (
    <button
      id={ADD_TASK_BUTTON_ID}
      type="button"
      disabled={!board?.columns.length}
      onClick={() => openDialog({ kind: "addTask" })}
      className="flex h-8 w-12 shrink-0 items-center justify-center rounded-full bg-purple text-heading-m text-white transition-[background-color] enabled:hover:bg-purple-hover disabled:opacity-25 md:h-12 md:w-auto md:px-6"
    >
      <PlusIcon className="md:hidden" />
      <span className="sr-only md:not-sr-only">
        <span aria-hidden="true">+ </span>Add New Task
      </span>
    </button>
  );
}
