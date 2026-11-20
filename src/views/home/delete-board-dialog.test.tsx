import { dispatch, selectBoard } from "@/store";
import {
  createTestBoard,
  renderBoard,
  resetBoards,
  sidebar,
  TEST_BOARD,
} from "@/test/board";
import { act, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

function boardOptions() {
  return screen.getByRole("button", { name: "Board options" });
}

async function openDeleteBoard(user: UserEvent) {
  await user.click(boardOptions());
  await user.click(screen.getByRole("button", { name: "Delete Board" }));
  return screen.getByRole("alertdialog", { name: "Delete this board?" });
}

function boardNames() {
  return within(sidebar())
    .getAllByRole("listitem")
    .map((item) => item.textContent);
}

function currentBoard() {
  return within(sidebar())
    .getAllByRole("button")
    .find((button) => button.getAttribute("aria-current") === "true")
    ?.textContent;
}

describe("DeleteBoardDialog", () => {
  beforeEach(createTestBoard);
  afterEach(resetBoards);

  it("offers Edit Board and Delete Board in the board menu", async () => {
    const user = renderBoard();

    expect(
      screen.queryByRole("button", { name: "Edit Board" }),
    ).not.toBeInTheDocument();

    await user.click(boardOptions());

    expect(
      screen.getByRole("button", { name: "Edit Board" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Board" }),
    ).toBeInTheDocument();
  });

  it("asks for confirmation naming the board, focused on Cancel", async () => {
    const user = renderBoard();

    const dialog = await openDeleteBoard(user);

    expect(dialog).toHaveAccessibleDescription(
      "Are you sure you want to delete the ‘Launch’ board? This action will remove all columns and tasks and cannot be reversed.",
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
  ])(
    "keeps the board on %s and returns to the menu button",
    async (_, dismiss) => {
      const user = renderBoard();
      await openDeleteBoard(user);

      await dismiss(user);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(boardNames()).toContain("Launch");
      expect(boardOptions()).toHaveFocus();
    },
  );

  it("deletes the last board in the list and moves to the one before", async () => {
    const user = renderBoard();
    const dialog = await openDeleteBoard(user);

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(boardNames()).not.toContain("Launch");
    expect(currentBoard()).toBe("Roadmap");
    expect(boardOptions()).toHaveFocus();
  });

  it("moves to the next board when there is one", async () => {
    const user = renderBoard();
    act(() => {
      dispatch({
        type: "createBoard",
        board: { id: "after", name: "After", columns: [] },
      });
      selectBoard(TEST_BOARD);
    });
    const dialog = await openDeleteBoard(user);

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(currentBoard()).toBe("After");
  });
});
