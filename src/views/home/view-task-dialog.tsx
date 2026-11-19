import { VerticalEllipsisIcon } from "@/components/icons";
import type { TaskLocation } from "@/lib";
import { closeDialog } from "@/store";
import { useEffect, useId, useRef } from "react";
import StatusSelect from "./status-select";
import SubtaskList from "./subtask-list";
import { taskCardId } from "./task-card";

export default function ViewTaskDialog({
  location,
}: {
  location: TaskLocation;
}) {
  const { board, column, task } = location;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleClose() {
    closeDialog();
    document.getElementById(taskCardId(task.id))?.focus();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={handleClose}
      className="m-0 size-full max-h-none max-w-none items-center justify-center overflow-clip bg-transparent p-4 text-ink backdrop:bg-scrim open:flex"
    >
      <div className="flex max-h-full w-full max-w-120 flex-col gap-6 overflow-y-auto overscroll-contain rounded-md bg-surface p-6 pb-8 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <h2
            id={titleId}
            className="min-w-0 flex-1 text-heading-l wrap-break-word"
          >
            {task.title}
          </h2>
          <button
            type="button"
            aria-label="Task options"
            className="relative shrink-0 text-grey after:absolute after:-inset-x-2.5 after:-inset-y-3"
          >
            <VerticalEllipsisIcon className="h-5 w-auto" />
          </button>
        </div>
        {task.description && (
          <p className="text-body-l wrap-break-word whitespace-pre-line text-muted">
            {task.description}
          </p>
        )}
        {task.subtasks.length > 0 && <SubtaskList task={task} />}
        <StatusSelect board={board} column={column} taskId={task.id} />
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => dialogRef.current?.close()}
        className="absolute inset-0 -z-10 cursor-default"
      />
    </dialog>
  );
}
