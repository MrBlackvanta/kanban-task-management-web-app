import { LiveRegion } from "@/components/layout";
import { Modal, OptionsMenu, type MenuAction } from "@/components/ui";
import { describePlace, type TaskLocation } from "@/lib";
import { announce, dispatch, openDialog } from "@/store";
import { useId } from "react";
import { taskCardId } from "./card-focus";
import { closeDialogAndFocus } from "./dialog-focus";
import StatusSelect from "./status-select";
import SubtaskList from "./subtask-list";

export default function ViewTaskDialog({
  location,
}: {
  location: TaskLocation;
}) {
  const { board, column, task, index } = location;
  const titleId = useId();

  function moveTo(target: number) {
    dispatch({
      type: "moveTask",
      taskId: task.id,
      columnId: column.id,
      index: target,
    });
    announce(`Moved to ${describePlace({ ...location, index: target })}.`);
  }

  const moves: MenuAction[] = [
    ...(index > 0
      ? [{ label: "Move Up", onSelect: () => moveTo(index - 1) }]
      : []),
    ...(index < column.tasks.length - 1
      ? [{ label: "Move Down", onSelect: () => moveTo(index + 1) }]
      : []),
  ];

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
            ...moves,
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
      <LiveRegion />
    </Modal>
  );
}
