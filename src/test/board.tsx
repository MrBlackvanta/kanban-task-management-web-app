import { AppShell } from "@/components/layout";
import { seedBoards } from "@/data";
import { closeDialog, dispatch, selectBoard, useBoards } from "@/store";
import { ActiveBoard, BoardDialogs } from "@/views/home";
import {
  act,
  render,
  renderHook,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export const TEST_BOARD = "test-board";

export function createTestBoard() {
  dispatch({
    type: "createBoard",
    board: {
      id: TEST_BOARD,
      name: "Launch",
      columns: [
        { id: "todo", name: "Todo" },
        { id: "doing", name: "Doing" },
        { id: "done", name: "Done" },
      ],
    },
  });
  addTask("todo", "plan", "Plan the launch", "Pick a date.", [
    "Draft",
    "Review",
  ]);
  addTask("todo", "venue", "Book the venue");
  addTask("todo", "invites", "Send invites");
  addTask("doing", "busy", "Busy task");
  dispatch({
    type: "setSubtaskCompleted",
    subtaskId: "plan-0",
    isCompleted: true,
  });
  selectBoard(TEST_BOARD);
}

export function resetBoards() {
  const seedIds = new Set(seedBoards.map((board) => board.id));
  const { result, unmount } = renderHook(useBoards);
  act(() => {
    closeDialog();
    for (const board of result.current) {
      if (!seedIds.has(board.id)) {
        dispatch({ type: "deleteBoard", boardId: board.id });
      }
    }
    selectBoard(seedBoards[0].id);
  });
  unmount();
}

export function renderBoard() {
  const user = userEvent.setup();
  render(
    <AppShell>
      <ActiveBoard />
      <BoardDialogs />
    </AppShell>,
  );
  return user;
}

export function sidebar() {
  return screen.getByRole("complementary", { name: "Sidebar" });
}

export function cardTitles(columnName: string) {
  const column = screen
    .getAllByRole("heading", { level: 2 })
    .find((heading) => heading.textContent?.startsWith(`${columnName} (`))!
    .closest("section")!;
  return within(column)
    .queryAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

export function cardButton(title: string) {
  return screen.getByRole("button", { name: title });
}

function addTask(
  columnId: string,
  id: string,
  title: string,
  description = "",
  subtasks: string[] = [],
) {
  dispatch({
    type: "createTask",
    columnId,
    task: {
      id,
      title,
      description,
      subtasks: subtasks.map((subtask, index) => ({
        id: `${id}-${index}`,
        title: subtask,
      })),
    },
  });
}
