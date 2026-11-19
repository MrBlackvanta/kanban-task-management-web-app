import { seedBoards } from "@/data";
import { selectBoard } from "@/store";
import { mediaListenerCount, setMediaMatch } from "@/test/media";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";
import BoardTitle from "./board-title";

const TABLET = "(min-width: 48rem)";

function renderTitle() {
  const view = render(<BoardTitle />);
  const heading = screen.getByRole("heading", { level: 1 });
  const trigger = within(heading).getByRole("button");
  const menu = view.container.querySelector("dialog")!;
  return { ...view, heading, trigger, menu };
}

async function openMenu() {
  const parts = renderTitle();
  await userEvent.click(parts.trigger);
  return parts;
}

describe("BoardTitle", () => {
  afterEach(() => selectBoard(seedBoards[0].id));

  it("names the heading and its menu button after the active board", () => {
    const { heading, trigger } = renderTitle();

    expect(heading).toHaveTextContent("Platform Launch");
    expect(trigger).toHaveAccessibleName("Platform Launch");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the board menu on the first board", async () => {
    const { trigger, menu } = await openMenu();

    expect(menu.open).toBe(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", menu.id);
    expect(screen.getByRole("dialog", { name: "Boards" })).toBe(menu);
    expect(
      within(menu).getByRole("button", { name: "Platform Launch" }),
    ).toHaveFocus();
  });

  it("closes on Escape and hands focus back to the title", async () => {
    const { trigger, menu } = await openMenu();

    await userEvent.keyboard("{Escape}");

    expect(menu.open).toBe(false);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("hands focus back even when the click never focused the title", async () => {
    const { trigger, menu } = renderTitle();
    fireEvent.click(trigger);
    expect(document.activeElement).not.toBe(trigger);

    await userEvent.keyboard("{Escape}");

    expect(menu.open).toBe(false);
    expect(trigger).toHaveFocus();
  });

  it("closes once a board is chosen and shows that board", async () => {
    const { trigger, heading, menu } = await openMenu();

    await userEvent.click(
      within(menu).getByRole("button", { name: "Roadmap" }),
    );

    expect(menu.open).toBe(false);
    expect(heading).toHaveTextContent("Roadmap");
    expect(trigger).toHaveFocus();
  });

  it("closes on a tap outside the panel", async () => {
    const { menu } = await openMenu();
    const backdrop = menu.querySelector('button[aria-hidden="true"]')!;

    await userEvent.click(backdrop);

    expect(menu.open).toBe(false);
  });

  it("closes when the viewport widens to the sidebar layout", async () => {
    const { trigger, menu } = await openMenu();

    act(() => setMediaMatch(TABLET, true));

    expect(menu.open).toBe(false);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("carries the theme switch and the signature", async () => {
    const { menu } = await openMenu();

    expect(
      within(menu).getByRole("checkbox", { name: "Dark theme" }),
    ).toBeInTheDocument();
    expect(menu).toHaveTextContent("Coded by Abdelrhman Abdelaal.");
  });

  it("stops watching the viewport once unmounted", () => {
    const { unmount } = renderTitle();

    unmount();

    expect(mediaListenerCount(TABLET)).toBe(0);
  });
});
