import {
  BOARD_KEY,
  DARK_QUERY,
  SIDEBAR_KEY,
  SYNC_GATE_TIMEOUT_MS,
  THEME_KEY,
  THEME_META_ID,
  WORKSPACE_KEY,
} from "@/data";
import { installMatchMedia } from "@/test/media";
import { runInThisContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { PREPAINT_SCRIPT } from "./prepaint";

const root = document.documentElement;

function runPrepaint() {
  runInThisContext(PREPAINT_SCRIPT);
  return {
    theme: root.dataset.theme,
    sidebar: root.dataset.sidebar,
    sync: root.dataset.sync,
    themeColor: document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    ),
  };
}

describe("PREPAINT_SCRIPT", () => {
  afterEach(() => {
    localStorage.clear();
    delete root.dataset.theme;
    delete root.dataset.sidebar;
    delete root.dataset.sync;
    document.head.replaceChildren();
    vi.useRealTimers();
  });

  it.each([
    ["a saved dark theme over a light system", "dark", false, "dark"],
    ["a saved light theme over a dark system", "light", true, "light"],
    ["the system's dark theme when nothing is saved", null, true, "dark"],
    ["the system's light theme when nothing is saved", null, false, "light"],
    ["the system's theme over an unknown saved value", "sepia", true, "dark"],
  ])("applies %s", (_, saved, systemDark, theme) => {
    if (saved) localStorage.setItem(THEME_KEY, saved);
    installMatchMedia(systemDark ? [DARK_QUERY] : []);

    expect(runPrepaint().theme).toBe(theme);
  });

  it.each([
    ["light", "#ffffff"],
    ["dark", "#2b2c37"],
  ])("puts a %s theme-color ahead of the page's own", (theme, color) => {
    document.head.innerHTML =
      '<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">';
    localStorage.setItem(THEME_KEY, theme);

    const { themeColor } = runPrepaint();

    expect(themeColor).toHaveAttribute("id", THEME_META_ID);
    expect(themeColor).toHaveAttribute("content", color);
    expect(themeColor).not.toHaveAttribute("media");
  });

  it.each([
    ["hidden", "hidden"],
    [null, undefined],
    ["shown", undefined],
  ])("restores a saved sidebar of %s", (saved, sidebar) => {
    if (saved) localStorage.setItem(SIDEBAR_KEY, saved);

    expect(runPrepaint().sidebar).toBe(sidebar);
  });

  it.each([
    ["a saved workspace", WORKSPACE_KEY, "pending"],
    ["a chosen board", BOARD_KEY, "pending"],
    ["nothing saved", undefined, undefined],
  ])("hides the boards until they sync for %s", (_, key, sync) => {
    if (key) localStorage.setItem(key, "true");

    expect(runPrepaint().sync).toBe(sync);
  });

  it("shows the boards anyway if they never sync", () => {
    vi.useFakeTimers();
    localStorage.setItem(WORKSPACE_KEY, "true");
    runPrepaint();

    vi.advanceTimersByTime(SYNC_GATE_TIMEOUT_MS - 1);
    expect(root).toHaveAttribute("data-sync", "pending");
    vi.advanceTimersByTime(1);
    expect(root).not.toHaveAttribute("data-sync");
    expect(SYNC_GATE_TIMEOUT_MS).toBe(3000);
  });

  it("falls back to the system theme when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    installMatchMedia([DARK_QUERY]);

    expect(runPrepaint()).toMatchObject({
      theme: "dark",
      sidebar: undefined,
      sync: undefined,
    });
  });
});
