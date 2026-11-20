import { BOARD_KEY, WORKSPACE_KEY, seedBoards } from "@/data";
import { applyCommand, type Board, type Command } from "@/lib";
import { cardButton, renderBoard, resetBoards } from "@/test/board";
import {
  act,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  SAVE_ERRORS,
  SAVE_TIMEOUT_MS,
  dispatch,
  selectBoard,
  startSync,
  useActiveBoard,
  useBoards,
} from "./boards";

const root = document.documentElement;
const fetchMock = () => vi.mocked(globalThis.fetch);

const TOGGLE: Command = {
  type: "setSubtaskCompleted",
  subtaskId: "seed-t1-s2",
  isCompleted: true,
};

const renamed: Board[] = [{ ...seedBoards[0], name: "Saved launch" }];

function answer(...responses: (Response | Error)[]) {
  for (const response of responses) {
    fetchMock().mockImplementationOnce(async () => {
      if (response instanceof Error) throw response;
      return response;
    });
  }
}

function hold() {
  let release = (_response: Response) => {};
  const response = new Promise<Response>((resolve) => {
    release = resolve;
  });
  fetchMock().mockImplementationOnce(() => response);
  return (value = new Response(null, { status: 204 })) =>
    act(async () => release(value));
}

function boardsResponse(boards: Board[], hasWorkspace = true) {
  return Response.json({ boards, hasWorkspace });
}

const settle = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 10)));

function requests() {
  return fetchMock().mock.calls.map(([path, init]) => ({
    path,
    method: init?.method ?? "GET",
  }));
}

afterEach(async () => {
  fetchMock().mockImplementation(async () => boardsResponse(seedBoards, false));
  act(() => startSync());
  await settle();
  resetBoards();
  localStorage.clear();
  delete root.dataset.sync;
});

describe("saving", () => {
  it("sends each change as JSON with a time limit", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    act(() => dispatch(TOGGLE));
    await settle();

    const [path, init] = fetchMock().mock.calls[0];
    expect(path).toBe("/api/subtasks/seed-t1-s2");
    expect(init).toMatchObject({
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isCompleted: true }),
    });
    expect(timeout).toHaveBeenCalledWith(SAVE_TIMEOUT_MS);
    expect(init?.signal).toBe(timeout.mock.results[0].value);
    expect(SAVE_TIMEOUT_MS).toBe(10_000);
  });

  it("sends a delete without a body", async () => {
    act(() => dispatch({ type: "deleteTask", taskId: "seed-t2" }));
    await settle();

    const [path, init] = fetchMock().mock.calls[0];
    expect(path).toBe("/api/tasks/seed-t2");
    expect(init).toMatchObject({ method: "DELETE" });
    expect(init?.headers).toBeUndefined();
    expect(init?.body).toBeUndefined();
  });

  it("keeps a saved change without drawing the board again", async () => {
    const { result } = renderHook(useBoards);
    act(() => dispatch(TOGGLE));
    const optimistic = result.current;
    await settle();

    expect(result.current).toBe(optimistic);
    expect(result.current).toEqual(applyCommand(seedBoards, TOGGLE));
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe("true");
  });

  it.each<[string, Response | Error, string]>([
    [
      "the server fails",
      new Response(null, { status: 500 }),
      SAVE_ERRORS.failed,
    ],
    [
      "the request is refused",
      new Response(null, { status: 404 }),
      SAVE_ERRORS.failed,
    ],
    ["the network drops", new TypeError("Failed to fetch"), SAVE_ERRORS.failed],
    [
      "the visitor is too quick",
      new Response(null, { status: 429 }),
      SAVE_ERRORS.busy,
    ],
    [
      "today's workspaces ran out",
      new Response(null, { status: 503 }),
      SAVE_ERRORS.full,
    ],
  ])("undoes a change when %s", async (_, response, message) => {
    renderBoard();
    const { result } = renderHook(useBoards);
    answer(response);
    act(() => dispatch(TOGGLE));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(message),
    );
    expect(result.current).toBe(seedBoards);
    expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
  });

  it("undoes a change inside the open dialog and says so there", async () => {
    const user = renderBoard();
    await user.click(cardButton("Build UI for onboarding flow"));
    const dialog = screen.getByRole("dialog");
    const signIn = within(dialog).getByRole("checkbox", {
      name: "Sign in page",
    });
    answer(new Response(null, { status: 500 }));
    await user.click(signIn);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      SAVE_ERRORS.failed,
    );
    expect(signIn).not.toBeChecked();
  });

  it("saves one change at a time, in order", async () => {
    const release = hold();
    act(() => {
      dispatch(TOGGLE);
      dispatch({ type: "deleteTask", taskId: "seed-t2" });
    });
    await settle();
    expect(requests()).toEqual([
      { path: "/api/subtasks/seed-t1-s2", method: "PATCH" },
    ]);

    await release();
    await settle();
    expect(requests()).toEqual([
      { path: "/api/subtasks/seed-t1-s2", method: "PATCH" },
      { path: "/api/tasks/seed-t2", method: "DELETE" },
    ]);
  });

  it("keeps earlier saved changes when a later one fails", async () => {
    const { result } = renderHook(useBoards);
    answer(
      new Response(null, { status: 204 }),
      new Response(null, { status: 500 }),
    );
    act(() => {
      dispatch(TOGGLE);
      dispatch({ type: "deleteTask", taskId: "seed-t2" });
    });
    await settle();

    expect(result.current).toEqual(applyCommand(seedBoards, TOGGLE));
  });

  it("undoes later changes that built on a failed one", async () => {
    const { result } = renderHook(useBoards);
    answer(new Response(null, { status: 500 }));
    act(() => {
      dispatch({
        type: "createBoard",
        board: {
          id: "b-new",
          name: "New",
          columns: [{ id: "c-new", name: "A" }],
        },
      });
      dispatch({
        type: "createTask",
        columnId: "c-new",
        task: { id: "t-new", title: "Plan", description: "", subtasks: [] },
      });
    });
    expect(result.current).toHaveLength(seedBoards.length + 1);
    await settle();

    expect(result.current).toEqual(seedBoards);
  });

  it("remembers the chosen board", () => {
    act(() => selectBoard(seedBoards[2].id));
    expect(localStorage.getItem(BOARD_KEY)).toBe(seedBoards[2].id);
  });
});

