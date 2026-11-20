import { WORKSPACE_LIFETIME_MS } from "./time";

const WORKSPACE_COOKIE = "__Host-kanban-ws";
const COOKIE_ATTRIBUTES = "Path=/; Secure; HttpOnly; SameSite=Strict";
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;

const ERRORS: Record<number, string> = {
  400: "Invalid request.",
  403: "Requests must come from this site.",
  404: "Not found.",
  409: "That id is already in use.",
  413: "Request too large.",
  415: "Send JSON.",
  422: "Limit reached.",
  429: "Too many requests. Try again in a minute.",
  500: "Something went wrong.",
  503: "No new workspaces until tomorrow.",
};

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(ERRORS[status]);
  }
}

export function fail(status: number): never {
  throw new HttpError(status);
}

export function failure(status: number) {
  return Response.json(
    { error: ERRORS[status] },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export function respond(body: unknown, cookie?: string) {
  const headers = new Headers({ "cache-control": "no-store" });
  if (cookie) headers.set("set-cookie", cookie);
  return body === undefined
    ? new Response(null, { status: 204, headers })
    : Response.json(body, { headers });
}

export function readWorkspaceId(request: Request) {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === WORKSPACE_COOKIE && UUID.test(value ?? "")) return value;
  }
  return undefined;
}

export function workspaceCookie(workspaceId: string) {
  const maxAge = WORKSPACE_LIFETIME_MS / 1000;
  return `${WORKSPACE_COOKIE}=${workspaceId}; Max-Age=${maxAge}; ${COOKIE_ATTRIBUTES}`;
}

export function expiredWorkspaceCookie() {
  return `${WORKSPACE_COOKIE}=; Max-Age=0; ${COOKIE_ATTRIBUTES}`;
}

export function isSameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  return request.headers.get("origin") === new URL(request.url).origin;
}

export function clientKey(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}
