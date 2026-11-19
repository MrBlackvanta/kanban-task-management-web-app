export type Subtask = { id: string; title: string; isCompleted: boolean };

export type Task = {
  id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
};

export type Column = { id: string; name: string; tasks: Task[] };

export type Board = { id: string; name: string; columns: Column[] };

export type BoardDraft = {
  id: string;
  name: string;
  columns: Pick<Column, "id" | "name">[];
};

export type TaskDraft = Pick<Task, "id" | "title" | "description"> & {
  subtasks: Pick<Subtask, "id" | "title">[];
};

export type Command =
  | { type: "createBoard"; board: BoardDraft }
  | { type: "updateBoard"; board: BoardDraft }
  | { type: "deleteBoard"; boardId: string }
  | { type: "createTask"; columnId: string; task: TaskDraft }
  | { type: "updateTask"; columnId: string; task: TaskDraft }
  | { type: "moveTask"; taskId: string; columnId: string; index: number }
  | { type: "setSubtaskCompleted"; subtaskId: string; isCompleted: boolean }
  | { type: "deleteTask"; taskId: string };
