import { REDUCED_MOTION_QUERY } from "@/lib";
import { cancelDrag } from "@/store";
import {
  cardButton,
  cardTitles,
  createTestBoard,
  renderBoard,
  resetBoards,
} from "@/test/board";
import {
  VIEWPORT,
  cardCenter,
  columnCenter,
  layOutBoard,
} from "@/test/board-layout";
import { installMatchMedia } from "@/test/media";
import { animate } from "@/test/motion";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import {
  LATE_CLICK_MS,
  MOUSE_DRAG_DISTANCE,
  TOUCH_HOLD_MS,
  TOUCH_HOLD_TOLERANCE,
} from "./pointer-drag";

const PLAN = "Plan the launch";
const PLAN_AT = { x: columnCenter(0), y: cardCenter(0) };

function pointer(
  type: string,
  x: number,
  y: number,
  init: PointerEventInit = {},
) {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    ...init,
  });
}

function press(init: PointerEventInit = {}, target = cardButton(PLAN)) {
  fireEvent(target, pointer("pointerdown", PLAN_AT.x, PLAN_AT.y, init));
}

function moveTo(x: number, y: number, init: PointerEventInit = {}) {
  fireEvent(window, pointer("pointermove", x, y, init));
}

function release(type = "pointerup", init: PointerEventInit = {}) {
  fireEvent(window, pointer(type, 0, 0, init));
}

function drag(x: number, y: number) {
  press();
  moveTo(x, y);
  release();
}

function announcement() {
  return document.querySelector("[aria-live=assertive]")?.textContent;
}

async function saves() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  return vi.mocked(fetch).mock.calls.map(([path, init]) => [path, init?.body]);
}

function ghost() {
  return document.querySelector<HTMLElement>("[aria-hidden=true].fixed");
}

beforeEach(async () => {
  act(createTestBoard);
  await saves();
  vi.mocked(fetch).mockClear();
});

afterEach(() => {
  release("pointercancel");
  act(() => cancelDrag());
  vi.useRealTimers();
  resetBoards();
});

