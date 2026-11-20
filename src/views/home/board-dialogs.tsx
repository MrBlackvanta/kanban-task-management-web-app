"use client";

import { ADD_TASK_BUTTON_ID } from "@/components/layout";
import { locateTask } from "@/lib";
import { openDialog, useActiveBoard, useBoards, useDialog } from "@/store";
import DeleteTaskDialog from "./delete-task-dialog";
import { closeDialogAndFocus } from "./dialog-focus";
import TaskFormDialog from "./task-form-dialog";
import ViewTaskDialog from "./view-task-dialog";

export default function BoardDialogs() {
  const request = useDialog();
  const boards = useBoards();
  const activeBoard = useActiveBoard();
  if (!request) return null;

  if (request.kind === "addTask") {
    const [firstColumn] = activeBoard?.columns ?? [];
    if (!activeBoard || !firstColumn) return null;
    return (
      <TaskFormDialog
        board={activeBoard}
        columnId={firstColumn.id}
        onFinish={() => closeDialogAndFocus(ADD_TASK_BUTTON_ID)}
      />
    );
  }

  const location = locateTask(boards, request.taskId);
  if (!location) return null;

  switch (request.kind) {
    case "viewTask":
      return <ViewTaskDialog key={request.taskId} location={location} />;
    case "editTask":
      return (
        <TaskFormDialog
          key={request.taskId}
          board={location.board}
          columnId={location.column.id}
          task={location.task}
          onFinish={() =>
            openDialog({ kind: "viewTask", taskId: request.taskId })
          }
        />
      );
    case "deleteTask":
      return <DeleteTaskDialog key={request.taskId} location={location} />;
  }
}
