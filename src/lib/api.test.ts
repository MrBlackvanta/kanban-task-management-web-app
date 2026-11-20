import { describe, expect, it } from "vite-plus/test";
import { commandRequest, routeCommand } from "./api";
import type { Command } from "./types";
import { LIMITS } from "./validation";

const COMMANDS: Command[] = [
  {
    type: "createBoard",
    board: { id: "b1", name: "Launch", columns: [{ id: "c1", name: "Todo" }] },
  },
  {
    type: "updateBoard",
    board: { id: "b1", name: "Ship", columns: [] },
  },
  { type: "deleteBoard", boardId: "b1" },
  {
    type: "createTask",
    columnId: "c1",
    task: {
      id: "t1",
      title: "Plan",
      description: "Pick a date.",
      subtasks: [{ id: "s1", title: "Draft" }],
    },
  },
  {
    type: "updateTask",
    columnId: "c2",
    task: { id: "t1", title: "Plan", description: "", subtasks: [] },
  },
  { type: "moveTask", taskId: "t1", columnId: "c2", index: 3 },
  { type: "setSubtaskCompleted", subtaskId: "s1", isCompleted: true },
  { type: "deleteTask", taskId: "t1" },
];

function roundTrip(command: Command) {
  const { method, path, body } = commandRequest(command);
  const parse = routeCommand(method, path);
  return parse?.(
    body === undefined ? undefined : JSON.parse(JSON.stringify(body)),
  );
}

describe("commandRequest and routeCommand", () => {
  it.each(COMMANDS.map((command) => [command.type, command]))(
    "round-trips %s",
    (_, command) => {
      expect(roundTrip(command)).toEqual(command);
    },
  );

  it.each([
    ["POST", "/api/boards", "createBoard"],
    ["PUT", "/api/boards/b1", "updateBoard"],
    ["DELETE", "/api/boards/b1", "deleteBoard"],
    ["POST", "/api/tasks", "createTask"],
    ["PUT", "/api/tasks/t1", "updateTask"],
    ["PATCH", "/api/tasks/t1/position", "moveTask"],
    ["PATCH", "/api/subtasks/s1", "setSubtaskCompleted"],
    ["DELETE", "/api/tasks/t1", "deleteTask"],
  ])("maps %s %s to %s", (method, path, type) => {
    const command = COMMANDS.find((item) => item.type === type)!;
    expect(commandRequest(command)).toMatchObject({ method, path });
  });

  it.each([
    ["GET", "/api/boards"],
    ["GET", "/api/tasks/t1"],
    ["PUT", "/api/boards"],
    ["POST", "/api/boards/b1"],
    ["PATCH", "/api/tasks/t1"],
    ["DELETE", "/api/subtasks/s1"],
    ["PATCH", "/api/subtasks/s1/position"],
    ["POST", "/api/columns"],
    ["DELETE", "/api/boards/b1/"],
    ["DELETE", `/api/boards/${"b".repeat(65)}`],
    ["DELETE", "/api/boards/b%201"],
    ["DELETE", "/apix/boards/b1"],
  ])("has no route for %s %s", (method, path) => {
    expect(routeCommand(method, path)).toBeUndefined();
  });
});