describe("dragging with a mouse", () => {
  beforeEach(layOutBoard);

  it("waits for the pointer to travel before lifting the card", () => {
    renderBoard();
    const capture = vi.spyOn(Element.prototype, "setPointerCapture");
    press();

    moveTo(PLAN_AT.x + MOUSE_DRAG_DISTANCE, PLAN_AT.y);
    expect(cardButton(PLAN)).toBeInTheDocument();
    expect(capture).not.toHaveBeenCalled();

    moveTo(PLAN_AT.x + MOUSE_DRAG_DISTANCE + 1, PLAN_AT.y);
    expect(
      screen.queryByRole("button", { name: PLAN }),
    ).not.toBeInTheDocument();
    expect(announcement()).toBe(`Picked up ${PLAN}. Todo, position 1 of 3.`);
    expect(capture).toHaveBeenCalledWith(1);
    expect(capture.mock.contexts).toEqual([
      screen.getByRole("main").firstElementChild,
    ]);
    expect(MOUSE_DRAG_DISTANCE).toBe(4);
  });

  it("lets Escape go before the card is lifted", () => {
    renderBoard();
    press();
    fireEvent.keyDown(window, { key: "Escape" });
    moveTo(PLAN_AT.x + 10, PLAN_AT.y);

    expect(announcement()).toBe(`Picked up ${PLAN}. Todo, position 1 of 3.`);
  });

  it("carries a copy of the card under the pointer", () => {
    renderBoard();
    press();
    moveTo(PLAN_AT.x + 30, PLAN_AT.y + 50);

    expect(ghost()).toHaveTextContent(`${PLAN}1 of 2 subtasks`);
    expect(ghost()?.style.getPropertyValue("--ghost-left")).toBe("24px");
    expect(ghost()?.style.getPropertyValue("--ghost-top")).toBe("100px");
    expect(ghost()?.style.getPropertyValue("--ghost-width")).toBe("280px");
    expect(ghost()?.style.getPropertyValue("--drag-x")).toBe("30px");
    expect(ghost()?.style.getPropertyValue("--drag-y")).toBe("50px");
  });

  it("drops the card into another column, after the cards above the pointer", async () => {
    renderBoard();
    drag(columnCenter(1) + 130, cardCenter(1));

    expect(cardTitles("Todo")).toEqual(["Book the venue", "Send invites"]);
    expect(cardTitles("Doing")).toEqual(["Busy task", PLAN]);
    expect(await saves()).toEqual([
      [
        "/api/tasks/plan/position",
        JSON.stringify({ columnId: "doing", index: 1 }),
      ],
    ]);
    expect(announcement()).toBe(`Dropped ${PLAN} in Doing, position 2 of 2.`);
    expect(cardButton(PLAN)).toHaveFocus();
    expect(ghost()).not.toBeInTheDocument();
  });

  it("settles the dropped card from where its copy was let go", () => {
    renderBoard();
    press();
    moveTo(columnCenter(1) + 130, cardCenter(1));
    ghost()!.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 500, y: 300, width: 280, height: 80 });

    release();

    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.contexts[0]).toBe(cardButton(PLAN).closest("article"));
    expect(animate.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        translate: `${640 - columnCenter(1)}px ${340 - cardCenter(1)}px`,
      }),
      expect.objectContaining({ translate: "0px 0px" }),
    ]);
  });

  it("drops the card in place without motion when motion is reduced", () => {
    installMatchMedia([REDUCED_MOTION_QUERY]);
    renderBoard();

    drag(columnCenter(1) + 130, cardCenter(1));

    expect(cardTitles("Doing")).toEqual(["Busy task", PLAN]);
    expect(animate).not.toHaveBeenCalled();
  });

  it("reorders the card within its column", () => {
    renderBoard();
    press();
    moveTo(PLAN_AT.x, cardCenter(2) - 10);

    const gap = document.querySelector("li[aria-hidden=true]");
    expect(gap?.previousElementSibling).toHaveTextContent("Book the venue");
    expect(gap?.nextElementSibling).toHaveTextContent("Send invites");

    release();
    expect(cardTitles("Todo")).toEqual([
      "Book the venue",
      PLAN,
      "Send invites",
    ]);
  });

  it("holds the card's place with a gap of its height while it moves", () => {
    renderBoard();
    press();
    moveTo(columnCenter(2), cardCenter(0));

    const gap = document.querySelector("li[aria-hidden=true]");
    expect(gap?.closest("section")).toHaveAttribute("data-column-id", "done");
    expect(gap).toHaveStyle({ "--slot-height": "80px" });
    expect(announcement()).toBe("Moved to Done, position 1 of 1.");
  });

  it("saves nothing when the card lands where it started", async () => {
    renderBoard();
    drag(PLAN_AT.x + 10, PLAN_AT.y);

    expect(cardTitles("Todo")).toEqual([
      PLAN,
      "Book the venue",
      "Send invites",
    ]);
    expect(await saves()).toEqual([]);
    expect(announcement()).toBe(`Dropped ${PLAN} in Todo, position 1 of 3.`);
  });

  it("keeps the click that ends a drag from opening the task", async () => {
    renderBoard();
    drag(columnCenter(1), cardCenter(1));

    fireEvent.click(cardButton(PLAN));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(
      () => new Promise((resolve) => setTimeout(resolve, LATE_CLICK_MS)),
    );
    fireEvent.click(cardButton(PLAN));
    expect(screen.getByRole("dialog", { name: PLAN })).toBeInTheDocument();
    expect(LATE_CLICK_MS).toBe(50);
  });

  it("ignores card keys while the pointer drags", async () => {
    const user = renderBoard();
    press();
    moveTo(columnCenter(1), cardCenter(0));
    act(() => cardButton("Book the venue").focus());

    await user.keyboard("{ArrowRight} ");

    expect(announcement()).toBe("Moved to Doing, position 1 of 2.");
  });

  it.each<[string, () => void]>([
    ["Escape", () => fireEvent.keyDown(window, { key: "Escape" })],
    ["a cancelled pointer", () => release("pointercancel")],
  ])("puts the card back on %s", async (_, cancel) => {
    renderBoard();
    press();
    moveTo(columnCenter(1), cardCenter(1));

    cancel();
    release();

    expect(cardTitles("Todo")).toEqual([
      PLAN,
      "Book the venue",
      "Send invites",
    ]);
    expect(await saves()).toEqual([]);
    expect(announcement()).toBe(
      `Move cancelled. ${PLAN} is back in Todo, position 1 of 3.`,
    );
    expect(cardButton(PLAN)).toHaveFocus();
  });

  it.each<[string, () => void]>([
    ["a secondary button", () => press({ button: 2 })],
    ["a second finger", () => press({ isPrimary: false })],
    [
      "a column heading",
      () => press({}, screen.getByRole("heading", { name: /^Todo/ })),
    ],
  ])("ignores %s", async (_, start) => {
    renderBoard();
    start();
    moveTo(columnCenter(1), cardCenter(1));
    release();

    expect(cardTitles("Todo")).toEqual([
      PLAN,
      "Book the venue",
      "Send invites",
    ]);
    expect(await saves()).toEqual([]);
  });

  it("keeps dragging when a second finger touches down", () => {
    renderBoard();
    press();
    moveTo(columnCenter(1), cardCenter(1));

    press({ pointerId: 2, isPrimary: false }, cardButton("Busy task"));
    release();

    expect(cardTitles("Doing")).toEqual(["Busy task", PLAN]);
  });

  it("follows only the pointer that picked the card", () => {
    renderBoard();
    press();
    moveTo(columnCenter(1), cardCenter(1), { pointerId: 2 });
    expect(cardButton(PLAN)).toBeInTheDocument();

    moveTo(columnCenter(1), cardCenter(1));
    release("pointerup", { pointerId: 2 });
    release("pointercancel", { pointerId: 2 });
    expect(
      screen.queryByRole("button", { name: PLAN }),
    ).not.toBeInTheDocument();

    release();
    expect(cardTitles("Doing")).toEqual(["Busy task", PLAN]);
  });

  it.each([
    ["right", VIEWPORT.width - 10, 400, { left: 14, top: 0 }],
    ["left", 10, 400, { left: -14, top: 0 }],
    ["bottom", 400, VIEWPORT.height - 10, { left: 0, top: 14 }],
    ["top", 400, 10, { left: 0, top: -14 }],
  ])(
    "scrolls the board while the card nears its %s edge",
    async (_, x, y, by) => {
      renderBoard();
      const scrollBy = vi.spyOn(screen.getByRole("main"), "scrollBy");
      press();
      moveTo(x, y);

      await waitFor(() => expect(scrollBy).toHaveBeenCalledWith(by));
    },
  );

  it("keeps aiming at the column under the pointer as the board scrolls", async () => {
    renderBoard();
    screen.getByRole("main").scrollLeft = 300;
    press();
    moveTo(20, cardCenter(0));
    expect(announcement()).toBe("Moved to Doing, position 1 of 2.");

    await waitFor(() =>
      expect(announcement()).toBe("Moved to Todo, position 1 of 3."),
    );
  });

  it("stops scrolling once the card is dropped", async () => {
    renderBoard();
    const scrollBy = vi.spyOn(screen.getByRole("main"), "scrollBy");
    press();
    moveTo(VIEWPORT.width - 10, 400);
    await waitFor(() => expect(scrollBy).toHaveBeenCalled());

    release();
    scrollBy.mockClear();
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(scrollBy).not.toHaveBeenCalled();
  });
});

