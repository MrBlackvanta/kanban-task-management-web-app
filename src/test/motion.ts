import { vi } from "vite-plus/test";

type QueuedTransition = { update: () => void; finish: () => void };

export const animate = vi.fn<Element["animate"]>();

export function installMotion() {
  animate.mockReset();
  Element.prototype.animate = animate;
  Element.prototype.getAnimations = () => [];
  Reflect.deleteProperty(document, "startViewTransition");
}

export function fakeViewTransitions() {
  const queued: QueuedTransition[] = [];
  const start = vi.fn((update: () => void) => {
    let finish = () => {};
    const finished = new Promise<undefined>((resolve) => {
      finish = () => resolve(undefined);
    });
    queued.push({ update, finish });
    return { finished } as ViewTransition;
  });
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: start,
  });

  return {
    start,
    queued,
    runUpdates: () => {
      for (const transition of queued) transition.update();
    },
    finishAll: async () => {
      for (const transition of queued) transition.finish();
      await Promise.resolve();
    },
  };
}
