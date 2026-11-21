import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import NotFound, { metadata } from "./not-found";

describe("NotFound", () => {
  it("names the problem as the page's only heading", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("keeps the product's header, so the page reads as the same site", () => {
    render(<NotFound />);

    expect(
      within(screen.getByRole("banner")).getByRole("img", { name: "kanban" }),
    ).toBeInTheDocument();
  });

  it("offers exactly one way out, a real link back to the boards", () => {
    render(<NotFound />);

    const internalLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/"));

    expect(internalLinks).toHaveLength(1);
    expect(internalLinks[0]).toHaveAccessibleName("Back to boards");
    expect(internalLinks[0]).toHaveAttribute("href", "/");
  });

  it("signs the page like every other one", () => {
    render(<NotFound />);

    expect(
      within(screen.getByRole("main")).getByRole("link", {
        name: "Abdelrhman Abdelaal",
      }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/abdelrhman-vanta/");
  });

  it("carries its own title and drops the home canonical", () => {
    expect(metadata.title).toBe("kanban | Page not found");
    expect(metadata.alternates).toEqual({ canonical: null });
    expect(metadata).not.toHaveProperty("robots");
  });
});
