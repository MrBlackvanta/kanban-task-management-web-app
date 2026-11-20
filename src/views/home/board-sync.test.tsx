import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import BoardSync from "./board-sync";

describe("BoardSync", () => {
  it("loads the visitor's boards once the page is running", async () => {
    render(<BoardSync />);

    await waitFor(() =>
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
        "/api/boards",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
  });
});
