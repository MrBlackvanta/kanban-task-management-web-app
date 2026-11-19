import { useSyncExternalStore } from "react";

export type Store<T> = {
  getState: () => T;
  getInitialState: () => T;
  setState: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    getInitialState: () => initialState,
    setState(next) {
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getInitialState,
  );
}
