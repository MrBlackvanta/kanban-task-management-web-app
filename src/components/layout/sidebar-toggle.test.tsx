import { SIDEBAR_KEY } from "@/data";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { HideSidebarButton, ShowSidebarButton } from "./sidebar-toggle";

const root = document.documentElement;

function renderToggles() {
  render(
    <>
      <HideSidebarButton />
      <ShowSidebarButton />
    </>,
  );
  return {
    hide: screen.getByRole("button", { name: "Hide Sidebar" }),
    show: screen.getByRole("button", { name: "Show sidebar" }),
  };
}

describe("sidebar toggles", () => {
  afterEach(() => {
    localStorage.clear();
    delete root.dataset.sidebar;
  });

  it("hides the sidebar, remembers it and hands focus to Show sidebar", async () => {
    const { hide, show } = renderToggles();

    await userEvent.click(hide);

    expect(root.dataset.sidebar).toBe("hidden");
    expect(localStorage.getItem(SIDEBAR_KEY)).toBe("hidden");
    expect(show).toHaveFocus();
  });

  it("shows it again, forgets the choice and hands focus back", async () => {
    root.dataset.sidebar = "hidden";
    localStorage.setItem(SIDEBAR_KEY, "hidden");
    const { hide, show } = renderToggles();

    await userEvent.click(show);

    expect(root.dataset.sidebar).toBeUndefined();
    expect(localStorage.getItem(SIDEBAR_KEY)).toBeNull();
    expect(hide).toHaveFocus();
  });

  it("still toggles when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "QuotaExceededError");
    });
    const { hide } = renderToggles();

    await userEvent.click(hide);

    expect(root.dataset.sidebar).toBe("hidden");
  });
});
