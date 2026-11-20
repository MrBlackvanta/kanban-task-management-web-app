import { seedBoards } from "@/data";
import { LIMITS, countTasks } from "@/lib";
import { dispatch, selectBoard } from "@/store";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import AddTaskButton from "./add-task-button";

const EMPTY_BOARD = "empty-board";

const addTask = () => screen.getByRole("button", { name: "Add New Task" });

describe("AddTaskButton", () => {
  afterEach(() => {
    dispatch({ type: "deleteBoard", boardId: EMPTY_BOARD });
    selectBoard(seedBoards[0].id);
  });

  it("is ready on a board with columns", () => {
    render(<AddTaskButton />);

    expect(addTask()).toBeEnabled();
  });

  it("is disabled while the board has no column to add to", () => {
    render(<AddTaskButton />);

    act(() => {
      dispatch({
        type: "createBoard",
        board: { id: EMPTY_BOARD, name: "Empty", columns: [] },
      });
      selectBoard(EMPTY_BOARD);
    });
    expect(addTask()).toBeDisabled();

    act(() => selectBoard(seedBoards[1].id));
    expect(addTask()).toBeEnabled();
  });

  it("is disabled once the boards hold the most tasks allowed", () => {
    render(<AddTaskButton />);
    const room = LIMITS.tasks - countTasks(seedBoards);
    act(() => {
      dispatch({
        type: "createBoard",
        board: {
          id: EMPTY_BOARD,
          name: "Full",
          columns: [{ id: "c", name: "A" }],
        },
      });
      for (let index = 0; index < room; index += 1) {
        dispatch({
          type: "createTask",
          columnId: "c",
          task: { id: `t${index}`, title: "T", description: "", subtasks: [] },
        });
      }
    });
    expect(addTask()).toBeDisabled();

    act(() => dispatch({ type: "deleteTask", taskId: "t0" }));
    expect(addTask()).toBeEnabled();
  });
});
