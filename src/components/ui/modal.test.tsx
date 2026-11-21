import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import Modal from "./modal";

function renderModal() {
  const onClose = vi.fn();
  render(
    <Modal titleId="title" onClose={onClose} className="">
      <h2 id="title">Edit Task</h2>
      <button type="button">First</button>
      <button type="button" data-autofocus>
        Preferred
      </button>
    </Modal>,
  );
  const dialog = screen.getByRole<HTMLDialogElement>("dialog", {
    name: "Edit Task",
  });
  return { dialog, onClose };
}

describe("Modal", () => {
  it("opens as a modal, focused where the content asks", () => {
    const { dialog } = renderModal();

    expect(dialog.open).toBe(true);
    expect(screen.getByRole("button", { name: "Preferred" })).toHaveFocus();
  });

  it("asks to close on Escape and stays open until it is removed", async () => {
    const { dialog, onClose } = renderModal();

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
  });

  it("asks to close on a click outside the panel", async () => {
    const { dialog, onClose } = renderModal();

    await userEvent.click(dialog.lastElementChild!);

    expect(onClose).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
  });

  it("reports a close the browser made by itself", () => {
    const { dialog, onClose } = renderModal();

    dialog.close();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
