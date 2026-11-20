const OPEN = "data-popover-open";

const invokers = new WeakMap<HTMLElement, HTMLElement>();

function openPopovers() {
  return document.querySelectorAll<HTMLElement>(`[${OPEN}]`);
}

function showPopover(this: HTMLElement) {
  this.setAttribute(OPEN, "");
}

function hidePopover(this: HTMLElement) {
  if (!this.hasAttribute(OPEN)) return;

  const hadFocus = this.contains(document.activeElement);
  this.removeAttribute(OPEN);
  if (hadFocus) invokers.get(this)?.focus();
}

function invokeOrDismiss(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : null;
  const invoker = target?.closest<HTMLButtonElement>("button[popovertarget]");
  const popover = invoker
    ? document.getElementById(invoker.getAttribute("popovertarget")!)
    : null;

  for (const open of openPopovers()) {
    if (open !== popover && !open.contains(target)) open.hidePopover();
  }
  if (!invoker || !popover) return;

  const action = invoker.getAttribute("popovertargetaction");
  const opens =
    action === "show" || (action !== "hide" && !popover.hasAttribute(OPEN));
  if (!opens) {
    popover.hidePopover();
    return;
  }
  invokers.set(popover, invoker);
  popover.showPopover();
}

function dismissOnEscape(event: KeyboardEvent) {
  const open = openPopovers();
  if (event.key !== "Escape" || open.length === 0) return;

  event.stopImmediatePropagation();
  for (const popover of open) popover.hidePopover();
}

export function installPopover() {
  Object.assign(HTMLElement.prototype, {
    showPopover,
    hidePopover,
  });
  document.addEventListener("click", invokeOrDismiss);
  document.addEventListener("keydown", dismissOnEscape);

  const style = document.createElement("style");
  style.textContent = `[popover][${OPEN}] { display: block !important; }`;
  document.head.append(style);
}
