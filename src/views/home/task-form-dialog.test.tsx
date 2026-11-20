import { LIMITS } from "@/lib";
import { dispatch, openDialog } from "@/store";
import {
  cardButton,
  cardTitles,
  createTestBoard,
  renderBoard,
  resetBoards,
  TEST_BOARD,
} from "@/test/board";
import { act, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

const EMPTY = "Can't be empty";

async function openAddTask(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Add New Task" }));
  return screen.getByRole("dialog", { name: "Add New Task" });
}

async function openEditTask(user: UserEvent, title: string) {
  await user.click(cardButton(title));
  await user.click(screen.getByRole("button", { name: "Task options" }));
  await user.click(screen.getByRole("button", { name: "Edit Task" }));
  return screen.getByRole("dialog", { name: "Edit Task" });
}

function field(dialog: HTMLElement, name: string) {
  return within(dialog).getByRole("textbox", { name });
}

function subtaskValues(dialog: HTMLElement) {
  return within(dialog)
    .queryAllByRole("textbox", { name: /^Subtask/ })
    .map((input) => (input as HTMLInputElement).value);
}

describe("TaskFormDialog", () => {
  beforeEach(createTestBoard);
  afterEach(resetBoards);

  describe("adding", () => {
    it("opens empty on the title, with two subtask rows and the first column", async () => {
      const user = renderBoard();

      const dialog = await openAddTask(user);

      expect(field(dialog, "Title")).toHaveFocus();
      expect(field(dialog, "Title")).toHaveValue("");
      expect(field(dialog, "Description")).toHaveValue("");
      expect(subtaskValues(dialog)).toEqual(["", ""]);
      expect(
        within(dialog).getByRole("combobox", { name: "Status" }),
      ).toHaveDisplayValue("Todo");
    });

    it("creates the task trimmed at the bottom of the chosen column", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);

      await user.type(field(dialog, "Title"), "  Ship it  ");
      await user.type(field(dialog, "Description"), " Today. ");
      await user.type(field(dialog, "Subtask 1"), " Build ");
      await user.type(field(dialog, "Subtask 2"), "Deploy");
      await user.selectOptions(
        within(dialog).getByRole("combobox", { name: "Status" }),
        "Doing",
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Create Task" }),
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(cardTitles("Doing")).toEqual(["Busy task", "Ship it"]);
      await user.click(cardButton("Ship it"));
      const view = screen.getByRole("dialog", { name: "Ship it" });
      expect(
        within(view).getByText("Today.", { normalizer: (text) => text }),
      ).toBeInTheDocument();
      expect(
        within(view)
          .getAllByRole("checkbox")
          .map((box) => box.closest("label")!.textContent),
      ).toEqual(["Build", "Deploy"]);
    });

    it("hands focus back to Add New Task once created", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      await user.type(field(dialog, "Title"), "Ship it");
      await user.click(
        within(dialog).getByRole("button", { name: "Remove subtask 1" }),
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Remove subtask 1" }),
      );

      await user.click(
        within(dialog).getByRole("button", { name: "Create Task" }),
      );

      expect(cardTitles("Todo")).toContain("Ship it");
      expect(
        screen.getByRole("button", { name: "Add New Task" }),
      ).toHaveFocus();
    });

    it("closes on Escape without creating anything", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      await user.type(field(dialog, "Title"), "Ship it");

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(cardTitles("Todo")).not.toContain("Ship it");
      expect(
        screen.getByRole("button", { name: "Add New Task" }),
      ).toHaveFocus();
    });

    it("flags every empty field on submit and focuses the first", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);

      await user.click(
        within(dialog).getByRole("button", { name: "Create Task" }),
      );

      expect(dialog).toBeInTheDocument();
      for (const name of ["Title", "Subtask 1", "Subtask 2"]) {
        expect(field(dialog, name)).toBeInvalid();
        expect(field(dialog, name)).toHaveAccessibleDescription(EMPTY);
      }
      expect(field(dialog, "Description")).toBeValid();
      expect(field(dialog, "Title")).toHaveFocus();
      expect(cardTitles("Todo")).toHaveLength(3);
    });

    it("shows example text in the title and the first two subtask rows", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);

      await user.click(
        within(dialog).getByRole("button", { name: "Add New Subtask" }),
      );

      expect(field(dialog, "Title")).toHaveAttribute(
        "placeholder",
        "e.g. Take coffee break",
      );
      expect(field(dialog, "Subtask 1")).toHaveAttribute(
        "placeholder",
        "e.g. Make coffee",
      );
      expect(field(dialog, "Subtask 2")).toHaveAttribute(
        "placeholder",
        "e.g. Drink coffee & smile",
      );
      expect(field(dialog, "Subtask 3")).not.toHaveAttribute("placeholder");
    });

    it("submits in place, without a native form submission", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      let submission: Event | undefined;
      const record = (event: Event) => (submission = event);
      document.addEventListener("submit", record);

      await user.click(
        within(dialog).getByRole("button", { name: "Create Task" }),
      );
      document.removeEventListener("submit", record);

      expect(submission?.defaultPrevented).toBe(true);
    });

    it("marks a field invalid before focus lands on it, so its error is read out", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      await user.type(field(dialog, "Title"), "Ship it");
      await user.type(field(dialog, "Subtask 1"), "Build");
      const subtask = field(dialog, "Subtask 2");
      let stateOnFocus: (string | null)[] = [];
      subtask.addEventListener("focus", () => {
        stateOnFocus = [
          subtask.getAttribute("aria-invalid"),
          subtask.getAttribute("aria-describedby"),
        ];
      });

      await user.keyboard("{Enter}");

      expect(subtask).toHaveFocus();
      expect(stateOnFocus[0]).toBe("true");
      expect(stateOnFocus[1]).toBeTruthy();
    });

    it("opens nothing on a board without columns", () => {
      renderBoard();

      act(() => {
        dispatch({
          type: "updateBoard",
          board: { id: TEST_BOARD, name: "Launch", columns: [] },
        });
        openDialog({ kind: "addTask" });
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("holds back errors until the first submit", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);

      await user.type(field(dialog, "Title"), "S");
      await user.clear(field(dialog, "Title"));

      expect(field(dialog, "Title")).toBeValid();
      expect(within(dialog).queryByText(EMPTY)).not.toBeInTheDocument();
    });

    it("treats a title of only spaces as empty", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      await user.type(field(dialog, "Title"), "   ");

      await user.keyboard("{Enter}");

      expect(field(dialog, "Title")).toHaveAccessibleDescription(EMPTY);
    });

    it("focuses the first empty subtask once the title is filled", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      await user.type(field(dialog, "Title"), "Ship it");
      await user.type(field(dialog, "Subtask 1"), "Build");

      await user.keyboard("{Enter}");

      expect(field(dialog, "Title")).toBeValid();
      expect(field(dialog, "Subtask 1")).toBeValid();
      expect(field(dialog, "Subtask 2")).toBeInvalid();
      expect(field(dialog, "Subtask 2")).toHaveFocus();
    });

    it("clears an error as soon as its field is filled", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      await user.keyboard("{Enter}");

      await user.type(field(dialog, "Title"), "S");

      expect(field(dialog, "Title")).toBeValid();
      expect(field(dialog, "Title")).not.toHaveAccessibleDescription();
      expect(within(dialog).getAllByText(EMPTY)).toHaveLength(2);
    });

    it("adds a subtask row and focuses it", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);

      await user.click(
        within(dialog).getByRole("button", { name: "Add New Subtask" }),
      );

      expect(subtaskValues(dialog)).toEqual(["", "", ""]);
      expect(field(dialog, "Subtask 3")).toHaveFocus();
    });

    it("removes a row and focuses the next remove button, then the previous, then Add New Subtask", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      await user.click(
        within(dialog).getByRole("button", { name: "Add New Subtask" }),
      );
      await user.type(field(dialog, "Subtask 1"), "One");
      await user.type(field(dialog, "Subtask 2"), "Two");
      await user.type(field(dialog, "Subtask 3"), "Three");
      const remove = (n: number) =>
        within(dialog).getByRole("button", { name: `Remove subtask ${n}` });

      await user.click(remove(2));
      expect(subtaskValues(dialog)).toEqual(["One", "Three"]);
      expect(remove(2)).toHaveFocus();

      await user.click(remove(2));
      expect(subtaskValues(dialog)).toEqual(["One"]);
      expect(remove(1)).toHaveFocus();

      await user.click(remove(1));
      expect(subtaskValues(dialog)).toEqual([]);
      expect(
        within(dialog).getByRole("button", { name: "Add New Subtask" }),
      ).toHaveFocus();
    });

    it("stops adding subtasks at the limit but keeps the button focusable", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);
      const addSubtask = within(dialog).getByRole("button", {
        name: "Add New Subtask",
      });

      for (let rows = 3; rows < LIMITS.subtasksPerTask; rows += 1) {
        await user.click(addSubtask);
      }
      expect(addSubtask).not.toHaveAttribute("aria-disabled");
      await user.click(addSubtask);

      expect(subtaskValues(dialog)).toHaveLength(LIMITS.subtasksPerTask);
      expect(addSubtask).toHaveAttribute("aria-disabled", "true");
      expect(addSubtask).toBeEnabled();

      addSubtask.focus();
      await user.click(addSubtask);
      expect(subtaskValues(dialog)).toHaveLength(LIMITS.subtasksPerTask);
      expect(addSubtask).toHaveFocus();
    });

    it("caps the title and description at their limits", async () => {
      const user = renderBoard();
      const dialog = await openAddTask(user);

      expect(field(dialog, "Title")).toHaveAttribute(
        "maxlength",
        String(LIMITS.titleLength),
      );
      expect(field(dialog, "Subtask 1")).toHaveAttribute(
        "maxlength",
        String(LIMITS.titleLength),
      );
      expect(field(dialog, "Description")).toHaveAttribute(
        "maxlength",
        String(LIMITS.descriptionLength),
      );
    });
  });

  describe("editing", () => {
    it("opens from the task's menu, filled with the task", async () => {
      const user = renderBoard();

      const dialog = await openEditTask(user, "Plan the launch");

      expect(field(dialog, "Title")).toHaveValue("Plan the launch");
      expect(field(dialog, "Title")).toHaveFocus();
      expect(field(dialog, "Description")).toHaveValue("Pick a date.");
      expect(subtaskValues(dialog)).toEqual(["Draft", "Review"]);
      expect(
        within(dialog).getByRole("combobox", { name: "Status" }),
      ).toHaveDisplayValue("Todo");
      expect(
        within(dialog).getByRole("button", { name: "Save Changes" }),
      ).toBeInTheDocument();
    });

    it("saves and returns to the task, keeping ticks on the subtasks it kept", async () => {
      const user = renderBoard();
      const dialog = await openEditTask(user, "Plan the launch");
      await user.clear(field(dialog, "Title"));
      await user.type(field(dialog, "Title"), "Plan the party");
      await user.clear(field(dialog, "Subtask 1"));
      await user.type(field(dialog, "Subtask 1"), "Draft the plan");
      await user.click(
        within(dialog).getByRole("button", { name: "Remove subtask 2" }),
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Add New Subtask" }),
      );
      await user.type(field(dialog, "Subtask 2"), "Book a band");

      await user.click(
        within(dialog).getByRole("button", { name: "Save Changes" }),
      );

      const view = screen.getByRole("dialog", { name: "Plan the party" });
      expect(
        within(view)
          .getAllByRole("checkbox")
          .map((box) => [
            box.closest("label")!.textContent,
            box.matches(":checked"),
          ]),
      ).toEqual([
        ["Draft the plan", true],
        ["Book a band", false],
      ]);
      expect(
        within(view).getByRole("button", { name: "Task options" }),
      ).toHaveFocus();
      expect(cardTitles("Todo")[0]).toBe("Plan the party");
    });

    it("moves the task to the bottom of a new status column", async () => {
      const user = renderBoard();
      const dialog = await openEditTask(user, "Plan the launch");

      await user.selectOptions(
        within(dialog).getByRole("combobox", { name: "Status" }),
        "Doing",
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Save Changes" }),
      );

      expect(cardTitles("Todo")).toEqual(["Book the venue", "Send invites"]);
      expect(cardTitles("Doing")).toEqual(["Busy task", "Plan the launch"]);
    });

    it("rejects an emptied title and keeps the task as it was", async () => {
      const user = renderBoard();
      const dialog = await openEditTask(user, "Plan the launch");
      await user.clear(field(dialog, "Title"));

      await user.keyboard("{Enter}");

      expect(field(dialog, "Title")).toHaveAccessibleDescription(EMPTY);
      expect(cardTitles("Todo")[0]).toBe("Plan the launch");
    });

    it("discards changes on Escape and returns to the task", async () => {
      const user = renderBoard();
      const dialog = await openEditTask(user, "Plan the launch");
      await user.type(field(dialog, "Title"), " and party");

      await user.keyboard("{Escape}");

      expect(
        screen.getByRole("dialog", { name: "Plan the launch" }),
      ).toBeInTheDocument();
      expect(cardTitles("Todo")[0]).toBe("Plan the launch");
    });
  });
});
