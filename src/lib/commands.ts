import { locateTask } from "./boards";
import type {
  Board,
  BoardDraft,
  Column,
  Command,
  Subtask,
  Task,
  TaskDraft,
} from "./types";

export function applyCommand(boards: Board[], command: Command): Board[] {
  switch (command.type) {
    case "createBoard":
      return createBoard(boards, command.board);
    case "updateBoard":
      return mapChanged(boards, (board) =>
        board.id === command.board.id
          ? reviseBoard(board, command.board)
          : board,
      );
    case "deleteBoard":
      return removeWhere(boards, (board) => board.id === command.boardId);
    case "createTask":
      return createTask(boards, command.columnId, command.task);
    case "updateTask":
      return updateTask(boards, command.columnId, command.task);
    case "moveTask":
      return moveTask(boards, command.taskId, command.columnId, command.index);
    case "setSubtaskCompleted":
      return mapTasks(boards, (task) =>
        withSubtasks(
          task,
          mapChanged(task.subtasks, (subtask) =>
            subtask.id === command.subtaskId &&
            subtask.isCompleted !== command.isCompleted
              ? { ...subtask, isCompleted: command.isCompleted }
              : subtask,
          ),
        ),
      );
    case "deleteTask":
      return removeTask(boards, command.taskId);
  }
}

function createBoard(boards: Board[], draft: BoardDraft) {
  if (boards.some((board) => board.id === draft.id)) return boards;
  const columns = draft.columns.map(({ id, name }) => ({
    id,
    name,
    tasks: [],
  }));
  return [...boards, { id: draft.id, name: draft.name, columns }];
}

function reviseBoard(board: Board, draft: BoardDraft): Board {
  const tasksByColumn = new Map(board.columns.map((c) => [c.id, c.tasks]));
  const columns = draft.columns.map(({ id, name }) => ({
    id,
    name,
    tasks: tasksByColumn.get(id) ?? [],
  }));
  return { ...board, name: draft.name, columns };
}

function createTask(boards: Board[], columnId: string, draft: TaskDraft) {
  if (locateTask(boards, draft.id)) return boards;
  return insertTask(boards, columnId, reviseTask(undefined, draft));
}

function updateTask(boards: Board[], columnId: string, draft: TaskDraft) {
  const location = locateTask(boards, draft.id);
  if (!location || !hasColumn(location.board, columnId)) return boards;

  const task = reviseTask(location.task, draft);
  if (location.column.id === columnId) {
    return mapTasks(boards, (current) =>
      current.id === task.id ? task : current,
    );
  }
  return insertTask(removeTask(boards, task.id), columnId, task);
}

function reviseTask(task: Task | undefined, draft: TaskDraft): Task {
  const completed = new Map(
    task?.subtasks.map((subtask) => [subtask.id, subtask.isCompleted]),
  );
  const subtasks = draft.subtasks.map(({ id, title }) => ({
    id,
    title,
    isCompleted: completed.get(id) ?? false,
  }));
  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    subtasks,
  };
}

function moveTask(
  boards: Board[],
  taskId: string,
  columnId: string,
  index: number,
) {
  const location = locateTask(boards, taskId);
  const target = location?.board.columns.find((c) => c.id === columnId);
  if (!location || !target) return boards;

  const sameColumn = target.id === location.column.id;
  const lastSlot = target.tasks.length - (sameColumn ? 1 : 0);
  const slot = clamp(index, 0, lastSlot);
  if (sameColumn && slot === location.index) return boards;

  return insertTask(removeTask(boards, taskId), columnId, location.task, slot);
}

function insertTask(
  boards: Board[],
  columnId: string,
  task: Task,
  index?: number,
) {
  return mapColumns(boards, (column) => {
    if (column.id !== columnId) return column;
    const slot = index ?? column.tasks.length;
    return withTasks(column, [
      ...column.tasks.slice(0, slot),
      task,
      ...column.tasks.slice(slot),
    ]);
  });
}

function removeTask(boards: Board[], taskId: string) {
  return mapColumns(boards, (column) =>
    withTasks(
      column,
      removeWhere(column.tasks, (task) => task.id === taskId),
    ),
  );
}

function hasColumn(board: Board, columnId: string) {
  return board.columns.some((column) => column.id === columnId);
}

function mapColumns(boards: Board[], update: (column: Column) => Column) {
  return mapChanged(boards, (board) =>
    withColumns(board, mapChanged(board.columns, update)),
  );
}

function mapTasks(boards: Board[], update: (task: Task) => Task) {
  return mapColumns(boards, (column) =>
    withTasks(column, mapChanged(column.tasks, update)),
  );
}

function withColumns(board: Board, columns: Column[]) {
  return columns === board.columns ? board : { ...board, columns };
}

function withTasks(column: Column, tasks: Task[]) {
  return tasks === column.tasks ? column : { ...column, tasks };
}

function withSubtasks(task: Task, subtasks: Subtask[]) {
  return subtasks === task.subtasks ? task : { ...task, subtasks };
}

function mapChanged<T>(items: T[], update: (item: T) => T) {
  const next = items.map(update);
  return next.every((item, index) => item === items[index]) ? items : next;
}

function removeWhere<T>(items: T[], matches: (item: T) => boolean) {
  const next = items.filter((item) => !matches(item));
  return next.length === items.length ? items : next;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
