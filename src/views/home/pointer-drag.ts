import { dropIndex, edgeScroll, nearestSpan, poseOf } from "@/lib";
import { cancelDrag, dropDrag, moveDrag, startDrag } from "@/store";
import type { RefObject } from "react";
import { flushSync } from "react-dom";
import { focusTaskCard } from "./card-focus";
import { settleTaskCard } from "./card-motion";

export const MOUSE_DRAG_DISTANCE = 4;
export const TOUCH_HOLD_MS = 250;
export const TOUCH_HOLD_TOLERANCE = 8;
export const LATE_CLICK_MS = 50;

type PointerDrag = {
  down: PointerEvent;
  board: HTMLElement;
  card: HTMLElement;
  ghost: RefObject<HTMLElement | null>;
};

export function followPointer({ down, board, card, ghost }: PointerDrag) {
  const taskId = card.dataset.taskId!;
  const scroller = board.parentElement!;
  const touch = down.pointerType === "touch";
  const listening = new AbortController();
  const options = { signal: listening.signal };
  const hold = touch ? setTimeout(begin, TOUCH_HOLD_MS) : undefined;
  let pointer = down;
  let dragging = false;
  let frame = 0;

  window.addEventListener("pointermove", onMove, options);
  window.addEventListener("pointerup", onUp, options);
  window.addEventListener("pointercancel", onCancel, options);
  window.addEventListener("keydown", onKeyDown, options);
  window.addEventListener("contextmenu", preventDefault, options);

  function onMove(event: PointerEvent) {
    if (event.pointerId !== down.pointerId) return;
    pointer = event;
    const travel = Math.hypot(
      pointer.clientX - down.clientX,
      pointer.clientY - down.clientY,
    );
    if (dragging) follow();
    else if (touch && travel > TOUCH_HOLD_TOLERANCE) stop();
    else if (!touch && travel > MOUSE_DRAG_DISTANCE) begin();
  }

  function begin() {
    dragging = true;
    board.setPointerCapture(down.pointerId);
    const ghostRect = card.getBoundingClientRect();
    flushSync(() => startDrag(taskId, { mode: "pointer", ghost: ghostRect }));
    follow();
    frame = requestAnimationFrame(scrollNearEdges);
  }

  function follow() {
    const style = ghost.current?.style;
    style?.setProperty("--drag-x", `${pointer.clientX - down.clientX}px`);
    style?.setProperty("--drag-y", `${pointer.clientY - down.clientY}px`);
    retarget();
  }

  function retarget() {
    const columns = [
      ...board.querySelectorAll<HTMLElement>("[data-column-id]"),
    ];
    const column = columns[nearestSpan(columns.map(span), pointer.clientX)];
    const cards = column.querySelectorAll<HTMLElement>(
      "[data-task-id]:not([hidden])",
    );
    moveDrag({
      columnId: column.dataset.columnId!,
      index: dropIndex([...cards].map(midpoint), pointer.clientY),
    });
  }

  function scrollNearEdges() {
    const area = scroller.getBoundingClientRect();
    const left = edgeScroll(pointer.clientX, {
      start: area.left,
      end: area.right,
    });
    const top = edgeScroll(pointer.clientY, {
      start: area.top,
      end: area.bottom,
    });
    if (left !== 0 || top !== 0) {
      scroller.scrollBy({ left, top });
      retarget();
    }
    frame = requestAnimationFrame(scrollNearEdges);
  }

  function onUp(event: PointerEvent) {
    if (event.pointerId !== down.pointerId) return;
    if (dragging) {
      finish(dropDrag);
      swallowNextClick();
    }
    stop();
  }

  function onCancel(event: PointerEvent) {
    if (event.pointerId !== down.pointerId) return;
    if (dragging) finish(cancelDrag);
    stop();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!dragging || event.key !== "Escape") return;
    finish(cancelDrag);
    stop();
  }

  function finish(change: () => void) {
    const from = ghost.current ? poseOf(ghost.current) : undefined;
    flushSync(change);
    focusTaskCard(taskId);
    settleTaskCard(taskId, from);
  }

  function stop() {
    clearTimeout(hold);
    cancelAnimationFrame(frame);
    listening.abort();
  }
}

function span(element: HTMLElement) {
  const { left, right } = element.getBoundingClientRect();
  return { start: left, end: right };
}

function midpoint(element: HTMLElement) {
  const { top, height } = element.getBoundingClientRect();
  return top + height / 2;
}

function preventDefault(event: Event) {
  event.preventDefault();
}

function swallowNextClick() {
  const swallow = (event: MouseEvent) => event.stopPropagation();
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(
    () => window.removeEventListener("click", swallow, { capture: true }),
    LATE_CLICK_MS,
  );
}
