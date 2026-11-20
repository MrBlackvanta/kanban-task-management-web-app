import { vi } from "vite-plus/test";

export const VIEWPORT = { width: 1000, height: 800 };
const COLUMN = { left: 24, width: 280, gap: 24 };
const CARD = { top: 100, height: 80, gap: 20 };

export function columnCenter(index: number) {
  return COLUMN.left + index * (COLUMN.width + COLUMN.gap) + COLUMN.width / 2;
}

export function cardCenter(index: number) {
  return CARD.top + index * (CARD.height + CARD.gap) + CARD.height / 2;
}

export function layOutBoard() {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      if (this.tagName === "MAIN") return DOMRect.fromRect(VIEWPORT);
      const column = this.closest("[data-column-id]");
      if (!column) return DOMRect.fromRect();

      const { scrollLeft, scrollTop } = document.querySelector("main")!;
      const columns = [...document.querySelectorAll("[data-column-id]")];
      const x =
        columnCenter(columns.indexOf(column)) - COLUMN.width / 2 - scrollLeft;
      const item = this.closest("li");
      if (!item) {
        return DOMRect.fromRect({ x, width: COLUMN.width, height: 800 });
      }

      const shown = [...item.parentElement!.children].filter(
        (child) => !child.hasAttribute("hidden"),
      );
      const y = cardCenter(shown.indexOf(item)) - CARD.height / 2 - scrollTop;
      return DOMRect.fromRect({
        x,
        y,
        width: COLUMN.width,
        height: CARD.height,
      });
    },
  );
}
