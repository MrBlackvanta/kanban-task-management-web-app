import { canTransitionView, transitionView } from "@/lib";
import { flushSync } from "react-dom";
import { createStore, useStore } from "./create-store";

export type DialogRequest =
  | { kind: "addTask" | "deleteBoard" }
  | { kind: "viewTask" | "editTask" | "deleteTask"; taskId: string }
  | { kind: "addBoard"; returnFocusId?: string }
  | { kind: "editBoard"; returnFocusId?: string; addColumn: boolean };

const store = createStore<DialogRequest | undefined>(undefined);
let changing = false;
let pending = false;

export function changeDialog(update: () => void) {
  if (changing || !canTransitionView()) {
    update();
    return;
  }
  if (pending) return;

  pending = true;
  transitionView("dialog", () => {
    pending = false;
    changing = true;
    try {
      flushSync(update);
    } finally {
      changing = false;
    }
  });
}

export function openDialog(request: DialogRequest) {
  changeDialog(() => store.setState(request));
}

export function closeDialog() {
  changeDialog(() => store.setState(undefined));
}

export function useDialog() {
  return useStore(store);
}
