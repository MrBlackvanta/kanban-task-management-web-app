import { ADD_TASK_BUTTON_ID } from "@/components/layout";
import type { TaskLocation } from "@/lib";
import { dispatch, openDialog } from "@/store";
import DeleteDialog from "./delete-dialog";
import { closeDialogAndFocus } from "./dialog-focus";
import { taskCardId } from "./task-card";

export default function DeleteTaskDialog({
  location,
}: {
  location: TaskLocation;
}) {
  const { column, task, index } = location;

  function deleteTask() {
    const neighbour = column.tasks[index + 1] ?? column.tasks[index - 1];
    dispatch({ type: "deleteTask", taskId: task.id });
    closeDialogAndFocus(
      neighbour ? taskCardId(neighbour.id) : ADD_TASK_BUTTON_ID,
    );
  }

  return (
    <DeleteDialog
      heading="Delete this task?"
      message={`Are you sure you want to delete the ‘${task.title}’ task and its subtasks? This action cannot be reversed.`}
      onDelete={deleteTask}
      onCancel={() => openDialog({ kind: "viewTask", taskId: task.id })}
    />
  );
}
