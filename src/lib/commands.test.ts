import { describe, expect, it } from "vite-plus/test";
import { locateTask } from "./boards";
import { applyCommand } from "./commands";
import type { Board, Column, Command, Subtask, Task } from "./types";

const subtask = (id: string, isCompleted = false): Subtask => ({
  id,
  title: id,
  isCompleted,
});
const task = (id: string, ...subtasks: Subtask[]): Task => ({
  id,
  title: id,
  description: "",
  subtasks,
});
const column = (id: string, ...tasks: Task[]): Column => ({
  id,
  name: id,
  tasks,
});
const board = (id: string, ...columns: Column[]): Board => ({
  id,
  name: id,
  columns,
});

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const boards = deepFreeze([
  board(
    "b1",
    column(
      "todo",
      task("t1", subtask("s1", true), subtask("s2")),
      task("t2"),
      task("t3"),
    ),
    column("doing", task("t4")),
    column("done"),
  ),
  board("b2", column("now", task("t5"))),
]);

const run = (command: Command) => applyCommand(boards, command);

function taskIds(state: Board[], columnId: string) {
  const found = state.flatMap((b) => b.columns).find((c) => c.id === columnId);
  return found?.tasks.map((t) => t.id);
}

describe("moveTask", () => {
  it.each([
    [
      "down to the bottom of its column",
      "t1",
      "todo",
      2,
      { todo: ["t2", "t3", "t1"] },
    ],
    ["one slot down", "t1", "todo", 1, { todo: ["t2", "t1", "t3"] }],
    ["up to the top", "t3", "todo", 0, { todo: ["t3", "t1", "t2"] }],
    [
      "past the end of its own column",
      "t1",
      "todo",
      99,
      { todo: ["t2", "t3", "t1"] },
    ],
    [
      "to the top of another column",
      "t1",
      "doing",
      0,
      { todo: ["t2", "t3"], doing: ["t1", "t4"] },
    ],
    [
      "to the bottom of another column",
      "t1",
      "doing",
      1,
      { doing: ["t4", "t1"] },
    ],
    [
      "past the end of another column",
      "t1",
      "doing",
      99,
      { doing: ["t4", "t1"] },
    ],
    [
      "with a negative index, to the top",
      "t4",
      "todo",
      -5,
      { todo: ["t4", "t1", "t2", "t3"], doing: [] },
    ],
    [
      "with a negative index in its own column, to the top",
      "t2",
      "todo",
      -1,
      { todo: ["t2", "t1", "t3"] },
    ],
    ["into an empty column", "t4", "done", 0, { doing: [], done: ["t4"] }],
  ])("moves a task %s", (_, taskId, columnId, index, expected) => {
    const next = run({ type: "moveTask", taskId, columnId, index });
    for (const [id, ids] of Object.entries(expected)) {
      expect(taskIds(next, id)).toEqual(ids);
    }
  });

  it.each([
    ["onto its own slot", "t2", "todo", 1],
    ["past the end when it is already last", "t3", "todo", 99],
    ["before the start when it is already first", "t1", "todo", -3],
    ["when the task is unknown", "nope", "todo", 0],
    ["when the column is unknown", "t1", "nope", 0],
    ["into a column on another board", "t1", "now", 0],
  ])("returns the same boards when moving %s", (_, taskId, columnId, index) => {
    expect(run({ type: "moveTask", taskId, columnId, index })).toBe(boards);
  });

  it("carries the task itself, subtasks included", () => {
    const next = run({
      type: "moveTask",
      taskId: "t1",
      columnId: "done",
      index: 0,
    });
    expect(locateTask(next, "t1")?.task).toBe(boards[0].columns[0].tasks[0]);
  });

  it("leaves other boards untouched by reference", () => {
    const next = run({
      type: "moveTask",
      taskId: "t1",
      columnId: "done",
      index: 0,
    });
    expect(next[1]).toBe(boards[1]);
    expect(next[0].columns[1]).toBe(boards[0].columns[1]);
  });
});

describe("createBoard", () => {
  it("appends the board with empty columns in draft order", () => {
    const next = run({
      type: "createBoard",
      board: {
        id: "b3",
        name: "New",
        columns: [
          { id: "c2", name: "B" },
          { id: "c1", name: "A" },
        ],
      },
    });
    expect(next.at(-1)).toEqual({
      id: "b3",
      name: "New",
      columns: [
        { id: "c2", name: "B", tasks: [] },
        { id: "c1", name: "A", tasks: [] },
      ],
    });
  });

  it("ignores a board whose id already exists", () => {
    expect(
      run({
        type: "createBoard",
        board: { id: "b1", name: "Copy", columns: [] },
      }),
    ).toBe(boards);
  });
});

