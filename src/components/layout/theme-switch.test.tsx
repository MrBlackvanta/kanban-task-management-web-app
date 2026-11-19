import { DARK_QUERY, THEME_KEY, THEME_META_ID } from "@/data";
import { PREPAINT_SCRIPT } from "@/lib";
import {
  installMatchMedia,
  mediaListenerCount,
  setMediaMatch,
} from "@/test/media";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { runInThisContext } from "node:vm";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import ThemeSwitch from "./theme-switch";

const root = document.documentElement;

function loadPage({ systemDark = false, saved = "" } = {}) {
  installMatchMedia(systemDark ? [DARK_QUERY] : []);
  if (saved) localStorage.setItem(THEME_KEY, saved);
  runInThisContext(PREPAINT_SCRIPT);
}

const themeColor = () =>
  document.getElementById(THEME_META_ID)?.getAttribute("content");
const darkSwitch = () => screen.getByRole("checkbox", { name: "Dark theme" });

describe("ThemeSwitch", () => {
  afterEach(() => {
    localStorage.clear();
    delete root.dataset.theme;
    document.head.replaceChildren();
  });

  it("switches to dark and back, saving each choice", async () => {
    loadPage();
    render(<ThemeSwitch className="" />);
    expect(darkSwitch()).not.toBeChecked();

    await userEvent.click(darkSwitch());
    expect(darkSwitch()).toBeChecked();
    expect(root.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(themeColor()).toBe("#2b2c37");

    await userEvent.click(darkSwitch());
    expect(root.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    expect(themeColor()).toBe("#ffffff");
  });

  it("starts on the theme the page was painted with", () => {
    loadPage({ systemDark: true });
    render(<ThemeSwitch className="" />);

    expect(darkSwitch()).toBeChecked();
  });

  it("follows the system until the visitor chooses", async () => {
    loadPage();
    render(<ThemeSwitch className="" />);

    act(() => setMediaMatch(DARK_QUERY, true));
    expect(darkSwitch()).toBeChecked();
    expect(themeColor()).toBe("#2b2c37");

    await userEvent.click(darkSwitch());
    act(() => setMediaMatch(DARK_QUERY, true));
    expect(darkSwitch()).not.toBeChecked();
    expect(root.dataset.theme).toBe("light");
  });

  it("keeps every switch on the page in step", async () => {
    loadPage();
    render(
      <>
        <ThemeSwitch className="" />
        <ThemeSwitch className="" />
      </>,
    );
    const [first, second] = screen.getAllByRole("checkbox");

    await userEvent.click(first);

    expect(second).toBeChecked();
  });

  it("stops following the system once unmounted", () => {
    loadPage();
    const { unmount } = render(<ThemeSwitch className="" />);

    unmount();

    expect(mediaListenerCount(DARK_QUERY)).toBe(0);
  });

  it("still switches when storage is blocked", async () => {
    loadPage();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "QuotaExceededError");
    });
    render(<ThemeSwitch className="" />);

    await userEvent.click(darkSwitch());

    expect(root.dataset.theme).toBe("dark");
  });

  it("hydrates a page painted dark without a mismatch", async () => {
    const html = renderToString(<ThemeSwitch className="" />);
    expect(html).not.toContain("checked");
    loadPage({ saved: "dark" });
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, <ThemeSwitch className="" />, {
        onRecoverableError,
      });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(darkSwitch()).toBeChecked();
    container.remove();
  });
});
