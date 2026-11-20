import { seedBoards } from "@/data";
import { dispatch } from "@/store";
import { renderBoard, resetBoards } from "@/test/board";
import { act, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

function titleButton() {
  return within(screen.getByRole("heading", { level: 1 })).getByRole("button");
}

function createFirstBoard() {
  return screen
    .getAllByRole("button", { name: "Create New Board" })
    .find((button) => button.closest("main"))!;
}

describe("with every board deleted", () => {
  beforeEach(() => {
    act(() => {
      for (const board of seedBoards) {
        dispatch({ type: "deleteBoard", boardId: board.id });
      }
    });
  });

  afterEach(resetBoards);

  it("invites a first board and turns off the board actions", () => {
    renderBoard();

    expect(
      screen.getByText(
        "There are no boards yet. Create a new board to get started.",
      ),
    ).toBeInTheDocument();
    expect(titleButton()).toHaveAccessibleName("No boards");
    expect(screen.getByRole("button", { name: "Add New Task" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Board options" }),
    ).toBeDisabled();
  });

  it("returns to the invitation when the first board is dismissed", async () => {
    const user = renderBoard();

    await user.click(createFirstBoard());
    await user.keyboard("{Escape}");

    expect(createFirstBoard()).toHaveFocus();
  });

  it("creates the first board and opens it", async () => {
    const user = renderBoard();
    await user.click(createFirstBoard());
    const dialog = screen.getByRole("dialog", { name: "Add New Board" });

    await user.type(
      within(dialog).getByRole("textbox", { name: "Board Name" }),
      "First",
    );
    await user.keyboard("{Enter}");

    expect(titleButton()).toHaveAccessibleName("First");
    expect(screen.getByRole("button", { name: "Board options" })).toBeEnabled();
    expect(titleButton()).toHaveFocus();
  });

  it("comes back once the only board is deleted", async () => {
    act(() =>
      dispatch({
        type: "createBoard",
        board: { id: "only", name: "Only", columns: [] },
      }),
    );
    const user = renderBoard();

    await user.click(screen.getByRole("button", { name: "Board options" }));
    await user.click(screen.getByRole("button", { name: "Delete Board" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(createFirstBoard()).toHaveFocus();
    expect(titleButton()).toHaveAccessibleName("No boards");
  });
});