describe("updateBoard", () => {
  const next = run({
    type: "updateBoard",
    board: {
      id: "b1",
      name: "Renamed",
      columns: [
        { id: "done", name: "Finished" },
        { id: "todo", name: "Todo" },
        { id: "later", name: "Later" },
      ],
    },
  });
  const [updated] = next;

  it("renames the board and reorders its columns", () => {
    expect(updated.name).toBe("Renamed");
    expect(updated.columns.map((c) => [c.id, c.name])).toEqual([
      ["done", "Finished"],
      ["todo", "Todo"],
      ["later", "Later"],
    ]);
  });

  it("keeps the tasks of columns that stay, and adds new columns empty", () => {
    expect(taskIds(next, "todo")).toEqual(["t1", "t2", "t3"]);
    expect(taskIds(next, "later")).toEqual([]);
  });

  it("drops a removed column together with its tasks", () => {
    expect(taskIds(next, "doing")).toBeUndefined();
    expect(locateTask(next, "t4")).toBeUndefined();
  });

  it("ignores an unknown board", () => {
    expect(
      run({
        type: "updateBoard",
        board: { id: "nope", name: "X", columns: [] },
      }),
    ).toBe(boards);
  });
});

describe("deleteBoard", () => {
  it("removes the board", () => {
    expect(
      run({ type: "deleteBoard", boardId: "b1" }).map((b) => b.id),
    ).toEqual(["b2"]);
  });

  it("ignores an unknown board", () => {
    expect(run({ type: "deleteBoard", boardId: "nope" })).toBe(boards);
  });
});

describe("createTask", () => {
  const draft = {
    id: "t9",
    title: "New",
    description: "Notes",
    subtasks: [{ id: "s9", title: "Step" }],
  };

  it("adds the task to the bottom of its column with every subtask open", () => {
    const next = run({ type: "createTask", columnId: "todo", task: draft });
    expect(taskIds(next, "todo")).toEqual(["t1", "t2", "t3", "t9"]);
    expect(locateTask(next, "t9")?.task).toEqual({
      ...draft,
      subtasks: [{ id: "s9", title: "Step", isCompleted: false }],
    });
  });

  it.each([
    ["an unknown column", "nope", draft],
    ["a task id that already exists", "todo", { ...draft, id: "t4" }],
  ])("ignores %s", (_, columnId, task) => {
    expect(run({ type: "createTask", columnId, task })).toBe(boards);
  });
});

describe("updateTask", () => {
  const draft = {
    id: "t1",
    title: "Edited",
    description: "More",
    subtasks: [
      { id: "s1", title: "Kept" },
      { id: "s3", title: "Added" },
    ],
  };

  it("edits in place and keeps the task's position", () => {
    const next = run({ type: "updateTask", columnId: "todo", task: draft });
    expect(taskIds(next, "todo")).toEqual(["t1", "t2", "t3"]);
    expect(locateTask(next, "t1")?.task).toMatchObject({
      title: "Edited",
      description: "More",
    });
  });

  it("keeps completion for subtasks that stay and starts new ones open", () => {
    const next = run({ type: "updateTask", columnId: "todo", task: draft });
    expect(locateTask(next, "t1")?.task.subtasks).toEqual([
      { id: "s1", title: "Kept", isCompleted: true },
      { id: "s3", title: "Added", isCompleted: false },
    ]);
  });

  it("moves the task to the bottom of a new column", () => {
    const next = run({ type: "updateTask", columnId: "doing", task: draft });
    expect(taskIds(next, "todo")).toEqual(["t2", "t3"]);
    expect(taskIds(next, "doing")).toEqual(["t4", "t1"]);
  });

  it.each([
    ["an unknown task", "todo", { ...draft, id: "nope" }],
    ["a column on another board", "now", draft],
    ["an unknown column", "nope", draft],
  ])("ignores %s", (_, columnId, task) => {
    expect(run({ type: "updateTask", columnId, task })).toBe(boards);
  });
});

describe("setSubtaskCompleted", () => {
  it.each([
    ["s2", true],
    ["s1", false],
  ])("sets %s to %s", (subtaskId, isCompleted) => {
    const next = run({ type: "setSubtaskCompleted", subtaskId, isCompleted });
    const subtasks = locateTask(next, "t1")?.task.subtasks;
    expect(subtasks?.find((s) => s.id === subtaskId)?.isCompleted).toBe(
      isCompleted,
    );
  });

  it.each([
    ["it already has that value", "s1", true],
    ["the subtask is unknown", "nope", true],
  ])("returns the same boards when %s", (_, subtaskId, isCompleted) => {
    expect(run({ type: "setSubtaskCompleted", subtaskId, isCompleted })).toBe(
      boards,
    );
  });
});

describe("deleteTask", () => {
  it("removes the task from its column", () => {
    expect(taskIds(run({ type: "deleteTask", taskId: "t2" }), "todo")).toEqual([
      "t1",
      "t3",
    ]);
  });

  it("ignores an unknown task", () => {
    expect(run({ type: "deleteTask", taskId: "nope" })).toBe(boards);
  });
});
