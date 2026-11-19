import { seedBoards } from "@/data";
import { selectBoard } from "@/store";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import BoardNav from "./board-nav";

const boardNames = seedBoards.map((board) => board.name);

function currentBoards(nav = screen.getByRole("navigation")) {
  return within(nav)
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-current") === "true")
    .map((button) => button.textContent);
}

describe("BoardNav", () => {
  afterEach(() => selectBoard(seedBoards[0].id));

  it("lists every board under a counted heading", () => {
    render(<BoardNav />);
    const nav = screen.getByRole("navigation", { name: "Boards" });

    expect(
      within(nav).getByRole("heading", { level: 2, name: "All boards (3)" }),
    ).toBeInTheDocument();
    expect(
      within(nav)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(boardNames);
    expect(
      within(nav).getByRole("button", { name: "+ Create New Board" }),
    ).toBeInTheDocument();
  });

  it("marks only the first board as current to begin with", () => {
    render(<BoardNav />);

    expect(currentBoards()).toEqual([boardNames[0]]);
  });

  it("makes the chosen board current and reports the choice", async () => {
    const onSelect = vi.fn();
    render(<BoardNav onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Roadmap" }));

    expect(currentBoards()).toEqual(["Roadmap"]);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("keeps a second copy of the list in step", async () => {
    render(
      <>
        <BoardNav />
        <BoardNav />
      </>,
    );
    const [first, second] = screen.getAllByRole("navigation");

    await userEvent.click(
      within(first).getByRole("button", { name: "Marketing Plan" }),
    );

    expect(currentBoards(second)).toEqual(["Marketing Plan"]);
  });
});
