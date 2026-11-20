import { Modal, OptionsMenu } from "@/components/ui";
import type { TaskLocation } from "@/lib";
import { openDialog } from "@/store";
import { useId } from "react";
import { closeDialogAndFocus } from "./dialog-focus";
import StatusSelect from "./status-select";
import SubtaskList from "./subtask-list";
import { taskCardId } from "./task-card";

export default function ViewTaskDialog({
  location,
}: {
  location: TaskLocation;
}) {
  const { board, column, task } = location;
  const titleId = useId();

  return (
    <Modal
      titleId={titleId}
      onClose={() => closeDialogAndFocus(taskCardId(task.id))}
      className="p-6 pb-8 md:p-8"
    >
      <div className="flex items-center gap-4 md:gap-6">
        <h2
          id={titleId}
          className="min-w-0 flex-1 text-heading-l wrap-break-word"
        >
          {task.title}
        </h2>
        <OptionsMenu
          label="Task options"
          iconClassName="h-5 w-auto"
          menuClassName="mt-5.5 [position-area:bottom_span-left] md:[position-area:bottom]"
          actions={[
            {
              label: "Edit Task",
              onSelect: () => openDialog({ kind: "editTask", taskId: task.id }),
            },
            {
              label: "Delete Task",
              destructive: true,
              onSelect: () =>
                openDialog({ kind: "deleteTask", taskId: task.id }),
            },
          ]}
        />
      </div>
      {task.description && (
        <p className="text-body-l wrap-break-word whitespace-pre-line text-muted">
          {task.description}
        </p>
      )}
      {task.subtasks.length > 0 && <SubtaskList task={task} />}
      <StatusSelect board={board} column={column} taskId={task.id} />
    </Modal>
  );
}
