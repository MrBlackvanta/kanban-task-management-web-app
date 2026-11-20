import type { Direction } from "@/lib";
import { cancelDrag, dropDrag, getDrag, startDrag, stepDrag } from "@/store";
import type { KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { focusTaskCard } from "./card-focus";

const DIRECTIONS = new Map<string, Direction>([
  ["ArrowUp", "up"],
  ["ArrowDown", "down"],
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
]);

export function onCardKeyDown(event: KeyboardEvent, taskId: string) {
  const session = getDrag();
  if (!session) {
    if (event.key !== " " || event.repeat) return;
    startDrag(taskId, { mode: "keyboard" });
    return;
  }

  const change = session.mode === "keyboard" && keyChange(event);
  if (!change) return;
  if (event.key !== "Tab") event.preventDefault();
  flushSync(change);
  focusTaskCard(session.taskId);
}

export function onCardKeyUp(event: KeyboardEvent) {
  if (event.key === " ") event.preventDefault();
}

function keyChange({ key, repeat }: KeyboardEvent) {
  const direction = DIRECTIONS.get(key);
  if (direction) return () => stepDrag(direction);
  if (repeat) return undefined;
  if (key === " " || key === "Enter") return dropDrag;
  if (key === "Escape" || key === "Tab") return cancelDrag;
  return undefined;
}
