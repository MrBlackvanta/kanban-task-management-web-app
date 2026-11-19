import type { Board, Column, Task } from "./types";

export type TaskLocation = {
  board: Board;
  column: Column;
  task: Task;
  index: number;
};

export function locateTask(
  boards: Board[],
  taskId: string,
): TaskLocation | undefined {
  for (const board of boards) {
    for (const column of board.columns) {
      const index = column.tasks.findIndex((task) => task.id === taskId);
      if (index !== -1) {
        return { board, column, task: column.tasks[index], index };
      }
    }
  }
  return undefined;
}

export function completedCount(task: Task) {
  return task.subtasks.filter((subtask) => subtask.isCompleted).length;
}
