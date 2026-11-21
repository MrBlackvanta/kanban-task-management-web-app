import { fakeViewTransitions } from "@/test/motion";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  changeDialog,
  closeDialog,
  openDialog,
  useDialog,
  type DialogRequest,
} from "./dialog";

const VIEW: DialogRequest = { kind: "viewTask", taskId: "plan" };
const EDIT: DialogRequest = { kind: "editTask", taskId: "plan" };

function renderDialog() {
  return renderHook(() => useDialog()).result;
}

describe("dialog store", () => {
  afterEach(() => {
    delete document.documentElement.dataset.motion;
    Reflect.deleteProperty(document, "startViewTransition");
    act(closeDialog);
  });

  it("changes at once where views cannot transition", () => {
    const dialog = renderDialog();

    act(() => openDialog(VIEW));

    expect(dialog.current).toEqual(VIEW);
  });

  it("makes the change inside a view transition named dialog", () => {
    const views = fakeViewTransitions();
    const dialog = renderDialog();

    act(() => openDialog(VIEW));
    expect(dialog.current).toBeUndefined();
    expect(document.documentElement.dataset.motion).toBe("dialog");

    act(views.runUpdates);
    expect(dialog.current).toEqual(VIEW);
  });

  it("folds changes made during a change into the same transition", () => {
    const views = fakeViewTransitions();
    const dialog = renderDialog();

    act(() =>
      changeDialog(() => {
        openDialog(VIEW);
        openDialog(EDIT);
      }),
    );
    act(views.runUpdates);

    expect(views.start).toHaveBeenCalledOnce();
    expect(dialog.current).toEqual(EDIT);
  });

  it("drops a second change while the first waits for its snapshot", () => {
    const views = fakeViewTransitions();
    const dialog = renderDialog();

    act(() => {
      openDialog(VIEW);
      openDialog(EDIT);
    });
    act(views.runUpdates);

    expect(views.start).toHaveBeenCalledOnce();
    expect(dialog.current).toEqual(VIEW);
  });
});
