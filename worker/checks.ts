import { countTasks, locateTask } from "../src/lib/boards";
import type { Board, Command } from "../src/lib/types";
import { LIMITS } from "../src/lib/validation";

export type Problem = "missing" | "taken";

export function findProblem(
  boards: Board[],
  command: Command,
): Problem | undefined {
  switch (command.type) {
    case "createBoard":
      return hasBoard(boards, command.board.id) ? "taken" : undefined;
    case "updateBoard":
      return hasBoard(boards, command.board.id) ? undefined : "missing";
    case "deleteBoard":
      return hasBoard(boards, command.boardId) ? undefined : "missing";
    case "createTask":
      if (locateTask(boards, command.task.id)) return "taken";
      return hasColumn(boards, command.columnId) ? undefined : "missing";
    case "updateTask":
      return taskCanMove(boards, command.task.id, command.columnId);
    case "moveTask":
      return taskCanMove(boards, command.taskId, command.columnId);
    case "setSubtaskCompleted":
      return hasSubtask(boards, command.subtaskId) ? undefined : "missing";
    case "deleteTask":
      return locateTask(boards, command.taskId) ? undefined : "missing";
  }
}

export function exceedsLimits(boards: Board[]) {
  return boards.length > LIMITS.boards || countTasks(boards) > LIMITS.tasks;
}

function taskCanMove(boards: Board[], taskId: string, columnId: string) {
  const location = locateTask(boards, taskId);
  const sameBoard = location?.board.columns.some((c) => c.id === columnId);
  return sameBoard ? undefined : "missing";
}

function hasBoard(boards: Board[], boardId: string) {
  return boards.some((board) => board.id === boardId);
}

function hasColumn(boards: Board[], columnId: string) {
  return boards.some((board) =>
    board.columns.some((column) => column.id === columnId),
  );
}

function hasSubtask(boards: Board[], subtaskId: string) {
  return boards.some((board) =>
    board.columns.some((column) =>
      column.tasks.some((task) =>
        task.subtasks.some((subtask) => subtask.id === subtaskId),
      ),
    ),
  );
}
