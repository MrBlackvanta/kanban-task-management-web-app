import { describe, expect, it } from "vite-plus/test";
import { seedBoards } from "./seed";

const columns = seedBoards.flatMap((board) => board.columns);
const tasks = columns.flatMap((column) => column.tasks);
const subtasks = tasks.flatMap((task) => task.subtasks);

describe("seedBoards", () => {
  it("holds the three starter boards with their columns and task counts", () => {
    expect(
      seedBoards.map((board) => [
        board.name,
        board.columns.map((c) => `${c.name} ${c.tasks.length}`),
      ]),
    ).toEqual([
      ["Platform Launch", ["Todo 4", "Doing 6", "Done 7"]],
      ["Marketing Plan", ["Todo 3", "Doing 0", "Done 0"]],
      ["Roadmap", ["Now 2", "Next 0", "Later 0"]],
    ]);
  });

  it("gives every entity a unique id", () => {
    const ids = [seedBoards, columns, tasks, subtasks].flat().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ships with the starter data's typos corrected", () => {
    const text = JSON.stringify(seedBoards);
    expect(text).not.toMatch(/enpoints|asssumptions|Inndie/);
  });
});
