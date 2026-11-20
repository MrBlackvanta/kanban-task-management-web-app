import { seedBoards } from "@/data";
import { applyCommand, type Command } from "@/lib";
import { describe, expect, it } from "vite-plus/test";
import { NO_ROWS, diffRows, hasDuplicateIds, toBoards, toRows } from "./rows";

const seedRows = toRows(seedBoards);

function changesFor(command: Command) {
  const changes = diffRows(seedRows, toRows(applyCommand(seedBoards, command)));
  return Object.fromEntries(
    Object.entries(changes).map(([table, { inserts, updates, deletes }]) => [
      table,
      {
        inserts: inserts.map((row) => row.id),
        updates: updates.map((row) => row.id),
        deletes,
      },
    ]),
  );
}

const none = { inserts: [], updates: [], deletes: [] };

describe("toRows and toBoards", () => {
  it("round-trip the seed", () => {
    expect(toBoards(seedRows)).toEqual(seedBoards);
  });

  it("number each row within its parent", () => {
    expect(seedRows.boards.map((row) => row.position)).toEqual([0, 1, 2]);
    expect(seedRows.columns.map((row) => row.position)).toEqual([
      0, 1, 2, 0, 1, 2, 0, 1, 2,
    ]);
    expect(seedRows.subtasks[0]).toEqual({
      id: "seed-t1-s1",
      taskId: "seed-t1",
      title: "Sign up page",
      isCompleted: true,
      position: 0,
    });
  });
});

describe("diffRows", () => {
  it("writes every row for a new workspace", () => {
    const changes = diffRows(NO_ROWS, seedRows);
    expect(changes.subtasks.inserts).toEqual(seedRows.subtasks);
    expect(changes.boards.inserts).toEqual(seedRows.boards);
  });

  it.each<[string, Command, object]>([
    [
      "ticking a subtask",
      {
        type: "setSubtaskCompleted",
        subtaskId: "seed-t1-s2",
        isCompleted: true,
      },
      { subtasks: { ...none, updates: ["seed-t1-s2"] } },
    ],
    [
      "moving a task down its column",
      { type: "moveTask", taskId: "seed-t1", columnId: "seed-b1-c1", index: 2 },
      { tasks: { ...none, updates: ["seed-t2", "seed-t3", "seed-t1"] } },
    ],
    [
      "deleting a task",
      { type: "deleteTask", taskId: "seed-t21" },
      {
        tasks: { ...none, updates: ["seed-t22"], deletes: ["seed-t21"] },
        subtasks: { ...none, deletes: ["seed-t21-s1", "seed-t21-s2"] },
      },
    ],
    [
      "renaming a board",
      {
        type: "updateBoard",
        board: {
          id: "seed-b3",
          name: "Plans",
          columns: [
            { id: "seed-b3-c1", name: "Now" },
            { id: "seed-b3-c2", name: "Next" },
            { id: "seed-b3-c3", name: "Later" },
          ],
        },
      },
      { boards: { ...none, updates: ["seed-b3"] } },
    ],
  ])("touches only what changed when %s", (_, command, expected) => {
    expect(changesFor(command)).toEqual({
      boards: none,
      columns: none,
      tasks: none,
      subtasks: none,
      ...expected,
    });
  });
});

describe("hasDuplicateIds", () => {
  it.each([
    ["the seed", seedRows, false],
    [
      "a column id used twice",
      { ...seedRows, columns: [...seedRows.columns, seedRows.columns[0]] },
      true,
    ],
    [
      "a subtask id used twice",
      { ...seedRows, subtasks: [...seedRows.subtasks, seedRows.subtasks[0]] },
      true,
    ],
  ])("judges %s", (_, rows, expected) => {
    expect(hasDuplicateIds(rows)).toBe(expected);
  });
});
