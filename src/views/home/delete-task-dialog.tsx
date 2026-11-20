import { ADD_TASK_BUTTON_ID } from "@/components/layout";
import { Button, Modal } from "@/components/ui";
import type { TaskLocation } from "@/lib";
import { dispatch, openDialog } from "@/store";
import { useId, useRef } from "react";
import { closeDialogAndFocus } from "./dialog-focus";
import { taskCardId } from "./task-card";

export default function DeleteTaskDialog({
  location,
}: {
  location: TaskLocation;
}) {
  const { column, task, index } = location;
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  function backToTask() {
    openDialog({ kind: "viewTask", taskId: task.id });
  }

  function deleteTask() {
    const neighbour = column.tasks[index + 1] ?? column.tasks[index - 1];
    dispatch({ type: "deleteTask", taskId: task.id });
    closeDialogAndFocus(
      neighbour ? taskCardId(neighbour.id) : ADD_TASK_BUTTON_ID,
    );
  }

  return (
    <Modal
      role="alertdialog"
      titleId={titleId}
      descriptionId={descriptionId}
      initialFocusRef={cancelRef}
      onClose={backToTask}
      className="p-6 md:p-8 md:pb-10"
    >
      <h2 id={titleId} className="text-heading-l text-danger-ink">
        Delete this task?
      </h2>
      <p id={descriptionId} className="text-body-l wrap-break-word text-muted">
        Are you sure you want to delete the ‘{task.title}’ task and its
        subtasks? This action cannot be reversed.
      </p>
      <div className="flex flex-col gap-4 md:flex-row">
        <Button
          variant="destructive"
          onClick={deleteTask}
          className="md:flex-1"
        >
          Delete
        </Button>
        <Button
          ref={cancelRef}
          variant="secondary"
          onClick={backToTask}
          className="md:flex-1"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
