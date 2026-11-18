import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import Signature from "./signature";

describe("Signature", () => {
  it("credits the author", () => {
    const { container } = render(<Signature />);

    expect(container).toHaveTextContent("Coded by Abdelrhman Abdelaal.");
    expect(
      screen.getByRole("link", { name: "Abdelrhman Abdelaal" }),
    ).toBeInTheDocument();
  });

  it("opens the profile in a new tab without handing it the opener", () => {
    render(<Signature />);

    const link = screen.getByRole("link", { name: "Abdelrhman Abdelaal" });

    expect(link).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/abdelrhman-vanta/",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
