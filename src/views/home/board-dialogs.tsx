"use client";

import { ADD_TASK_BUTTON_ID, BOARD_MENU_TRIGGER_ID } from "@/components/layout";
import { locateTask, type Board } from "@/lib";
import {
  openDialog,
  useActiveBoard,
  useBoards,
  useDialog,
  type DialogRequest,
} from "@/store";
import { NEW_COLUMN_ID } from "./active-board";
import BoardFormDialog from "./board-form-dialog";
import DeleteBoardDialog from "./delete-board-dialog";
import DeleteTaskDialog from "./delete-task-dialog";
import { closeDialogAndFocus } from "./dialog-focus";
import { ADD_COLUMN_ID } from "./empty-board";
import TaskFormDialog from "./task-form-dialog";
import ViewTaskDialog from "./view-task-dialog";

type TaskRequest = Extract<DialogRequest, { taskId: string }>;

export default function BoardDialogs() {
  const request = useDialog();
  const boards = useBoards();
  const activeBoard = useActiveBoard();
  if (!request) return null;

  if (request.kind === "addBoard") {
    return (
      <BoardFormDialog
        onFinish={() =>
          closeDialogAndFocus(
            request.returnFocusId,
            BOARD_MENU_TRIGGER_ID,
            ADD_TASK_BUTTON_ID,
            ADD_COLUMN_ID,
          )
        }
      />
    );
  }

  if (!activeBoard) return null;

  switch (request.kind) {
    case "editBoard":
      return (
        <BoardFormDialog
          board={activeBoard}
          addColumn={request.addColumn}
          onFinish={() =>
            closeDialogAndFocus(
              request.returnFocusId,
              NEW_COLUMN_ID,
              ADD_COLUMN_ID,
            )
          }
        />
      );
    case "deleteBoard":
      return <DeleteBoardDialog board={activeBoard} boards={boards} />;
    case "addTask":
      return <AddTaskDialog board={activeBoard} />;
    default:
      return <TaskDialog request={request} boards={boards} />;
  }
}

function AddTaskDialog({ board }: { board: Board }) {
  const [firstColumn] = board.columns;
  if (!firstColumn) return null;

  return (
    <TaskFormDialog
      board={board}
      columnId={firstColumn.id}
      onFinish={() => closeDialogAndFocus(ADD_TASK_BUTTON_ID)}
    />
  );
}

function TaskDialog({
  request,
  boards,
}: {
  request: TaskRequest;
  boards: Board[];
}) {
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
