import AddTaskButton from "@/components/layout/add-task-button";
import { seedBoards } from "@/data";
import { closeDialog, dispatch, selectBoard } from "@/store";
import { ActiveBoard, BoardDialogs } from "@/views/home";
import { act, render, screen, within } from "@testing-library/react";
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

export function removeTestBoard() {
  act(() => {
    closeDialog();
    dispatch({ type: "deleteBoard", boardId: TEST_BOARD });
    selectBoard(seedBoards[0].id);
  });
}

export function renderBoard() {
  const user = userEvent.setup();
  render(
    <>
      <AddTaskButton />
      <ActiveBoard />
      <BoardDialogs />
    </>,
  );
  return user;
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
