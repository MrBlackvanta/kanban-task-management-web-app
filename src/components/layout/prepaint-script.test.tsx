import { PREPAINT_SCRIPT } from "@/lib";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import PrepaintScript from "./prepaint-script";

describe("PrepaintScript", () => {
  it("holds rendering until the script it names has been parsed", () => {
    document.body.innerHTML = renderToStaticMarkup(<PrepaintScript />);
    const gate = document.querySelector('link[rel="expect"]');
    const script = document.querySelector("script");

    expect(gate).toHaveAttribute("blocking", "render");
    expect(gate).toHaveAttribute("href", `#${script?.id}`);
    expect(script?.textContent).toBe(PREPAINT_SCRIPT);
  });
});
