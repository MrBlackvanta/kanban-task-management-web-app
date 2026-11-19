import { seedBoards } from "@/data";
import { applyCommand, type Board, type Command } from "@/lib";
import { useSyncExternalStore } from "react";

type BoardState = { boards: Board[]; activeBoardId: string | undefined };

const initialState: BoardState = {
  boards: seedBoards,
  activeBoardId: seedBoards[0]?.id,
};

let state = initialState;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setState(next: BoardState) {
  state = next;
  for (const listener of listeners) listener();
}

function useBoardState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initialState,
  );
}

export function dispatch(command: Command) {
  setState({ ...state, boards: applyCommand(state.boards, command) });
}

export function selectBoard(boardId: string) {
  setState({ ...state, activeBoardId: boardId });
}

export function useBoards() {
  return useBoardState().boards;
}

export function useActiveBoard(): Board | undefined {
  const { boards, activeBoardId } = useBoardState();
  return boards.find((board) => board.id === activeBoardId) ?? boards[0];
}
