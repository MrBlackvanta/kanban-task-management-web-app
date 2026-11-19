import AddTaskButton from "@/components/layout/add-task-button";
import { seedBoards } from "@/data";
import { dispatch } from "@/store";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import ActiveBoard from "./active-board";

describe("with every board deleted", () => {
  beforeAll(() => {
    for (const board of seedBoards) {
      dispatch({ type: "deleteBoard", boardId: board.id });
    }
  });

  it("leaves the board area blank", () => {
    const { container } = render(<ActiveBoard />);

    expect(container).toBeEmptyDOMElement();
  });

  it("disables adding a task", () => {
    render(<AddTaskButton />);

    expect(screen.getByRole("button", { name: "Add New Task" })).toBeDisabled();
  });
});
