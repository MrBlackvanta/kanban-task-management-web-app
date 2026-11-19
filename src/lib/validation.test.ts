import { describe, expect, it } from "vite-plus/test";
import { FIELD_ERRORS, validateBoard, validateTask } from "./validation";

const { empty, duplicate } = FIELD_ERRORS;

describe("validateBoard", () => {
  it.each([
    [
      "a name and unique columns",
      { name: "Roadmap", columns: ["Now", "Next"] },
    ],
    ["a name and no columns", { name: "Roadmap", columns: [] }],
  ])("accepts %s", (_, values) => {
    expect(validateBoard(values)).toBeNull();
  });

  it.each([
    ["an empty name", { name: "", columns: [] }, { name: empty, columns: [] }],
    [
      "a whitespace name",
      { name: "  \t", columns: [] },
      { name: empty, columns: [] },
    ],
    [
      "an empty column",
      { name: "Roadmap", columns: ["Now", " "] },
      { name: undefined, columns: [undefined, empty] },
    ],
    [
      "repeats of a column, ignoring case and spaces",
      { name: "Roadmap", columns: ["Todo", "todo ", " TODO", "Done"] },
      {
        name: undefined,
        columns: [undefined, duplicate, duplicate, undefined],
      },
    ],
    [
      "two empty columns as empty, not repeated",
      { name: "Roadmap", columns: ["", ""] },
      { name: undefined, columns: [empty, empty] },
    ],
  ])("flags %s", (_, values, errors) => {
    expect(validateBoard(values)).toEqual(errors);
  });
});

describe("validateTask", () => {
  it.each([
    ["a title and subtasks", { title: "Ship", subtasks: ["One", "Two"] }],
    ["a title and no subtasks", { title: "Ship", subtasks: [] }],
    ["repeated subtasks", { title: "Ship", subtasks: ["Test", "Test"] }],
  ])("accepts %s", (_, values) => {
    expect(validateTask(values)).toBeNull();
  });

  it.each([
    [
      "an empty title",
      { title: " ", subtasks: [] },
      { title: empty, subtasks: [] },
    ],
    [
      "an empty subtask",
      { title: "Ship", subtasks: ["One", ""] },
      { title: undefined, subtasks: [undefined, empty] },
    ],
  ])("flags %s", (_, values, errors) => {
    expect(validateTask(values)).toEqual(errors);
  });
});
