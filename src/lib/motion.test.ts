import { installMatchMedia } from "@/test/media";
import { animate, fakeViewTransitions } from "@/test/motion";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { REDUCED_MOTION_QUERY, glide, transitionView } from "./motion";

const root = document.documentElement;

afterEach(() => {
  delete root.dataset.motion;
  root.removeAttribute("style");
});

describe("transitionView", () => {
  it("updates at once where the browser has no view transitions", () => {
    const update = vi.fn();

    transitionView("sidebar-hide", update);

    expect(update).toHaveBeenCalledOnce();
    expect(root.dataset.motion).toBeUndefined();
  });

  it("updates at once when motion is reduced", () => {
    const views = fakeViewTransitions();
    installMatchMedia([REDUCED_MOTION_QUERY]);
    const update = vi.fn();

    transitionView("sidebar-hide", update);

    expect(update).toHaveBeenCalledOnce();
    expect(views.start).not.toHaveBeenCalled();
    expect(root.dataset.motion).toBeUndefined();
  });

  it("names the motion on the root until the transition finishes", async () => {
    const views = fakeViewTransitions();
    const update = vi.fn(() =>
      expect(root.dataset.motion).toBe("sidebar-hide"),
    );

    transitionView("sidebar-hide", update);
    expect(update).not.toHaveBeenCalled();

    views.runUpdates();
    expect(update).toHaveBeenCalledOnce();

    await views.finishAll();
    expect(root.dataset.motion).toBeUndefined();
  });

  it("leaves a newer transition's name in place when an older one ends", async () => {
    const views = fakeViewTransitions();

    transitionView("sidebar-hide", vi.fn());
    transitionView("sidebar-show", vi.fn());
    views.queued[0].finish();
    await Promise.resolve();

    expect(root.dataset.motion).toBe("sidebar-show");
  });
});

describe("glide", () => {
  const from = { x: 300, y: 200, scale: "1.03", rotate: "2deg" };

  function cardAt(x: number, y: number) {
    const card = document.createElement("article");
    card.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: x - 140, y: y - 40, width: 280, height: 80 });
    return card;
  }

  it("animates the card from the pose it was let go in to its place", () => {
    root.style.setProperty("--motion-sheet", "250ms");
    root.style.setProperty("--ease-enter", "cubic-bezier(0.2, 0, 0, 1)");
    const card = cardAt(100, 50);

    glide(card, from);

    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.contexts[0]).toBe(card);
    const [keyframes, options] = animate.mock.calls[0];
    expect(keyframes).toEqual([
      expect.objectContaining({
        translate: "200px 150px",
        scale: "1.03",
        rotate: "2deg",
        zIndex: 1,
      }),
      expect.objectContaining({ translate: "0px 0px", zIndex: 1 }),
    ]);
    expect(options).toEqual({
      duration: 250,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    });
  });

  it("reads a duration the minifier rewrote in seconds", () => {
    root.style.setProperty("--motion-sheet", ".25s");

    glide(cardAt(100, 50), from);

    expect(animate.mock.calls[0][1]).toEqual(
      expect.objectContaining({ duration: 250 }),
    );
  });

  it("cancels a glide still running before measuring the new place", () => {
    const card = cardAt(100, 50);
    const cancel = vi.fn();
    card.getAnimations = () => [{ cancel } as unknown as Animation];

    glide(card, from);

    expect(cancel).toHaveBeenCalledOnce();
  });

  it("stays still for a card that did not move", () => {
    const card = cardAt(300, 200);
    const { scale, rotate } = getComputedStyle(card);

    glide(card, { x: 300, y: 200, scale, rotate });

    expect(animate).not.toHaveBeenCalled();
  });

  it("stays still when motion is reduced", () => {
    installMatchMedia([REDUCED_MOTION_QUERY]);

    glide(cardAt(100, 50), from);

    expect(animate).not.toHaveBeenCalled();
  });
});
