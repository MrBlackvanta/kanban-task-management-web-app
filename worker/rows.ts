import type { Board } from "../src/lib/types";

export type BoardRow = { id: string; name: string; position: number };

export type ColumnRow = {
  id: string;
  boardId: string;
  name: string;
  position: number;
};

export type TaskRow = {
  id: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
};

export type SubtaskRow = {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
};

export type Rows = {
  boards: BoardRow[];
  columns: ColumnRow[];
  tasks: TaskRow[];
  subtasks: SubtaskRow[];
};

export type Table = keyof Rows;

type TableChanges<Row> = { inserts: Row[]; updates: Row[]; deletes: string[] };

export type Changes = { [T in Table]: TableChanges<Rows[T][number]> };

export const TABLES: readonly Table[] = [
  "boards",
  "columns",
  "tasks",
  "subtasks",
];

export const NO_ROWS: Rows = {
  boards: [],
  columns: [],
  tasks: [],
  subtasks: [],
};

export function toRows(boards: Board[]): Rows {
  const rows: Rows = { boards: [], columns: [], tasks: [], subtasks: [] };
  boards.forEach(({ id: boardId, name, columns }, position) => {
    rows.boards.push({ id: boardId, name, position });
    columns.forEach(({ id: columnId, name, tasks }, position) => {
      rows.columns.push({ id: columnId, boardId, name, position });
      tasks.forEach(
        ({ id: taskId, title, description, subtasks }, position) => {
          rows.tasks.push({
            id: taskId,
            columnId,
            title,
            description,
            position,
          });
          subtasks.forEach(({ id, title, isCompleted }, position) => {
            rows.subtasks.push({ id, taskId, title, isCompleted, position });
          });
        },
      );
    });
  });
  return rows;
}

export function toBoards(rows: Rows): Board[] {
  const columns = Map.groupBy(rows.columns, (row) => row.boardId);
  const tasks = Map.groupBy(rows.tasks, (row) => row.columnId);
  const subtasks = Map.groupBy(rows.subtasks, (row) => row.taskId);

  return rows.boards.map((board) => ({
    id: board.id,
    name: board.name,
    columns: (columns.get(board.id) ?? []).map((column) => ({
      id: column.id,
      name: column.name,
      tasks: (tasks.get(column.id) ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        subtasks: (subtasks.get(task.id) ?? []).map(
          ({ id, title, isCompleted }) => ({ id, title, isCompleted }),
        ),
      })),
    })),
  }));
}

export function diffRows(before: Rows, after: Rows): Changes {
  return {
    boards: diffTable(before.boards, after.boards),
    columns: diffTable(before.columns, after.columns),
    tasks: diffTable(before.tasks, after.tasks),
    subtasks: diffTable(before.subtasks, after.subtasks),
  };
}

export function hasDuplicateIds(rows: Rows) {
  return TABLES.some((table) => {
    const ids = new Set(rows[table].map((row) => row.id));
    return ids.size !== rows[table].length;
  });
}

function diffTable<Row extends { id: string }>(
  before: Row[],
  after: Row[],
): TableChanges<Row> {
  const previous = new Map(before.map((row) => [row.id, row]));
  const kept = new Set(after.map((row) => row.id));
  return {
    inserts: after.filter((row) => !previous.has(row.id)),
    updates: after.filter((row) => {
      const old = previous.get(row.id);
      return old !== undefined && !sameRow(old, row);
    }),
    deletes: before.filter((row) => !kept.has(row.id)).map((row) => row.id),
  };
}

function sameRow<Row extends object>(a: Row, b: Row) {
  return (Object.keys(b) as (keyof Row)[]).every((key) => a[key] === b[key]);
}
