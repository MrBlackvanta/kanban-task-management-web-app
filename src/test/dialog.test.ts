import { afterEach, describe, expect, it, vi } from "vite-plus/test";

function mount(
  content = "<p>Sure?</p><button>No</button><button>Yes</button>",
) {
  document.body.innerHTML = `
    <button id="opener">Open</button>
    <dialog>${content}</dialog>`;
  const opener = document.querySelector<HTMLButtonElement>("#opener")!;
  const dialog = document.querySelector("dialog")!;
  opener.focus();
  return { opener, dialog };
}

function pressEscape() {
  document.activeElement!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
}

describe("dialog stub", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens on its first control and hands focus back to the opener once closed", () => {
    const { opener, dialog } = mount();
    const closed = vi.fn();
    dialog.addEventListener("close", closed);

    dialog.showModal();
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toHaveTextContent("No");

    dialog.close();
    dialog.close();
    expect(dialog.open).toBe(false);
    expect(opener).toHaveFocus();
    expect(closed).toHaveBeenCalledOnce();
  });

  it("opens on a programmatically focusable heading placed first", () => {
    const { dialog } = mount(
      '<h2 tabindex="-1">Sure?</h2><button>Yes</button>',
    );

    dialog.showModal();

    expect(document.activeElement).toHaveTextContent("Sure?");
  });

  it("cancels the open dialog on Escape", () => {
    const { dialog } = mount();
    const cancelled = vi.fn();
    dialog.addEventListener("cancel", cancelled);
    dialog.showModal();

    pressEscape();

    expect(cancelled).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(false);
  });

  it("keeps the dialog open when cancel is prevented", () => {
    const { dialog } = mount();
    dialog.addEventListener("cancel", (event) => event.preventDefault());
    dialog.showModal();

    pressEscape();

    expect(dialog.open).toBe(true);
  });

  it("ignores Escape while no dialog is open", () => {
    const { dialog } = mount();
    const cancelled = vi.fn();
    dialog.addEventListener("cancel", cancelled);

    pressEscape();

    expect(cancelled).not.toHaveBeenCalled();
  });

  it("leaves focus alone when the opener is gone", () => {
    const { opener, dialog } = mount();
    const restore = vi.spyOn(opener, "focus");
    dialog.showModal();
    opener.remove();

    dialog.close();

    expect(restore).not.toHaveBeenCalled();
  });
});