describe("routeCommand body checks", () => {
  const board = {
    id: "b1",
    name: "Launch",
    columns: [{ id: "c1", name: "A" }],
  };
  const task = {
    id: "t1",
    columnId: "c1",
    title: "Plan",
    description: "",
    subtasks: [{ id: "s1", title: "Draft" }],
  };
  const columns = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: `c${index}`,
      name: `Column ${index}`,
    }));
  const subtasks = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: `s${index}`,
      title: `Step ${index}`,
    }));

  it.each([
    ["the body is not an object", null],
    ["the body is a list", [board]],
    ["the id is missing", { ...board, id: undefined }],
    ["the id has a space", { ...board, id: "b 1" }],
    ["the name is empty", { ...board, name: "" }],
    ["the name is padded", { ...board, name: " Launch" }],
    ["the name is not text", { ...board, name: 7 }],
    ["the name is too long", { ...board, name: "n".repeat(41) }],
    ["the columns are missing", { ...board, columns: undefined }],
    ["a column has no name", { ...board, columns: [{ id: "c1", name: "" }] }],
    ["a column has a bad id", { ...board, columns: [{ id: "", name: "A" }] }],
    ["a column is not an object", { ...board, columns: ["A"] }],
    [
      "two columns share a name",
      {
        ...board,
        columns: [
          { id: "c1", name: "A" },
          { id: "c2", name: "a" },
        ],
      },
    ],
    [
      "two columns share an id",
      {
        ...board,
        columns: [
          { id: "c1", name: "A" },
          { id: "c1", name: "B" },
        ],
      },
    ],
    [
      "there are too many columns",
      { ...board, columns: columns(LIMITS.columnsPerBoard + 1) },
    ],
  ])("rejects a board when %s", (_, body) => {
    expect(routeCommand("POST", "/api/boards")!(body)).toBeUndefined();
  });

  it("accepts a board at every limit", () => {
    const body = {
      ...board,
      name: "n".repeat(LIMITS.nameLength),
      columns: columns(LIMITS.columnsPerBoard),
    };
    expect(routeCommand("POST", "/api/boards")!(body)).toMatchObject({
      type: "createBoard",
    });
  });

  it.each([
    ["the column id is missing", { ...task, columnId: undefined }],
    ["the title is empty", { ...task, title: "" }],
    ["the title is too long", { ...task, title: "t".repeat(121) }],
    ["the description is missing", { ...task, description: undefined }],
    ["the description is padded", { ...task, description: "Plan " }],
    ["the description is too long", { ...task, description: "d".repeat(2001) }],
    ["a subtask is empty", { ...task, subtasks: [{ id: "s1", title: "" }] }],
    [
      "a subtask is too long",
      { ...task, subtasks: [{ id: "s1", title: "s".repeat(121) }] },
    ],
    ["a subtask has no id", { ...task, subtasks: [{ title: "Draft" }] }],
    ["the subtasks are not a list", { ...task, subtasks: "Draft" }],
    ["there are too many subtasks", { ...task, subtasks: subtasks(21) }],
  ])("rejects a task when %s", (_, body) => {
    expect(routeCommand("POST", "/api/tasks")!(body)).toBeUndefined();
  });

  it("accepts a task at every limit", () => {
    const body = {
      ...task,
      title: "t".repeat(LIMITS.titleLength),
      description: "d".repeat(LIMITS.descriptionLength),
      subtasks: subtasks(LIMITS.subtasksPerTask),
    };
    expect(routeCommand("POST", "/api/tasks")!(body)).toMatchObject({
      type: "createTask",
    });
  });

  it.each([
    ["a negative index", { columnId: "c1", index: -1 }],
    ["a fractional index", { columnId: "c1", index: 1.5 }],
    ["an index as text", { columnId: "c1", index: "1" }],
    ["no column", { index: 0 }],
  ])("rejects a move with %s", (_, body) => {
    expect(
      routeCommand("PATCH", "/api/tasks/t1/position")!(body),
    ).toBeUndefined();
  });

  it("accepts a move to the top", () => {
    expect(
      routeCommand("PATCH", "/api/tasks/t1/position")!({
        columnId: "c1",
        index: 0,
      }),
    ).toEqual({ type: "moveTask", taskId: "t1", columnId: "c1", index: 0 });
  });

  it.each([["true"], [1], [null], [undefined]])(
    "rejects a subtask state of %j",
    (isCompleted) => {
      expect(
        routeCommand("PATCH", "/api/subtasks/s1")!({ isCompleted }),
      ).toBeUndefined();
    },
  );

  it("takes the id from the path when editing", () => {
    const body = { id: "other", name: "Ship", columns: [] };
    expect(routeCommand("PUT", "/api/boards/b1")!(body)).toEqual({
      type: "updateBoard",
      board: { id: "b1", name: "Ship", columns: [] },
    });
  });
});
