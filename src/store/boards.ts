import { BOARD_KEY, WORKSPACE_KEY, seedBoards } from "@/data";
import {
  BOARDS_PATH,
  applyCommand,
  commandRequest,
  type Board,
  type BoardsResponse,
  type Command,
} from "@/lib";
import { createStore, useStore } from "./create-store";
import { showNotice } from "./notice";
import { readStorage, writeStorage } from "./storage";

type BoardState = { boards: Board[]; activeBoardId: string | undefined };

type SaveOutcome = "saved" | keyof typeof SAVE_ERRORS;

export const SAVE_TIMEOUT_MS = 10_000;

export const SAVE_ERRORS = {
  failed: "Couldn't save. Change undone.",
  busy: "Too many changes at once. Change undone.",
  full: "Saving is paused for new visitors today. Change undone.",
  offline:
    "Can't reach the server, so changes aren't saved. Reload to try again.",
} as const;

const store = createStore<BoardState>({
  boards: seedBoards,
  activeBoardId: seedBoards[0]?.id,
});

let savedBoards = seedBoards;
let unsaved: Command[] = [];
let canSave = true;
let queue = Promise.resolve();

export function dispatch(command: Command) {
  unsaved = [...unsaved, command];
  showBoards(applyCommand(store.getState().boards, command));
  enqueue(() => save(command));
}

export function selectBoard(boardId: string) {
  store.setState({ ...store.getState(), activeBoardId: boardId });
  writeStorage(BOARD_KEY, boardId);
}

export function startSync() {
  const storedBoardId = readStorage(BOARD_KEY);
  if (storedBoardId) {
    store.setState({ ...store.getState(), activeBoardId: storedBoardId });
  }
  if (readStorage(WORKSPACE_KEY) === null) openSyncGate();
  enqueue(loadBoards);
}

export function getBoards() {
  return store.getState().boards;
}

export function useBoards() {
  return useStore(store).boards;
}

export function useActiveBoard(): Board | undefined {
  const { boards, activeBoardId } = useStore(store);
  return boards.find((board) => board.id === activeBoardId) ?? boards[0];
}

function enqueue(task: () => Promise<void>) {
  queue = queue.then(task);
}

async function loadBoards() {
  const loaded = await fetchBoards();
  canSave = loaded !== undefined;
  if (loaded) {
    savedBoards = loaded.hasWorkspace ? loaded.boards : seedBoards;
    writeStorage(WORKSPACE_KEY, loaded.hasWorkspace ? "true" : null);
    showBoards(unsaved.reduce(applyCommand, savedBoards));
  } else {
    showNotice(SAVE_ERRORS.offline);
  }
  openSyncGate();
}

async function fetchBoards(): Promise<BoardsResponse | undefined> {
  try {
    const response = await fetch(BOARDS_PATH, {
      signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
    });
    return response.ok ? await response.json() : undefined;
  } catch {
    return undefined;
  }
}

async function save(command: Command) {
  const outcome = canSave ? await send(command) : "offline";
  unsaved = unsaved.filter((pending) => pending !== command);
  if (outcome === "saved") {
    savedBoards = applyCommand(savedBoards, command);
    writeStorage(WORKSPACE_KEY, "true");
    return;
  }
  showBoards(unsaved.reduce(applyCommand, savedBoards));
  showNotice(SAVE_ERRORS[outcome]);
}

async function send(command: Command): Promise<SaveOutcome> {
  const { method, path, body } = commandRequest(command);
  try {
    const response = await fetch(path, {
      method,
      ...(body !== undefined && {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
    });
    return outcomeOf(response);
  } catch {
    return "failed";
  }
}

function outcomeOf(response: Response): SaveOutcome {
  if (response.ok) return "saved";
  if (response.status === 429) return "busy";
  if (response.status === 503) return "full";
  return "failed";
}

function showBoards(boards: Board[]) {
  const state = store.getState();
  if (boards !== state.boards) store.setState({ ...state, boards });
}

function openSyncGate() {
  delete document.documentElement.dataset.sync;
}
