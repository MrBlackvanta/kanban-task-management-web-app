import { seedBoards } from "@/data";
import { closeDialog, dispatch, openDialog, selectBoard } from "@/store";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import ActiveBoard from "./active-board";
import BoardDialogs from "./board-dialogs";

const [platformLaunch] = seedBoards;
const BOARD = "view-board";

function createBoard() {
  dispatch({
    type: "createBoard",
    board: {
      id: BOARD,
      name: "Launch",
      columns: [
        { id: "todo", name: "Todo" },
        { id: "doing", name: "Doing" },
        { id: "done", name: "Done" },
      ],
    },
  });
  dispatch({
    type: "createTask",
    columnId: "todo",
    task: {
      id: "plan",
      title: "Plan the launch",
      description: "Pick a date.\nBook the venue.",
      subtasks: [
        { id: "plan-draft", title: "Draft" },
        { id: "plan-review", title: "Review" },
        { id: "plan-ship", title: "Ship" },
      ],
    },
  });
  dispatch({
    type: "createTask",
    columnId: "todo",
    task: { id: "bare", title: "Bare task", description: "", subtasks: [] },
  });
  dispatch({
    type: "createTask",
    columnId: "doing",
    task: { id: "busy", title: "Busy task", description: "", subtasks: [] },
  });
  selectBoard(BOARD);
}

function renderBoard() {
  const user = userEvent.setup();
  render(
    <>
      <ActiveBoard />
      <BoardDialogs />
    </>,
  );
  return user;
}

async function openTask(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  await user.click(screen.getByRole("button", { name: title }));
  return screen.getByRole("dialog", { name: title });
}

function cardTitles(columnHeading: string) {
  const column = screen
    .getAllByRole("heading", { level: 2 })
    .find((heading) => heading.textContent === columnHeading)!
    .closest("section")!;
  return within(column)
    .queryAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

function cardFor(title: string) {
  return screen
    .getByRole("heading", { level: 3, name: title })
    .closest("article")!;
}

describe("ViewTaskDialog", () => {
  beforeEach(createBoard);

  afterEach(() => {
    act(() => {
      closeDialog();
      dispatch({ type: "deleteBoard", boardId: BOARD });
      selectBoard(platformLaunch.id);
    });
  });

  it("opens from its card, named after the task and focused on its options", async () => {
    const user = renderBoard();

    const dialog = await openTask(user, "Plan the launch");

    expect(
      within(dialog).getByRole("heading", {
        level: 2,
        name: "Plan the launch",
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Task options" }),
    ).toHaveFocus();
    expect(within(dialog).getAllByRole("button")).toHaveLength(1);
  });

  it("offers Edit Task and Delete Task from its options, closing them first on Escape", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");
    const options = within(dialog).getByRole("button", {
      name: "Task options",
    });

    await user.click(options);
    expect(
      within(dialog)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["", "Edit Task", "Delete Task"]);

    await user.keyboard("{Escape}");
    expect(
      within(dialog).queryByRole("button", { name: "Edit Task" }),
    ).not.toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
    expect(options).toHaveFocus();
  });

  it("shows the description as written", async () => {
    const user = renderBoard();

    const dialog = await openTask(user, "Plan the launch");

    expect(
      within(dialog).getByText((_, element) =>
        element?.tagName === "P"
          ? element.textContent === "Pick a date.\nBook the venue."
          : false,
      ),
    ).toBeInTheDocument();
  });

  it("leaves out an empty description and an empty subtask list", async () => {
    const user = renderBoard();

    const dialog = await openTask(user, "Bare task");

    expect(dialog.querySelector("p")).toBeNull();
    expect(within(dialog).queryByRole("group")).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("combobox", { name: "Current Status" }),
    ).toBeInTheDocument();
  });

  it("ticks each subtask as stored and counts the ones done", async () => {
    selectBoard(platformLaunch.id);
    const user = renderBoard();

    const dialog = await openTask(user, "Build UI for onboarding flow");
    const group = within(dialog).getByRole("group", {
      name: "Subtasks (1 of 3)",
    });

    expect(
      within(group)
        .getAllByRole("checkbox")
        .map((box) => [
          box.closest("label")!.textContent,
          box.matches(":checked"),
        ]),
    ).toEqual([
      ["Sign up page", true],
      ["Sign in page", false],
      ["Welcome page", false],
    ]);
  });

  it("saves a ticked subtask, updating the dialog and the card", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");

    await user.click(within(dialog).getByRole("checkbox", { name: "Review" }));

    expect(
      within(dialog).getByRole("checkbox", { name: "Review" }),
    ).toBeChecked();
    expect(
      within(dialog).getByRole("group", { name: "Subtasks (1 of 3)" }),
    ).toBeInTheDocument();
    expect(cardFor("Plan the launch")).toHaveTextContent("1 of 3 subtasks");

    await user.click(within(dialog).getByRole("checkbox", { name: "Review" }));

    expect(
      within(dialog).getByRole("checkbox", { name: "Review" }),
    ).not.toBeChecked();
    expect(cardFor("Plan the launch")).toHaveTextContent("0 of 3 subtasks");
  });

  it("ticks a subtask from anywhere on its row", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");

    await user.click(within(dialog).getByText("Ship"));

    expect(
      within(dialog).getByRole("checkbox", { name: "Ship" }),
    ).toBeChecked();
  });

  it("shows the task's column as its status, out of the board's columns", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");
    const status = within(dialog).getByRole("combobox", {
      name: "Current Status",
    });

    expect(status).toHaveDisplayValue("Todo");
    expect(
      within(status)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Todo", "Doing", "Done"]);
  });

  it("moves the task to the bottom of its new column and stays open", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");

    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Current Status" }),
      "Doing",
    );

    expect(cardTitles("Todo (1)")).toEqual(["Bare task"]);
    expect(cardTitles("Doing (2)")).toEqual(["Busy task", "Plan the launch"]);
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("combobox", { name: "Current Status" }),
    ).toHaveDisplayValue("Doing");
  });

  it("closes on Escape and hands focus back to the card", async () => {
    const user = renderBoard();
    await openTask(user, "Plan the launch");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Plan the launch" }),
    ).toHaveFocus();
  });

  it("hands focus to the card in its new column after a move", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Current Status" }),
      "Done",
    );

    await user.keyboard("{Escape}");

    expect(cardTitles("Done (1)")).toEqual(["Plan the launch"]);
    expect(
      screen.getByRole("button", { name: "Plan the launch" }),
    ).toHaveFocus();
  });

  it("opens the same task again after closing", async () => {
    const user = renderBoard();
    await openTask(user, "Plan the launch");
    await user.keyboard("{Escape}");

    const dialog = await openTask(user, "Plan the launch");

    expect(dialog).toBeVisible();
  });

  it("never tabs onto the click-away layer", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");
    within(dialog).getByRole("combobox", { name: "Current Status" }).focus();

    await user.tab();

    expect(document.activeElement).not.toHaveAttribute("aria-hidden");
  });

  it("closes on a click outside the panel", async () => {
    const user = renderBoard();
    const dialog = await openTask(user, "Plan the launch");

    await user.click(dialog.querySelector(":scope > [aria-hidden]")!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens nothing for a task that no longer exists", () => {
    renderBoard();

    act(() => openDialog({ kind: "viewTask", taskId: "missing" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