describe("startSync", () => {
  it("restores the chosen board and shows it at once without a workspace", () => {
    localStorage.setItem(BOARD_KEY, seedBoards[1].id);
    root.dataset.sync = "pending";
    const { result } = renderHook(useActiveBoard);
    act(() => startSync());

    expect(result.current?.name).toBe("Marketing Plan");
    expect(root).not.toHaveAttribute("data-sync");
  });

  it("keeps a returning visitor's board hidden until their boards arrive", async () => {
    localStorage.setItem(WORKSPACE_KEY, "true");
    root.dataset.sync = "pending";
    const release = hold();
    const { result } = renderHook(useBoards);
    act(() => startSync());
    await settle();

    expect(root).toHaveAttribute("data-sync", "pending");
    expect(requests()).toEqual([{ path: "/api/boards", method: "GET" }]);

    await release(boardsResponse(renamed));
    await waitFor(() => expect(result.current).toEqual(renamed));
    expect(root).not.toHaveAttribute("data-sync");
  });

  it("leaves a new visitor's board alone once the seed is confirmed", async () => {
    answer(boardsResponse(seedBoards, false));
    let renders = 0;
    renderHook(() => {
      renders += 1;
      return useBoards();
    });
    act(() => startSync());
    await settle();

    expect(renders).toBe(1);
  });

  it("forgets a workspace the server no longer has", async () => {
    localStorage.setItem(WORKSPACE_KEY, "true");
    answer(boardsResponse(seedBoards, false));
    const { result } = renderHook(useBoards);
    act(() => startSync());
    await settle();

    expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
    expect(result.current).toBe(seedBoards);
  });

  it("keeps changes made while the boards were loading", async () => {
    const release = hold();
    const { result } = renderHook(useBoards);
    act(() => {
      startSync();
      dispatch({ type: "deleteBoard", boardId: seedBoards[0].id });
      dispatch({ type: "deleteBoard", boardId: seedBoards[2].id });
    });
    await release(boardsResponse([...renamed, ...seedBoards.slice(1)]));
    await settle();

    expect(result.current).toEqual([seedBoards[1]]);
    expect(requests()).toEqual([
      { path: "/api/boards", method: "GET" },
      { path: `/api/boards/${seedBoards[0].id}`, method: "DELETE" },
      { path: `/api/boards/${seedBoards[2].id}`, method: "DELETE" },
    ]);
  });

  it.each<[string, Response | Error]>([
    [
      "answers with an error",
      Response.json({ error: "Something went wrong." }, { status: 500 }),
    ],
    ["can't be reached", new TypeError("Failed to fetch")],
  ])("stops saving when the server %s", async (_, response) => {
    renderBoard();
    localStorage.setItem(WORKSPACE_KEY, "true");
    root.dataset.sync = "pending";
    answer(response);
    act(() => startSync());

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(SAVE_ERRORS.offline),
    );
    expect(root).not.toHaveAttribute("data-sync");

    const { result } = renderHook(useBoards);
    act(() => dispatch(TOGGLE));
    await settle();
    expect(fetchMock()).toHaveBeenCalledOnce();
    expect(result.current).toBe(seedBoards);
  });
});
