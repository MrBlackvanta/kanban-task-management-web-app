import { describe, expect, it } from "vite-plus/test";
import { completedCount, locateTask } from "./boards";
import type { Board } from "./types";

const boards: Board[] = [
  {
    id: "b1",
    name: "Board",
    columns: [
      { id: "c1", name: "Todo", tasks: [] },
      {
        id: "c2",
        name: "Doing",
        tasks: [
          { id: "t1", title: "A", description: "", subtasks: [] },
          {
            id: "t2",
            title: "B",
            description: "",
            subtasks: [
              { id: "s1", title: "One", isCompleted: true },
              { id: "s2", title: "Two", isCompleted: false },
              { id: "s3", title: "Three", isCompleted: true },
            ],
          },
        ],
      },
    ],
  },
];

describe("locateTask", () => {
  it("finds the task with its board, column and index", () => {
    const location = locateTask(boards, "t2");
    expect(location?.board.id).toBe("b1");
    expect(location?.column.id).toBe("c2");
    expect(location?.index).toBe(1);
    expect(location?.task.title).toBe("B");
  });

  it("returns undefined for an unknown task", () => {
    expect(locateTask(boards, "nope")).toBeUndefined();
  });
});

describe("completedCount", () => {
  it.each([
    ["t1", 0],
    ["t2", 2],
  ])("counts the completed subtasks of %s", (taskId, count) => {
    const task = locateTask(boards, taskId)?.task;
    expect(task && completedCount(task)).toBe(count);
  });
});
