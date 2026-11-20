import { createStore, useStore } from "./create-store";

export type DialogRequest =
  | { kind: "addTask" | "deleteBoard" }
  | { kind: "viewTask" | "editTask" | "deleteTask"; taskId: string }
  | { kind: "addBoard"; returnFocusId?: string }
  | { kind: "editBoard"; returnFocusId?: string; addColumn: boolean };

const store = createStore<DialogRequest | undefined>(undefined);

export function openDialog(request: DialogRequest) {
  store.setState(request);
}

export function closeDialog() {
  store.setState(undefined);
}

export function useDialog() {
  return useStore(store);
}
