import {
  cardButton,
  cardTitles,
  createTestBoard,
  renderBoard,
  resetBoards,
} from "@/test/board";
import { fakeViewTransitions } from "@/test/motion";
import { act, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

async function openDeleteTask(user: UserEvent, title: string) {
  await user.click(cardButton(title));
  await user.click(screen.getByRole("button", { name: "Task options" }));
  await user.click(screen.getByRole("button", { name: "Delete Task" }));
  return screen.getByRole("alertdialog", { name: "Delete this task?" });
}

describe("DeleteTaskDialog", () => {
  beforeEach(createTestBoard);
  afterEach(resetBoards);

  it("asks for confirmation naming the task, focused on Cancel", async () => {
    const user = renderBoard();

    const dialog = await openDeleteTask(user, "Book the venue");

    expect(dialog).toHaveAccessibleDescription(
      "Are you sure you want to delete the ‘Book the venue’ task and its subtasks? This action cannot be reversed.",
    );
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toHaveFocus();
  });

  it.each([
    [
      "Cancel",
      (user: UserEvent) =>
        user.click(screen.getByRole("button", { name: "Cancel" })),
    ],
    ["Escape", (user: UserEvent) => user.keyboard("{Escape}")],
  ])("goes back to the task on %s, deleting nothing", async (_, dismiss) => {
    const user = renderBoard();
    await openDeleteTask(user, "Book the venue");

    await dismiss(user);

    expect(
      screen.getByRole("dialog", { name: "Book the venue" }),
    ).toBeInTheDocument();
    expect(cardTitles("Todo")).toContain("Book the venue");
  });

  it("deletes the task in the same view transition that closes the dialog", async () => {
    const user = renderBoard();
    const dialog = await openDeleteTask(user, "Book the venue");
    const views = fakeViewTransitions();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(dialog).toBeInTheDocument();
    expect(cardTitles("Todo")).toContain("Book the venue");

    act(views.runUpdates);
    expect(dialog).not.toBeInTheDocument();
    expect(cardTitles("Todo")).not.toContain("Book the venue");
    expect(views.start).toHaveBeenCalledOnce();
    expect(cardButton("Send invites")).toHaveFocus();
  });

  it("deletes the task and focuses the next card in its column", async () => {
    const user = renderBoard();
    const dialog = await openDeleteTask(user, "Book the venue");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(cardTitles("Todo")).toEqual(["Plan the launch", "Send invites"]);
    expect(cardButton("Send invites")).toHaveFocus();
  });

  it("focuses the previous card when the last one goes", async () => {
    const user = renderBoard();
    const dialog = await openDeleteTask(user, "Send invites");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(cardButton("Book the venue")).toHaveFocus();
  });

  it("focuses Add New Task when the column empties", async () => {
    const user = renderBoard();
    const dialog = await openDeleteTask(user, "Busy task");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(cardTitles("Doing")).toEqual([]);
    expect(screen.getByRole("button", { name: "Add New Task" })).toHaveFocus();
  });
});
