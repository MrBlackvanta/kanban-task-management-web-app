import { seedBoards } from "@/data";
import type { BoardDraft } from "@/lib";
import { dispatch, selectBoard } from "@/store";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import ActiveBoard from "./active-board";

const [platformLaunch, , roadmap] = seedBoards;
const TEMP_BOARD = "temp-board";

function showBoard(columns: BoardDraft["columns"]) {
  dispatch({
    type: "createBoard",
    board: { id: TEMP_BOARD, name: "Temp", columns },
  });
  selectBoard(TEMP_BOARD);
}

function columnHeadings() {
  return screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

function columnNamed(name: string) {
  const heading = screen
    .getAllByRole("heading", { level: 2 })
    .find((candidate) => candidate.textContent === name);
  return heading!.closest("section")!;
}

describe("ActiveBoard", () => {
  afterEach(() => {
    dispatch({ type: "deleteBoard", boardId: TEMP_BOARD });
    selectBoard(platformLaunch.id);
  });

  it("heads each column with its name and task count", () => {
    render(<ActiveBoard />);

    expect(columnHeadings()).toEqual(["Todo (4)", "Doing (6)", "Done (7)"]);
  });

  it("lists every card under its column, in order", () => {
    render(<ActiveBoard />);

    for (const column of platformLaunch.columns) {
      const section = columnNamed(`${column.name} (${column.tasks.length})`);
      expect(
        within(section)
          .getAllByRole("heading", { level: 3 })
          .map((heading) => heading.textContent),
      ).toEqual(column.tasks.map((task) => task.title));
    }
  });

  it("makes each card a button named after its task", () => {
    render(<ActiveBoard />);
    const [firstCard] = screen.getAllByRole("article");

    expect(
      within(firstCard).getByRole("button", {
        name: "Build UI for onboarding flow",
      }),
    ).toBeInTheDocument();
  });

  it.each([
    ["Build settings UI", "0 of 2 subtasks"],
    ["Build UI for onboarding flow", "1 of 3 subtasks"],
    ["Review results of usability tests and iterate", "3 of 3 subtasks"],
    ["Build UI for search", "0 of 1 subtask"],
    ["Conduct 5 wireframe tests", "1 of 1 subtask"],
  ])("counts the subtasks done on %s", (title, progress) => {
    render(<ActiveBoard />);
    const card = screen
      .getByRole("heading", { level: 3, name: title })
      .closest("article")!;

    expect(card).toHaveTextContent(`${title}${progress}`);
  });

  it("counts a task without subtasks", () => {
    showBoard([{ id: "temp-todo", name: "Todo" }]);
    dispatch({
      type: "createTask",
      columnId: "temp-todo",
      task: { id: "temp-task", title: "Plan", description: "", subtasks: [] },
    });
    render(<ActiveBoard />);

    expect(screen.getByRole("article")).toHaveTextContent("0 of 0 subtasks");
  });

  it("keeps an empty column, with an empty list to drop into", () => {
    selectBoard(roadmap.id);
    render(<ActiveBoard />);

    expect(columnHeadings()).toEqual(["Now (2)", "Next (0)", "Later (0)"]);
    const list = within(columnNamed("Next (0)")).getByRole("list");
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("repeats the three dot colours past the third column", () => {
    showBoard(
      ["One", "Two", "Three", "Four"].map((name) => ({ id: name, name })),
    );
    const { container } = render(<ActiveBoard />);
    const dots = [...container.querySelectorAll("h2 > [aria-hidden]")].map(
      (dot) => dot.className,
    );

    expect(new Set(dots.slice(0, 3)).size).toBe(3);
    expect(dots[3]).toBe(dots[0]);
  });

  it("offers a new column after the last one", () => {
    render(<ActiveBoard />);

    expect(
      screen.getByRole("button", { name: "New Column" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/This board is empty/)).not.toBeInTheDocument();
  });

  it("explains an empty board and offers its first column", () => {
    showBoard([]);
    render(<ActiveBoard />);

    expect(
      screen.getByText(
        "This board is empty. Create a new column to get started.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add New Column" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Column" }),
    ).not.toBeInTheDocument();
  });
});
