import { createStore, useStore } from "./create-store";

const store = createStore("");

export function announce(message: string) {
  store.setState(message);
}

export function useAnnouncement() {
  return useStore(store);
}
