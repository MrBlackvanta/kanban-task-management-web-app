import { afterEach, describe, expect, it } from "vite-plus/test";

function mount() {
  document.body.innerHTML = `
    <dialog>
      <button id="invoker" popovertarget="menu">Options</button>
      <div id="menu" popover>
        <button id="item" popovertarget="menu" popovertargetaction="hide">Edit</button>
      </div>
      <p id="outside">Body</p>
    </dialog>`;
  const byId = (id: string) => document.getElementById(id)!;
  const dialog = document.querySelector("dialog")!;
  dialog.showModal();
  return {
    dialog,
    invoker: byId("invoker"),
    menu: byId("menu"),
    item: byId("item"),
    outside: byId("outside"),
  };
}

function pressEscape() {
  document.activeElement!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
}

describe("popover stub", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("stays hidden until its invoker toggles it", () => {
    const { invoker, menu } = mount();
    expect(menu).not.toBeVisible();

    invoker.click();
    expect(menu).toBeVisible();

    invoker.click();
    expect(menu).not.toBeVisible();
  });

  it("hides from an item and hands focus back to the invoker", () => {
    const { invoker, menu, item } = mount();
    invoker.click();
    item.focus();

    item.click();

    expect(menu).not.toBeVisible();
    expect(invoker).toHaveFocus();
  });

  it("closes on Escape before the dialog around it does", () => {
    const { dialog, invoker, menu } = mount();
    invoker.click();

    pressEscape();
    expect(menu).not.toBeVisible();
    expect(dialog.open).toBe(true);

    pressEscape();
    expect(dialog.open).toBe(false);
  });

  it("closes on a click outside it", () => {
    const { invoker, menu, outside } = mount();
    invoker.click();

    outside.click();

    expect(menu).not.toBeVisible();
  });
});
