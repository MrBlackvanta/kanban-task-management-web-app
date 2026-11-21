export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type Pose = { x: number; y: number; scale: string; rotate: string };

let currentTransition: ViewTransition | undefined;

export function prefersMotion() {
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function canTransitionView() {
  return "startViewTransition" in document && prefersMotion();
}

export function transitionView(motion: string, update: () => void) {
  if (!canTransitionView()) {
    update();
    return;
  }

  const root = document.documentElement;
  root.dataset.motion = motion;
  const transition = document.startViewTransition(update);
  currentTransition = transition;
  void transition.finished.finally(() => {
    if (currentTransition !== transition) return;
    currentTransition = undefined;
    delete root.dataset.motion;
  });
}

export function poseOf(element: Element): Pose {
  const { left, top, width, height } = element.getBoundingClientRect();
  const { scale, rotate } = getComputedStyle(element);
  return { x: left + width / 2, y: top + height / 2, scale, rotate };
}

export function glide(element: HTMLElement, from: Pose) {
  if (!prefersMotion()) return;

  for (const animation of element.getAnimations()) animation.cancel();
  const to = poseOf(element);
  const x = Math.round(from.x - to.x);
  const y = Math.round(from.y - to.y);
  const turned = from.scale !== to.scale || from.rotate !== to.rotate;
  if (x === 0 && y === 0 && !turned) return;

  element.animate(
    [
      {
        translate: `${x}px ${y}px`,
        scale: from.scale,
        rotate: from.rotate,
        zIndex: 1,
      },
      { translate: "0px 0px", scale: to.scale, rotate: to.rotate, zIndex: 1 },
    ],
    {
      duration: readDuration("--motion-sheet"),
      easing: readToken("--ease-enter"),
    },
  );
}

function readDuration(name: string) {
  const value = readToken(name);
  const amount = Number.parseFloat(value);
  return value.endsWith("ms") ? amount : amount * 1000;
}

function readToken(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
