export function installScrolling() {
  Object.assign(Element.prototype, {
    setPointerCapture() {},
    scrollIntoView() {},
    scrollBy(this: Element, { left = 0, top = 0 }: ScrollToOptions) {
      this.scrollLeft += left;
      this.scrollTop += top;
    },
  });
}
