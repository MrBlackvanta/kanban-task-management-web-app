import { NOTICE_DURATION_MS, showNotice } from "@/store";
import { act, render, screen, within } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import SaveNotice from "./save-notice";

describe("SaveNotice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("announces a notice for six seconds", () => {
    render(<SaveNotice />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => showNotice("Couldn't save."));
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save.");

    act(() => {
      vi.advanceTimersByTime(NOTICE_DURATION_MS - 1);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(NOTICE_DURATION_MS).toBe(6000);
  });

  it("replaces an older notice and gives the new one its full time", () => {
    render(<SaveNotice />);
    act(() => showNotice("First"));
    const first = screen.getByRole("alert");
    act(() => {
      vi.advanceTimersByTime(NOTICE_DURATION_MS - 1000);
    });
    act(() => showNotice("Second"));

    const second = screen.getByRole("alert");
    expect(second).toHaveTextContent("Second");
    expect(second).not.toBe(first);
    act(() => {
      vi.advanceTimersByTime(NOTICE_DURATION_MS - 1);
    });
    expect(screen.getByRole("alert")).toBe(second);
  });

  it("shows the notice inside an open dialog, above its backdrop", () => {
    render(<SaveNotice />);
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.append(dialog);
    act(() => showNotice("Couldn't save."));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Couldn't save.",
    );
  });
});
