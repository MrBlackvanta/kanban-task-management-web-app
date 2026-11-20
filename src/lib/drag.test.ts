import { describe, expect, it } from "vite-plus/test";
import { locateTask } from "./boards";
import {
  MAX_SCROLL_STEP,
  SCROLL_EDGE,
  describePlace,
  dropIndex,
  edgeScroll,
  nearestSpan,
  placeTask,
  placeholderIndex,
  sameSlot,
  stepSlot,
  type Direction,
  type Slot,
} from "./drag";
import type { Board } from "./types";

const task = (id: string) => ({ id, title: id, description: "", subtasks: [] });

const board: Board = {
  id: "b",
  name: "Launch",
  columns: [
    { id: "todo", name: "Todo", tasks: [task("a"), task("b"), task("c")] },
    { id: "doing", name: "Doing", tasks: [task("d")] },
    { id: "done", name: "Done", tasks: [] },
  ],
};

describe("sameSlot", () => {
  it.each<[Slot, boolean]>([
    [{ columnId: "todo", index: 1 }, true],
    [{ columnId: "todo", index: 2 }, false],
    [{ columnId: "doing", index: 1 }, false],
  ])("compares %j with todo 1", (slot, expected) => {
    expect(sameSlot({ columnId: "todo", index: 1 }, slot)).toBe(expected);
  });
});

describe("dropIndex", () => {
  it.each([
    [[], 50, 0],
    [[100, 200, 300], 50, 0],
    [[100, 200, 300], 100, 0],
    [[100, 200, 300], 101, 1],
    [[100, 200, 300], 250, 2],
    [[100, 200, 300], 900, 3],
  ])(
    "puts a card among midpoints %j at %d in slot %d",
    (midpoints, y, slot) => {
      expect(dropIndex(midpoints, y)).toBe(slot);
    },
  );
});

describe("nearestSpan", () => {
  const spans = [
    { start: 0, end: 100 },
    { start: 124, end: 224 },
    { start: 248, end: 348 },
  ];

  it.each([
    [-50, 0],
    [50, 0],
    [111, 0],
    [112, 0],
    [113, 1],
    [224, 1],
    [237, 2],
    [900, 2],
  ])("picks the column nearest %d", (x, expected) => {
    expect(nearestSpan(spans, x)).toBe(expected);
  });
});

describe("edgeScroll", () => {
  const area = { start: 100, end: 1100 };

  it.each([
    ["well inside", 600, 0],
    ["just outside the start zone", 100 + SCROLL_EDGE, 0],
    ["just inside the start zone", 99 + SCROLL_EDGE, -1],
    ["halfway into the start zone", 100 + SCROLL_EDGE / 2, -8],
    ["on the start edge", 100, -MAX_SCROLL_STEP],
    ["past the start edge", 20, -MAX_SCROLL_STEP],
    ["just outside the end zone", 1100 - SCROLL_EDGE, 0],
    ["just inside the end zone", 1101 - SCROLL_EDGE, 1],
    ["on the end edge", 1100, MAX_SCROLL_STEP],
    ["past the end edge", 1300, MAX_SCROLL_STEP],
  ])("scrolls %s", (_, position, step) => {
    expect(edgeScroll(position, area)).toBe(step);
  });

  it("uses a 64px zone and at most 16px a frame", () => {
    expect([SCROLL_EDGE, MAX_SCROLL_STEP]).toEqual([64, 16]);
  });
});

describe("placeholderIndex", () => {
  it.each<[string, Slot, number]>([
    ["above the card's own place", { columnId: "todo", index: 0 }, 0],
    ["on the card's own place", { columnId: "todo", index: 1 }, 2],
    ["below the card's own place", { columnId: "todo", index: 2 }, 3],
    ["in another column", { columnId: "doing", index: 1 }, 1],
  ])("skips the hidden card %s", (_, slot, expected) => {
    expect(placeholderIndex({ columnId: "todo", index: 1 }, slot)).toBe(
      expected,
    );
  });
});

describe("stepSlot", () => {
  it.each<[string, Slot, Direction, Slot]>([
    [
      "up",
      { columnId: "todo", index: 1 },
      "up",
      { columnId: "todo", index: 0 },
    ],
    [
      "up from the top",
      { columnId: "todo", index: 0 },
      "up",
      { columnId: "todo", index: 0 },
    ],
    [
      "down",
      { columnId: "todo", index: 0 },
      "down",
      { columnId: "todo", index: 1 },
    ],
    [
      "down from the bottom",
      { columnId: "todo", index: 2 },
      "down",
      { columnId: "todo", index: 2 },
    ],
    [
      "right at the same height",
      { columnId: "todo", index: 1 },
      "right",
      { columnId: "doing", index: 1 },
    ],
    [
      "right past a shorter column's end",
      { columnId: "todo", index: 2 },
      "right",
      { columnId: "doing", index: 1 },
    ],
    [
      "right into an empty column",
      { columnId: "doing", index: 1 },
      "right",
      { columnId: "done", index: 0 },
    ],
    [
      "right from the last column",
      { columnId: "done", index: 0 },
      "right",
      { columnId: "done", index: 0 },
    ],
    [
      "left",
      { columnId: "doing", index: 0 },
      "left",
      { columnId: "todo", index: 0 },
    ],
    [
      "left from the first column",
      { columnId: "todo", index: 1 },
      "left",
      { columnId: "todo", index: 1 },
    ],
  ])("steps %s", (_, slot, direction, expected) => {
    expect(stepSlot(board, "b", slot, direction)).toEqual(expected);
  });

  it("counts the moving card out of its own column", () => {
    expect(
      stepSlot(board, "d", { columnId: "doing", index: 0 }, "down"),
    ).toEqual({ columnId: "doing", index: 0 });
  });
});

describe("placeTask", () => {
  it("moves a card into a slot", () => {
    const [moved] = placeTask([board], "a", { columnId: "doing", index: 1 });
    expect(
      moved.columns.map((column) => column.tasks.map((t) => t.id)),
    ).toEqual([["b", "c"], ["d", "a"], []]);
  });
});

describe("describePlace", () => {
  it.each([
    ["a", "Todo, position 1 of 3"],
    ["c", "Todo, position 3 of 3"],
    ["d", "Doing, position 1 of 1"],
  ])("places %s", (taskId, expected) => {
    expect(describePlace(locateTask([board], taskId)!)).toBe(expected);
  });
});
