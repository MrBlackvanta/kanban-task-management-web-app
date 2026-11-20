import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import Home from "./page";

function headingLevels() {
  return [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map(
    (heading) => Number(heading.tagName.slice(1)),
  );
}

describe("Home", () => {
  it("starts the outline at the board's h1 and never skips a level", () => {
    render(<Home />);
    const levels = headingLevels();

    expect(levels[0]).toBe(1);
    expect(
      levels.filter(
        (level, index) => index > 0 && level > levels[index - 1] + 1,
      ),
    ).toEqual([]);
  });
});
