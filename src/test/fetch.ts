import { vi } from "vite-plus/test";

export function installFetch() {
  const fetch = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(null, { status: 204 }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
