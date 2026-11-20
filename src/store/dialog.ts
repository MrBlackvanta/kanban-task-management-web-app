import { createStore, useStore } from "./create-store";

export type DialogRequest =
  | { kind: "addTask" }
  | { kind: "viewTask" | "editTask" | "deleteTask"; taskId: string };

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
