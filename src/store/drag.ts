import {
  describePlace,
  locateTask,
  placeTask,
  sameSlot,
  stepSlot,
  type Board,
  type Direction,
  type Slot,
  type TaskLocation,
} from "@/lib";
import { announce } from "./announcer";
import { dispatch, getBoards } from "./boards";
import { createStore, useStore } from "./create-store";

export type Ghost = Pick<DOMRect, "left" | "top" | "width" | "height">;

type DragStart = { mode: "keyboard" } | { mode: "pointer"; ghost: Ghost };

export type DragSession = DragStart & {
  taskId: string;
  origin: Slot;
  slot: Slot;
};

const store = createStore<DragSession | undefined>(undefined);

export function startDrag(taskId: string, start: DragStart) {
  const location = locateTask(getBoards(), taskId);
  if (!location) return;

  const origin = { columnId: location.column.id, index: location.index };
  store.setState({ ...start, taskId, origin, slot: origin });
  announce(`Picked up ${location.task.title}. ${describePlace(location)}.`);
}

export function moveDrag(slot: Slot) {
  const session = store.getState();
  if (!session || sameSlot(session.slot, slot)) return;

  store.setState({ ...session, slot });
  announceAt(
    placeTask(getBoards(), session.taskId, slot),
    session.taskId,
    (location) => `Moved to ${describePlace(location)}.`,
  );
}

export function stepDrag(direction: Direction) {
  const session = store.getState();
  const location = session && locateTask(getBoards(), session.taskId);
  if (!location) return;

  moveDrag(stepSlot(location.board, session.taskId, session.slot, direction));
}

export function dropDrag() {
  const session = endDrag();
  if (!session) return;

  if (!sameSlot(session.origin, session.slot)) {
    dispatch({ type: "moveTask", taskId: session.taskId, ...session.slot });
  }
  announceAt(
    getBoards(),
    session.taskId,
    (location) =>
      `Dropped ${location.task.title} in ${describePlace(location)}.`,
  );
}

export function cancelDrag() {
  const session = endDrag();
  if (!session) return;

  announceAt(
    getBoards(),
    session.taskId,
    (location) =>
      `Move cancelled. ${location.task.title} is back in ${describePlace(location)}.`,
  );
}

export function getDrag() {
  return store.getState();
}

export function useDrag() {
  return useStore(store);
}

function endDrag() {
  const session = store.getState();
  store.setState(undefined);
  return session;
}

function announceAt(
  boards: Board[],
  taskId: string,
  message: (location: TaskLocation) => string,
) {
  const location = locateTask(boards, taskId);
  if (location) announce(message(location));
}
