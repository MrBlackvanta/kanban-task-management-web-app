import { describe, expect, it, vi } from "vite-plus/test";
import { createStore } from "./create-store";

describe("createStore", () => {
  it("replaces the state and tells every subscriber", () => {
    const store = createStore(1);
    const first = vi.fn();
    const second = vi.fn();
    store.subscribe(first);
    store.subscribe(second);

    store.setState(2);

    expect(store.getState()).toBe(2);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("stops telling a subscriber once it unsubscribes", () => {
    const store = createStore("a");
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState("b");

    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps the initial state for the server render", () => {
    const store = createStore({ count: 0 });
    const initial = store.getState();

    store.setState({ count: 1 });

    expect(store.getInitialState()).toBe(initial);
  });
});
