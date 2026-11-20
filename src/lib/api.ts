import type {
  Board,
  BoardDraft,
  Column,
  Command,
  Subtask,
  TaskDraft,
} from "./types";
import { LIMITS, validateBoard, validateTask } from "./validation";

export const BOARDS_PATH = "/api/boards";

export type ApiRequest = {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
};

export type BoardsResponse = { boards: Board[]; hasWorkspace: boolean };

type ParseBody = (body: unknown) => Command | undefined;

const ROUTE =
  /^\/api\/(boards|tasks|subtasks)(?:\/([\w-]{1,64})(\/position)?)?$/;
const ID = /^[\w-]{1,64}$/;

export function commandRequest(command: Command): ApiRequest {
  switch (command.type) {
    case "createBoard":
      return { method: "POST", path: BOARDS_PATH, body: command.board };
    case "updateBoard": {
      const { id, ...board } = command.board;
      return { method: "PUT", path: `${BOARDS_PATH}/${id}`, body: board };
    }
    case "deleteBoard":
      return { method: "DELETE", path: `${BOARDS_PATH}/${command.boardId}` };
    case "createTask":
      return {
        method: "POST",
        path: "/api/tasks",
        body: { columnId: command.columnId, ...command.task },
      };
    case "updateTask": {
      const { id, ...task } = command.task;
      return {
        method: "PUT",
        path: `/api/tasks/${id}`,
        body: { columnId: command.columnId, ...task },
      };
    }
    case "moveTask":
      return {
        method: "PATCH",
        path: `/api/tasks/${command.taskId}/position`,
        body: { columnId: command.columnId, index: command.index },
      };
    case "setSubtaskCompleted":
      return {
        method: "PATCH",
        path: `/api/subtasks/${command.subtaskId}`,
        body: { isCompleted: command.isCompleted },
      };
    case "deleteTask":
      return { method: "DELETE", path: `/api/tasks/${command.taskId}` };
  }
}

export function routeCommand(
  method: string,
  path: string,
): ParseBody | undefined {
  const match = ROUTE.exec(path);
  if (!match) return undefined;
  const [, resource, id, position = ""] = match;

  switch (`${method} ${resource}${id ? "/:id" : ""}${position}`) {
    case "POST boards":
      return (body) => boardCommand("createBoard", body, field(body, "id"));
    case "PUT boards/:id":
      return (body) => boardCommand("updateBoard", body, id);
    case "DELETE boards/:id":
      return () => ({ type: "deleteBoard", boardId: id });
    case "POST tasks":
      return (body) => taskCommand("createTask", body, field(body, "id"));
    case "PUT tasks/:id":
      return (body) => taskCommand("updateTask", body, id);
    case "PATCH tasks/:id/position":
      return (body) => moveCommand(body, id);
    case "PATCH subtasks/:id":
      return (body) => subtaskCommand(body, id);
    case "DELETE tasks/:id":
      return () => ({ type: "deleteTask", taskId: id });
    default:
      return undefined;
  }
}

function boardCommand(
  type: "createBoard" | "updateBoard",
  body: unknown,
  id: unknown,
): Command | undefined {
  const board = readBoardDraft(body, id);
  return board && { type, board };
}

function taskCommand(
  type: "createTask" | "updateTask",
  body: unknown,
  id: unknown,
): Command | undefined {
  const columnId = readId(field(body, "columnId"));
  const task = readTaskDraft(body, id);
  return columnId && task ? { type, columnId, task } : undefined;
}

function moveCommand(body: unknown, taskId: string): Command | undefined {
  const columnId = readId(field(body, "columnId"));
  const index = field(body, "index");
  const isIndex =
    typeof index === "number" && Number.isSafeInteger(index) && index >= 0;
  return columnId && isIndex
    ? { type: "moveTask", taskId, columnId, index }
    : undefined;
}

function subtaskCommand(body: unknown, subtaskId: string): Command | undefined {
  const isCompleted = field(body, "isCompleted");
  return typeof isCompleted === "boolean"
    ? { type: "setSubtaskCompleted", subtaskId, isCompleted }
    : undefined;
}

function readBoardDraft(body: unknown, id: unknown): BoardDraft | undefined {
  const boardId = readId(id);
  const name = readText(field(body, "name"), LIMITS.nameLength);
  const columns = readList(
    field(body, "columns"),
    LIMITS.columnsPerBoard,
    readColumnDraft,
  );
  if (!boardId || name === undefined || !columns) return undefined;

  const invalid = validateBoard({ name, columns: columns.map((c) => c.name) });
  return invalid ? undefined : { id: boardId, name, columns };
}

function readColumnDraft(
  value: unknown,
): Pick<Column, "id" | "name"> | undefined {
  const id = readId(field(value, "id"));
  const name = readText(field(value, "name"), LIMITS.nameLength);
  return id && name !== undefined ? { id, name } : undefined;
}

function readTaskDraft(body: unknown, id: unknown): TaskDraft | undefined {
  const taskId = readId(id);
  const title = readText(field(body, "title"), LIMITS.titleLength);
  const description = readText(
    field(body, "description"),
    LIMITS.descriptionLength,
  );
  const subtasks = readList(
    field(body, "subtasks"),
    LIMITS.subtasksPerTask,
    readSubtaskDraft,
  );
  if (
    !taskId ||
    title === undefined ||
    description === undefined ||
    !subtasks
  ) {
    return undefined;
  }

  const invalid = validateTask({
    title,
    subtasks: subtasks.map((subtask) => subtask.title),
  });
  return invalid ? undefined : { id: taskId, title, description, subtasks };
}

function readSubtaskDraft(
  value: unknown,
): Pick<Subtask, "id" | "title"> | undefined {
  const id = readId(field(value, "id"));
  const title = readText(field(value, "title"), LIMITS.titleLength);
  return id && title !== undefined ? { id, title } : undefined;
}

function readList<Item extends { id: string }>(
  value: unknown,
  limit: number,
  read: (item: unknown) => Item | undefined,
): Item[] | undefined {
  if (!Array.isArray(value) || value.length > limit) return undefined;
  const items = value.map(read);
  if (!items.every((item): item is Item => item !== undefined)) {
    return undefined;
  }
  const ids = new Set(items.map((item) => item.id));
  return ids.size === items.length ? items : undefined;
}

function readId(value: unknown) {
  return typeof value === "string" && ID.test(value) ? value : undefined;
}

function readText(value: unknown, maxLength: number) {
  const isTrimmedText =
    typeof value === "string" &&
    value.length <= maxLength &&
    value === value.trim();
  return isTrimmedText ? value : undefined;
}

function field(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
}