describe("dragging by touch", () => {
  beforeEach(() => {
    layOutBoard();
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
  });

  const touch = { pointerType: "touch" };

  function touchMove(target: Element) {
    return fireEvent(
      target,
      new TouchEvent("touchmove", { bubbles: true, cancelable: true }),
    );
  }

  it("lifts the card after a still press", () => {
    renderBoard();
    press(touch);

    act(() => {
      vi.advanceTimersByTime(TOUCH_HOLD_MS - 1);
    });
    expect(cardButton(PLAN)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(announcement()).toBe(`Picked up ${PLAN}. Todo, position 1 of 3.`);
    expect(TOUCH_HOLD_MS).toBe(250);
  });

  it("leaves a swipe to scroll the board", () => {
    renderBoard();
    press(touch);
    moveTo(PLAN_AT.x, PLAN_AT.y + TOUCH_HOLD_TOLERANCE, touch);
    act(() => {
      vi.advanceTimersByTime(TOUCH_HOLD_MS - 1);
    });
    moveTo(PLAN_AT.x, PLAN_AT.y + TOUCH_HOLD_TOLERANCE + 1, touch);
    act(() => {
      vi.advanceTimersByTime(TOUCH_HOLD_MS);
    });

    expect(cardButton(PLAN)).toBeInTheDocument();
    expect(TOUCH_HOLD_TOLERANCE).toBe(8);
  });

  it("forgives a finger that wobbles within the tolerance", () => {
    renderBoard();
    press(touch);
    moveTo(PLAN_AT.x, PLAN_AT.y + TOUCH_HOLD_TOLERANCE, touch);
    act(() => {
      vi.advanceTimersByTime(TOUCH_HOLD_MS);
    });

    expect(announcement()).toBe(`Picked up ${PLAN}. Todo, position 1 of 3.`);
  });

  it("lets go quietly when the browser takes the touch to scroll", () => {
    renderBoard();
    press(touch);
    release("pointercancel", touch);
    act(() => {
      vi.advanceTimersByTime(TOUCH_HOLD_MS);
    });

    expect(cardButton(PLAN)).not.toHaveFocus();
    expect(announcement()).not.toMatch(/^Picked up/);
  });

  it("blocks scrolling and the press menu only while the card is held", () => {
    renderBoard();
    const card = cardButton(PLAN);
    expect(touchMove(card)).toBe(true);
    press(touch);
    expect(touchMove(card)).toBe(true);
    expect(fireEvent.contextMenu(card)).toBe(false);

    act(() => {
      vi.advanceTimersByTime(TOUCH_HOLD_MS);
    });
    expect(touchMove(card)).toBe(false);

    release();
    expect(touchMove(card)).toBe(true);
    expect(fireEvent.contextMenu(card)).toBe(true);
  });

  it("forgets a press lifted before the hold", () => {
    renderBoard();
    press(touch);
    release("pointerup", touch);
    act(() => {
      vi.advanceTimersByTime(TOUCH_HOLD_MS);
    });

    expect(cardButton(PLAN)).toBeInTheDocument();
  });
});

describe("dragging with the keyboard", () => {
  function focusPlan() {
    act(() => cardButton(PLAN).focus());
  }

  it("lifts the card on Space instead of opening it", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard(" ");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(announcement()).toBe(`Picked up ${PLAN}. Todo, position 1 of 3.`);
    expect(cardButton(PLAN)).toHaveAccessibleDescription(
      "Press Space to pick up the task, the arrow keys to move it, and Space again to drop it.",
    );
  });

  it("lifts a card from the middle and saves nothing if it stays", async () => {
    const user = renderBoard();
    act(() => cardButton("Book the venue").focus());

    await user.keyboard(" ");
    expect(announcement()).toBe(
      "Picked up Book the venue. Todo, position 2 of 3.",
    );

    await user.keyboard(" ");
    expect(await saves()).toEqual([]);
  });

  it("still opens the card on Enter", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog", { name: PLAN })).toBeInTheDocument();
  });

  it("moves the card with the arrow keys, keeping focus, and saves it on Space", async () => {
    const user = renderBoard();
    focusPlan();
    await user.keyboard(" ");

    await user.keyboard("{ArrowDown}");
    expect(cardTitles("Todo")).toEqual([
      "Book the venue",
      PLAN,
      "Send invites",
    ]);
    expect(announcement()).toBe("Moved to Todo, position 2 of 3.");
    expect(cardButton(PLAN)).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(cardTitles("Doing")).toEqual(["Busy task", PLAN]);
    expect(cardButton(PLAN)).toHaveFocus();

    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowUp}");
    expect(cardTitles("Done")).toEqual([PLAN]);
    expect(announcement()).toBe("Moved to Done, position 1 of 1.");
    expect(cardButton(PLAN)).toHaveFocus();
    expect(await saves()).toEqual([]);

    await user.keyboard("{ArrowLeft}{ArrowUp} ");
    expect(cardTitles("Doing")).toEqual([PLAN, "Busy task"]);
    expect(await saves()).toEqual([
      [
        "/api/tasks/plan/position",
        JSON.stringify({ columnId: "doing", index: 0 }),
      ],
    ]);
    expect(announcement()).toBe(`Dropped ${PLAN} in Doing, position 1 of 2.`);
    expect(cardButton(PLAN)).toHaveFocus();
  });

  it("glides the card to each new place it is moved to", async () => {
    layOutBoard();
    const user = renderBoard();
    focusPlan();
    await user.keyboard(" ");

    await user.keyboard("{ArrowDown}");

    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.contexts[0]).toBe(cardButton(PLAN).closest("article"));
    expect(animate.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        translate: `0px ${cardCenter(0) - cardCenter(1)}px`,
      }),
      expect.objectContaining({ translate: "0px 0px" }),
    ]);
  });

  it("drops the card on Enter without opening it", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard(" {ArrowDown}{Enter}");

    expect(cardTitles("Todo")).toEqual([
      "Book the venue",
      PLAN,
      "Send invites",
    ]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await saves()).toHaveLength(1);
  });

  it("puts the card back on Escape", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard(" {ArrowRight}{Escape}");

    expect(cardTitles("Todo")).toEqual([
      PLAN,
      "Book the venue",
      "Send invites",
    ]);
    expect(announcement()).toBe(
      `Move cancelled. ${PLAN} is back in Todo, position 1 of 3.`,
    );
    expect(cardButton(PLAN)).toHaveFocus();
    expect(await saves()).toEqual([]);
  });

  it("puts the card back and moves on when Tab leaves it", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard(" {ArrowRight}");
    await user.tab();

    expect(cardTitles("Todo")).toEqual([
      PLAN,
      "Book the venue",
      "Send invites",
    ]);
    expect(cardButton("Book the venue")).toHaveFocus();
    expect(await saves()).toEqual([]);
  });

  it("puts the card back when the pointer goes elsewhere", async () => {
    const user = renderBoard();
    focusPlan();
    await user.keyboard(" {ArrowRight}");

    await user.click(screen.getByRole("heading", { name: /^Todo/ }));

    expect(cardTitles("Todo")).toEqual([
      PLAN,
      "Book the venue",
      "Send invites",
    ]);
    expect(await saves()).toEqual([]);
  });

  it("ignores Space held down to lift", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard("[Space>3/]");
    await user.keyboard("{ArrowDown}");

    expect(cardTitles("Todo")).toEqual([
      "Book the venue",
      PLAN,
      "Send invites",
    ]);
    expect(await saves()).toEqual([]);
  });

  it("ignores Space held down to drop", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard(" {ArrowDown}[Space>3/]");
    await user.keyboard("{ArrowDown}");

    expect(cardTitles("Todo")).toEqual([
      "Book the venue",
      PLAN,
      "Send invites",
    ]);
    expect(announcement()).toBe(`Dropped ${PLAN} in Todo, position 2 of 3.`);
  });

  it("scrolls the moved card into view", async () => {
    const user = renderBoard();
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    focusPlan();

    await user.keyboard(" {ArrowDown}");

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
    expect(scrollIntoView.mock.contexts).toEqual([cardButton(PLAN)]);
  });

  it("leaves other keys alone", async () => {
    const user = renderBoard();
    focusPlan();

    await user.keyboard("a {Home}{ArrowDown}");

    expect(cardTitles("Todo")).toEqual([
      "Book the venue",
      PLAN,
      "Send invites",
    ]);
  });
});
