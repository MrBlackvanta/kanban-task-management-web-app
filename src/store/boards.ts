import { seedBoards } from "@/data";
import { applyCommand, type Board, type Command } from "@/lib";
import { createStore, useStore } from "./create-store";

type BoardState = { boards: Board[]; activeBoardId: string | undefined };

const store = createStore<BoardState>({
  boards: seedBoards,
  activeBoardId: seedBoards[0]?.id,
});

export function dispatch(command: Command) {
  const state = store.getState();
  store.setState({ ...state, boards: applyCommand(state.boards, command) });
}

export function selectBoard(boardId: string) {
  store.setState({ ...store.getState(), activeBoardId: boardId });
}

export function useBoards() {
  return useStore(store).boards;
}

export function useActiveBoard(): Board | undefined {
  const { boards, activeBoardId } = useStore(store);
  return boards.find((board) => board.id === activeBoardId) ?? boards[0];
}
