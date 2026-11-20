import { LIMITS } from "@/lib";
import { dispatch, selectBoard } from "@/store";
import {
  cardTitles,
  createTestBoard,
  renderBoard,
  resetBoards,
  sidebar,
  TEST_BOARD,
} from "@/test/board";
import { act, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

const EMPTY = "Can't be empty";
const DUPLICATE = "Used already";

function createBoardButton() {
  return within(sidebar()).getByRole("button", { name: "Create New Board" });
}

async function openAddBoard(user: UserEvent) {
  await user.click(createBoardButton());
  return screen.getByRole("dialog", { name: "Add New Board" });
}

async function openEditBoard(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Board options" }));
  await user.click(screen.getByRole("button", { name: "Edit Board" }));
  return screen.getByRole("dialog", { name: "Edit Board" });
}

function nameField(dialog: HTMLElement) {
  return within(dialog).getByRole("textbox", { name: "Board Name" });
}

function columnField(dialog: HTMLElement, position: number) {
  return within(dialog).getByRole("textbox", { name: `Column ${position}` });
}

function columnValues(dialog: HTMLElement) {
  return within(dialog)
    .queryAllByRole("textbox", { name: /^Column/ })
    .map((input) => (input as HTMLInputElement).value);
}

function titleButton() {
  return within(screen.getByRole("heading", { level: 1 })).getByRole("button");
}

function columnNames() {
  return screen
    .getAllByRole("heading", { level: 2 })
    .filter((heading) => heading.closest("section"))
    .map((heading) => heading.textContent.replace(/ \(\d+\)$/, ""));
}

function submit(dialog: HTMLElement, name: string) {
  return within(dialog).getByRole("button", { name });
}

describe("BoardFormDialog", () => {
  beforeEach(createTestBoard);
  afterEach(resetBoards);

  describe("adding", () => {
    it("opens on an empty name with the starter columns", async () => {
      const user = renderBoard();

      const dialog = await openAddBoard(user);

      expect(nameField(dialog)).toHaveFocus();
      expect(nameField(dialog)).toHaveValue("");
      expect(columnValues(dialog)).toEqual(["Todo", "Doing"]);
      expect(nameField(dialog)).toHaveAttribute(
        "placeholder",
        "e.g. Web Design",
      );
      expect(columnField(dialog, 1)).not.toHaveAttribute("placeholder");
    });

    it("creates the board trimmed, shows it and hands focus back", async () => {
      const user = renderBoard();
      const dialog = await openAddBoard(user);

      await user.type(nameField(dialog), "  Web Design  ");
      await user.clear(columnField(dialog, 2));
      await user.type(columnField(dialog, 2), " Review ");
      await user.click(submit(dialog, "Create New Board"));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(titleButton()).toHaveAccessibleName("Web Design");
      expect(columnNames()).toEqual(["Todo", "Review"]);
      const pill = within(sidebar()).getByRole("button", {
        name: "Web Design",
      });
      expect(pill).toHaveAttribute("aria-current", "true");
      expect(pill.textContent).toBe("Web Design");
      expect(createBoardButton()).toHaveFocus();
    });

    it("submits in place, without a native form submission", async () => {
      const user = renderBoard();
      const dialog = await openAddBoard(user);
      let submission: Event | undefined;
      const record = (event: Event) => (submission = event);
      document.addEventListener("submit", record);

      await user.click(submit(dialog, "Create New Board"));
      document.removeEventListener("submit", record);

      expect(submission?.defaultPrevented).toBe(true);
    });

    it("creates nothing on Escape", async () => {
      const user = renderBoard();
      const dialog = await openAddBoard(user);
      await user.type(nameField(dialog), "Draft");

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(titleButton()).toHaveAccessibleName("Launch");
      expect(
        within(sidebar()).queryByRole("button", { name: "Draft" }),
      ).not.toBeInTheDocument();
      expect(createBoardButton()).toHaveFocus();
    });

    it("opens from the mobile board menu, closing it, and returns to its trigger", async () => {
      const user = renderBoard();
      const trigger = titleButton();
      await user.click(trigger);
      const menu = screen.getByRole("dialog", { name: "Boards" });

      await user.click(
        within(menu).getByRole("button", { name: "Create New Board" }),
      );

      expect(menu).not.toHaveAttribute("open");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      const dialog = screen.getByRole("dialog", { name: "Add New Board" });
      expect(nameField(dialog)).toHaveFocus();

      await user.keyboard("{Escape}");
      expect(trigger).toHaveFocus();
    });

    it("flags an empty name and a repeated column, focusing the name", async () => {
      const user = renderBoard();
      const dialog = await openAddBoard(user);

      await user.clear(columnField(dialog, 2));
      await user.type(columnField(dialog, 2), " todo ");
      await user.click(submit(dialog, "Create New Board"));

      expect(nameField(dialog)).toHaveFocus();
      expect(nameField(dialog)).toHaveAccessibleDescription(EMPTY);
      expect(columnField(dialog, 1)).not.toBeInvalid();
      expect(columnField(dialog, 2)).toHaveAccessibleDescription(DUPLICATE);
      expect(screen.getByRole("dialog")).toBe(dialog);
    });

    it("focuses the first bad column when the name is fine", async () => {
      const user = renderBoard();
      const dialog = await openAddBoard(user);
      await user.type(nameField(dialog), "Web Design");

      await user.clear(columnField(dialog, 1));
      await user.click(submit(dialog, "Create New Board"));

      expect(columnField(dialog, 1)).toHaveFocus();
      expect(columnField(dialog, 1)).toHaveAccessibleDescription(EMPTY);
    });

    it("allows a board with no columns", async () => {
      const user = renderBoard();
      const dialog = await openAddBoard(user);
      await user.type(nameField(dialog), "Blank");

      await user.click(
        within(dialog).getByRole("button", { name: "Remove column 1" }),
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Remove column 1" }),
      );
      await user.click(submit(dialog, "Create New Board"));

      expect(titleButton()).toHaveAccessibleName("Blank");
      expect(
        screen.getByRole("button", { name: "Add New Column" }),
      ).toBeInTheDocument();
    });

    it("adds a column row and focuses it, up to the limit", async () => {
      const user = renderBoard();
      const dialog = await openAddBoard(user);
      const addColumn = within(dialog).getByRole("button", {
        name: "Add New Column",
      });

      await user.click(addColumn);
      expect(columnField(dialog, 3)).toHaveFocus();

      for (let row = 4; row <= LIMITS.columnsPerBoard + 1; row += 1) {
        await user.click(addColumn);
      }
      expect(columnValues(dialog)).toHaveLength(LIMITS.columnsPerBoard);
      expect(addColumn).toHaveAttribute("aria-disabled", "true");
    });

    it("caps the name and column lengths", async () => {
      const user = renderBoard();

      const dialog = await openAddBoard(user);

      expect(nameField(dialog)).toHaveAttribute(
        "maxlength",
        String(LIMITS.nameLength),
      );
      expect(columnField(dialog, 1)).toHaveAttribute(
        "maxlength",
        String(LIMITS.nameLength),
      );
    });

    it("stops offering new boards at the limit", async () => {
      const user = renderBoard();
      const total = 4;
      act(() => {
        for (let index = total; index < LIMITS.boards; index += 1) {
          dispatch({
            type: "createBoard",
            board: {
              id: `extra-${index}`,
              name: `Extra ${index}`,
              columns: [],
            },
          });
        }
      });

      await user.click(createBoardButton());

      expect(createBoardButton()).toHaveAttribute("aria-disabled", "true");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("editing", () => {
    it("opens from the board menu, filled in with the board", async () => {
      const user = renderBoard();

      const dialog = await openEditBoard(user);

      expect(nameField(dialog)).toHaveFocus();
      expect(nameField(dialog)).toHaveValue("Launch");
      expect(columnValues(dialog)).toEqual(["Todo", "Doing", "Done"]);
    });

    it("saves renames, keeps the tasks and returns to the menu button", async () => {
      const user = renderBoard();
      const dialog = await openEditBoard(user);

      await user.clear(nameField(dialog));
      await user.type(nameField(dialog), "Relaunch");
      await user.clear(columnField(dialog, 1));
      await user.type(columnField(dialog, 1), "Backlog");
      await user.click(submit(dialog, "Save Changes"));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(titleButton()).toHaveAccessibleName("Relaunch");
      expect(cardTitles("Backlog")).toEqual([
        "Plan the launch",
        "Book the venue",
        "Send invites",
      ]);
      expect(
        screen.getByRole("button", { name: "Board options" }),
      ).toHaveFocus();
    });

    it("drops a removed column and its tasks on save", async () => {
      const user = renderBoard();
      const dialog = await openEditBoard(user);

      await user.click(
        within(dialog).getByRole("button", { name: "Remove column 2" }),
      );
      await user.click(submit(dialog, "Save Changes"));

      expect(columnNames()).toEqual(["Todo", "Done"]);
      expect(
        screen.queryByRole("button", { name: "Busy task" }),
      ).not.toBeInTheDocument();
    });

    it("discards changes on Escape", async () => {
      const user = renderBoard();
      const dialog = await openEditBoard(user);
      await user.type(nameField(dialog), " 2");

      await user.keyboard("{Escape}");

      expect(titleButton()).toHaveAccessibleName("Launch");
      expect(
        screen.getByRole("button", { name: "Board options" }),
      ).toHaveFocus();
    });

    it("rejects a column renamed to match another", async () => {
      const user = renderBoard();
      const dialog = await openEditBoard(user);

      await user.clear(columnField(dialog, 3));
      await user.type(columnField(dialog, 3), "DOING");
      await user.click(submit(dialog, "Save Changes"));

      expect(columnField(dialog, 3)).toHaveFocus();
      expect(columnField(dialog, 3)).toHaveAccessibleDescription(DUPLICATE);
      expect(columnNames()).toEqual(["Todo", "Doing", "Done"]);
    });

    it("opens with a new column focused from + New Column", async () => {
      const user = renderBoard();
      const newColumn = screen.getByRole("button", { name: "New Column" });

      await user.click(newColumn);
      const dialog = screen.getByRole("dialog", { name: "Edit Board" });

      expect(columnValues(dialog)).toEqual(["Todo", "Doing", "Done", ""]);
      expect(columnField(dialog, 4)).toHaveFocus();

      await user.type(columnField(dialog, 4), "Shipped");
      await user.click(submit(dialog, "Save Changes"));
      expect(columnNames()).toEqual(["Todo", "Doing", "Done", "Shipped"]);
      expect(newColumn).toHaveFocus();
    });

    it("adds no row from + New Column once the board is full", async () => {
      const user = renderBoard();
      act(() =>
        dispatch({
          type: "updateBoard",
          board: {
            id: TEST_BOARD,
            name: "Launch",
            columns: Array.from(
              { length: LIMITS.columnsPerBoard },
              (_, index) => ({ id: `full-${index}`, name: `Stage ${index}` }),
            ),
          },
        }),
      );

      await user.click(screen.getByRole("button", { name: "New Column" }));
      const dialog = screen.getByRole("dialog", { name: "Edit Board" });

      expect(columnValues(dialog)).toHaveLength(LIMITS.columnsPerBoard);
      expect(nameField(dialog)).toHaveFocus();
    });

    it("turns an empty board into columns from Add New Column", async () => {
      const user = renderBoard();
      act(() => {
        dispatch({
          type: "createBoard",
          board: { id: "bare", name: "Bare", columns: [] },
        });
        selectBoard("bare");
      });

      await user.click(screen.getByRole("button", { name: "Add New Column" }));
      const dialog = screen.getByRole("dialog", { name: "Edit Board" });
      expect(columnField(dialog, 1)).toHaveFocus();

      await user.keyboard("{Escape}");
      expect(
        screen.getByRole("button", { name: "Add New Column" }),
      ).toHaveFocus();

      await user.click(screen.getByRole("button", { name: "Add New Column" }));
      await user.type(columnField(screen.getByRole("dialog"), 1), "Todo");
      await user.keyboard("{Enter}");

      expect(columnNames()).toEqual(["Todo"]);
      expect(screen.getByRole("button", { name: "New Column" })).toHaveFocus();
    });
  });
});
