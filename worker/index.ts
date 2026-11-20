import { seedBoards } from "../src/data/seed";
import { BOARDS_PATH, routeCommand, type BoardsResponse } from "../src/lib/api";
import { applyCommand } from "../src/lib/commands";
import type { Command } from "../src/lib/types";
import { exceedsLimits, findProblem } from "./checks";
import type { Context, Env, RateLimiter } from "./env";
import {
  HttpError,
  clientKey,
  expiredWorkspaceCookie,
  fail,
  failure,
  isSameOrigin,
  readWorkspaceId,
  respond,
  workspaceCookie,
} from "./http";
import { DAILY_WORKSPACE_LIMIT, MAX_BODY_BYTES } from "./limits";
import { NO_ROWS, diffRows, hasDuplicateIds, toBoards, toRows } from "./rows";
import { WORKSPACE_LIFETIME_MS, startOfUtcDay } from "./time";
import {
  countWorkspacesSince,
  createWorkspace,
  deleteWorkspacesUntouchedSince,
  loadRows,
  touchWorkspace,
  updateWorkspace,
} from "./workspaces";

const PROBLEM_STATUS = { missing: 404, taken: 409 } as const;

type Worker = {
  fetch(request: Request, env: Env, context: Context): Promise<Response>;
  scheduled(controller: unknown, env: Env): Promise<void>;
};

export default {
  async fetch(request, env, context) {
    try {
      return await route(request, env, context);
    } catch (error) {
      if (error instanceof HttpError) return failure(error.status);
      console.error(error);
      return failure(500);
    }
  },
  async scheduled(_controller, env) {
    const since = Date.now() - WORKSPACE_LIFETIME_MS;
    await deleteWorkspacesUntouchedSince(env.DB, since);
  },
} satisfies Worker;

async function route(request: Request, env: Env, context: Context) {
  const { pathname } = new URL(request.url);
  if (request.method === "GET" && pathname === BOARDS_PATH) {
    return readBoards(request, env, context);
  }

  const parse = routeCommand(request.method, pathname) ?? fail(404);
  if (!isSameOrigin(request)) fail(403);
  const command = parse(await readBody(request)) ?? fail(400);
  return write(request, env, command);
}

async function readBoards(request: Request, env: Env, context: Context) {
  const workspaceId = readWorkspaceId(request);
  const rows = workspaceId && (await loadRows(env.DB, workspaceId));
  if (!workspaceId || !rows) {
    const body: BoardsResponse = { boards: seedBoards, hasWorkspace: false };
    return respond(body, workspaceId && expiredWorkspaceCookie());
  }

  context.waitUntil(touchWorkspace(env.DB, workspaceId, Date.now()));
  const body: BoardsResponse = { boards: toBoards(rows), hasWorkspace: true };
  return respond(body, workspaceCookie(workspaceId));
}

async function write(request: Request, env: Env, command: Command) {
  const key = clientKey(request);
  await ensureAllowed(env.WRITE_LIMIT, key);

  const workspaceId = readWorkspaceId(request);
  const stored = workspaceId && (await loadRows(env.DB, workspaceId));
  const before = stored ? toBoards(stored) : seedBoards;
  const problem = findProblem(before, command);
  if (problem) fail(PROBLEM_STATUS[problem]);

  const updated = applyCommand(before, command);
  if (exceedsLimits(updated)) fail(422);
  const after = toRows(updated);
  if (hasDuplicateIds(after)) fail(409);

  const now = Date.now();
  if (workspaceId && stored) {
    await updateWorkspace(env.DB, workspaceId, diffRows(stored, after), now);
    return respond(undefined, workspaceCookie(workspaceId));
  }

  await ensureAllowed(env.WORKSPACE_LIMIT, key);
  const createdToday = await countWorkspacesSince(env.DB, startOfUtcDay(now));
  if (createdToday >= DAILY_WORKSPACE_LIMIT) fail(503);

  const newId = crypto.randomUUID();
  await createWorkspace(env.DB, newId, diffRows(NO_ROWS, after), now);
  return respond(undefined, workspaceCookie(newId));
}

async function readBody(request: Request): Promise<unknown> {
  if (request.method === "DELETE") return undefined;
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("application/json")) fail(415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    fail(413);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) fail(413);
  try {
    return JSON.parse(text);
  } catch {
    return fail(400);
  }
}

async function ensureAllowed(limiter: RateLimiter, key: string) {
  const { success } = await limiter.limit({ key });
  if (!success) fail(429);
}
