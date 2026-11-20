import { createStore, useStore } from "./create-store";

export const NOTICE_DURATION_MS = 6000;

export type Notice = { id: number; message: string; host?: Element };

const store = createStore<Notice | undefined>(undefined);
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let lastId = 0;

export function showNotice(message: string) {
  clearTimeout(hideTimer);
  lastId += 1;
  const host = document.querySelector("dialog[open]") ?? undefined;
  store.setState({ id: lastId, message, host });
  hideTimer = setTimeout(() => store.setState(undefined), NOTICE_DURATION_MS);
}

export function useNotice() {
  return useStore(store);
}
