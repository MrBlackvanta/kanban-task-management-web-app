import type { TaskLocation } from "./boards";
import { applyCommand } from "./commands";
import type { Board } from "./types";

export type Slot = { columnId: string; index: number };

export type Span = { start: number; end: number };

export type Direction = "up" | "down" | "left" | "right";

export const SCROLL_EDGE = 64;
export const MAX_SCROLL_STEP = 16;

export function sameSlot(first: Slot, second: Slot) {
  return first.columnId === second.columnId && first.index === second.index;
}

export function dropIndex(midpoints: number[], position: number) {
  return midpoints.filter((midpoint) => midpoint < position).length;
}

export function nearestSpan(spans: Span[], position: number) {
  const distances = spans.map(({ start, end }) =>
    Math.max(start - position, position - end),
  );
  return distances.indexOf(Math.min(...distances));
}

export function edgeScroll(position: number, { start, end }: Span) {
  if (position - start < SCROLL_EDGE) return -scrollStep(position - start);
  if (end - position < SCROLL_EDGE) return scrollStep(end - position);
  return 0;
}

function scrollStep(distance: number) {
  const depth = 1 - Math.max(distance, 0) / SCROLL_EDGE;
  return Math.ceil(MAX_SCROLL_STEP * depth);
}

export function placeholderIndex(origin: Slot, slot: Slot) {
  const passedOrigin =
    origin.columnId === slot.columnId && origin.index <= slot.index;
  return passedOrigin ? slot.index + 1 : slot.index;
}

export function stepSlot(
  board: Board,
  taskId: string,
  slot: Slot,
  direction: Direction,
): Slot {
  const sizes = board.columns.map((column) => ({
    columnId: column.id,
    size: column.tasks.filter((task) => task.id !== taskId).length,
  }));
  const column = sizes.findIndex((size) => size.columnId === slot.columnId);

  switch (direction) {
    case "up":
      return { ...slot, index: Math.max(slot.index - 1, 0) };
    case "down":
      return { ...slot, index: Math.min(slot.index + 1, sizes[column].size) };
    case "left":
    case "right": {
      const step = direction === "left" ? -1 : 1;
      const next = sizes[clamp(column + step, 0, sizes.length - 1)];
      return {
        columnId: next.columnId,
        index: Math.min(slot.index, next.size),
      };
    }
  }
}

export function placeTask(boards: Board[], taskId: string, slot: Slot) {
  return applyCommand(boards, { type: "moveTask", taskId, ...slot });
}

export function describePlace({ column, index }: TaskLocation) {
  return `${column.name}, position ${index + 1} of ${column.tasks.length}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
