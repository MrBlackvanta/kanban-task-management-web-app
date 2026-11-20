import { seedBoards } from "@/data";
import { LIMITS, type Board, type Command } from "@/lib";
import { describe, expect, it } from "vite-plus/test";
import { exceedsLimits, findProblem } from "./checks";

const task = { id: "t-new", title: "Plan", description: "", subtasks: [] };

describe("findProblem", () => {
  it.each<[string, Command, string | undefined]>([
    [
      "a new board",
      { type: "createBoard", board: { id: "b-new", name: "A", columns: [] } },
      undefined,
    ],
    [
      "a board id in use",
      { type: "createBoard", board: { id: "seed-b2", name: "A", columns: [] } },
      "taken",
    ],
    [
      "editing a board",
      { type: "updateBoard", board: { id: "seed-b2", name: "A", columns: [] } },
      undefined,
    ],
    [
      "editing a missing board",
      { type: "updateBoard", board: { id: "nope", name: "A", columns: [] } },
      "missing",
    ],
    [
      "deleting a board",
      { type: "deleteBoard", boardId: "seed-b3" },
      undefined,
    ],
    [
      "deleting a missing board",
      { type: "deleteBoard", boardId: "nope" },
      "missing",
    ],
    [
      "a new task",
      { type: "createTask", columnId: "seed-b3-c2", task },
      undefined,
    ],
    [
      "a task id in use",
      {
        type: "createTask",
        columnId: "seed-b3-c2",
        task: { ...task, id: "seed-t1" },
      },
      "taken",
    ],
    [
      "a task in a missing column",
      { type: "createTask", columnId: "nope", task },
      "missing",
    ],
    [
      "editing a task",
      {
        type: "updateTask",
        columnId: "seed-b1-c3",
        task: { ...task, id: "seed-t1" },
      },
      undefined,
    ],
    [
      "editing a missing task",
      { type: "updateTask", columnId: "seed-b1-c3", task },
      "missing",
    ],
    [
      "editing a task into another board",
      {
        type: "updateTask",
        columnId: "seed-b2-c1",
        task: { ...task, id: "seed-t1" },
      },
      "missing",
    ],
    [
      "moving a task",
      { type: "moveTask", taskId: "seed-t1", columnId: "seed-b1-c2", index: 0 },
      undefined,
    ],
    [
      "moving a missing task",
      { type: "moveTask", taskId: "nope", columnId: "seed-b1-c2", index: 0 },
      "missing",
    ],
    [
      "moving a task into another board",
      { type: "moveTask", taskId: "seed-t1", columnId: "seed-b3-c1", index: 0 },
      "missing",
    ],
    [
      "ticking a subtask",
      {
        type: "setSubtaskCompleted",
        subtaskId: "seed-t22-s3",
        isCompleted: true,
      },
      undefined,
    ],
    [
      "ticking a missing subtask",
      { type: "setSubtaskCompleted", subtaskId: "nope", isCompleted: true },
      "missing",
    ],
    ["deleting a task", { type: "deleteTask", taskId: "seed-t22" }, undefined],
    [
      "deleting a missing task",
      { type: "deleteTask", taskId: "nope" },
      "missing",
    ],
  ])("judges %s", (_, command, problem) => {
    expect(findProblem(seedBoards, command)).toBe(problem);
  });
});

describe("exceedsLimits", () => {
  const boards = (count: number): Board[] =>
    Array.from({ length: count }, (_, index) => ({
      id: `b${index}`,
      name: `b${index}`,
      columns: [],
    }));
  const tasks = (count: number): Board[] => [
    {
      id: "b",
      name: "b",
      columns: [
        {
          id: "c",
          name: "c",
          tasks: Array.from({ length: count }, (_, index) => ({
            ...task,
            id: `t${index}`,
          })),
        },
      ],
    },
  ];

  it.each([
    ["boards at the limit", boards(LIMITS.boards), false],
    ["boards over the limit", boards(LIMITS.boards + 1), true],
    ["tasks at the limit", tasks(LIMITS.tasks), false],
    ["tasks over the limit", tasks(LIMITS.tasks + 1), true],
  ])("judges %s", (_, value, expected) => {
    expect(exceedsLimits(value)).toBe(expected);
  });
});
