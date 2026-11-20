import { seedBoards } from "@/data";
import {
  applyCommand,
  commandRequest,
  type Board,
  type BoardsResponse,
  type Command,
} from "@/lib";
import { describe, expect, it, vi } from "vite-plus/test";
import type { Env } from "./env";
import worker, * as entry from "./index";
import { DAILY_WORKSPACE_LIMIT, MAX_BODY_BYTES } from "./limits";
import { createSqliteDatabase } from "./sqlite-database";
import { DAY_MS, WORKSPACE_LIFETIME_MS, startOfUtcDay } from "./time";

const ORIGIN = "https://kanban.test";

type HeaderMap = Record<string, string>;
const SAME_ORIGIN = { "sec-fetch-site": "same-origin" };
const JSON_TYPE = { "content-type": "application/json" };
const COOKIE_ATTRIBUTES = "Path=/; Secure; HttpOnly; SameSite=Strict";
const NEW_COOKIE = new RegExp(
  `^__Host-kanban-ws=[\\da-f-]{36}; Max-Age=7776000; ${COOKIE_ATTRIBUTES}$`,
);

const TOGGLE: Command = {
  type: "setSubtaskCompleted",
  subtaskId: "seed-t1-s2",
  isCompleted: true,
};

const SEQUENCE: Command[] = [
  TOGGLE,
  { type: "moveTask", taskId: "seed-t1", columnId: "seed-b1-c2", index: 1 },
  { type: "moveTask", taskId: "seed-t8", columnId: "seed-b1-c2", index: 0 },
  {
    type: "updateTask",
    columnId: "seed-b1-c3",
    task: {
      id: "seed-t5",
      title: "Research pricing",
      description: "Compare three plans.",
      subtasks: [
        { id: "seed-t5-s3", title: "Talk to customers" },
        { id: "s-new", title: "Draft a table" },
      ],
    },
  },
  {
    type: "createTask",
    columnId: "seed-b2-c2",
    task: {
      id: "t-new",
      title: "Write the brief",
      description: "",
      subtasks: [{ id: "t-new-s1", title: "Outline" }],
    },
  },
  { type: "deleteTask", taskId: "seed-t3" },
  {
    type: "updateBoard",
    board: {
      id: "seed-b1",
      name: "Launch",
      columns: [
        { id: "seed-b1-c3", name: "Shipped" },
        { id: "seed-b1-c1", name: "Todo" },
        { id: "c-new", name: "Review" },
      ],
    },
  },
  newBoard("b-new", [{ id: "b-new-c1", name: "Open" }]),
  { type: "deleteBoard", boardId: "seed-b2" },
];

function newBoard(
  id: string,
  columns: { id: string; name: string }[] = [],
): Command {
  return { type: "createBoard", board: { id, name: id, columns } };
}

function limiter(success = true) {
  return { limit: vi.fn(async () => ({ success })) };
}

function setup({ writes = true, workspaces = true } = {}) {
  const sqlite = createSqliteDatabase();
  const env = {
    DB: sqlite.database,
    WRITE_LIMIT: limiter(writes),
    WORKSPACE_LIMIT: limiter(workspaces),
  } satisfies Env;
  return { sqlite, env, ...visitor(env), visitor: () => visitor(env) };
}

function visitor(env: Env) {
  let cookie = "";

  async function call(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (cookie) headers.set("cookie", cookie);
    const background: Promise<unknown>[] = [];
    const response = await worker.fetch(
      new Request(`${ORIGIN}${path}`, { ...init, headers }),
      env,
      { waitUntil: (promise) => background.push(promise) },
    );
    await Promise.all(background);

    const setCookie = response.headers.get("set-cookie");
    if (setCookie?.includes("Max-Age=0")) cookie = "";
    else if (setCookie) cookie = setCookie.split(";")[0];
    return response;
  }

  function send(command: Command, headers: HeaderMap = SAME_ORIGIN) {
    const { method, path, body } = commandRequest(command);
    return call(path, {
      method,
      headers: { ...JSON_TYPE, ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async function boards() {
    const response = await call("/api/boards");
    return (await response.json()) as BoardsResponse;
  }

  return {
    call,
    send,
    boards,
    workspaceId: () => cookie.split("=")[1],
    useCookie: (value: string) => {
      cookie = value;
    },
  };
}

function seedWorkspaces(
  api: ReturnType<typeof setup>,
  count: number,
  at: number,
) {
  for (let index = 0; index < count; index += 1) {
    api.sqlite.run(
      "insert into workspaces (id, created_at, touched_at) values (?1, ?2, ?2)",
      `w${index}`,
      at,
    );
  }
}

describe("the entry module", () => {
  it("exports nothing but the handler, since workerd runs every export", () => {
    expect(Object.keys(entry)).toEqual(["default"]);
  });
});

describe("GET /api/boards", () => {
  it("serves the seed to a new visitor without touching the database", async () => {
    const api = setup();
    const response = await api.call("/api/boards");

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({
      boards: seedBoards,
      hasWorkspace: false,
    });
    expect(api.sqlite.count("workspaces")).toBe(0);
  });

  it("serves a visitor's own boards and renews the cookie", async () => {
    const api = setup();
    await api.send(TOGGLE);
    const response = await api.call("/api/boards");

    expect(response.headers.get("set-cookie")).toBe(
      `__Host-kanban-ws=${api.workspaceId()}; Max-Age=7776000; ${COOKIE_ATTRIBUTES}`,
    );
    expect(await response.json()).toEqual({
      boards: applyCommand(seedBoards, TOGGLE),
      hasWorkspace: true,
    });
  });

  it("forgets a workspace that no longer exists", async () => {
    const api = setup();
    api.useCookie(`__Host-kanban-ws=${crypto.randomUUID()}`);
    const response = await api.call("/api/boards");

    expect(response.headers.get("set-cookie")).toBe(
      `__Host-kanban-ws=; Max-Age=0; ${COOKIE_ATTRIBUTES}`,
    );
    expect((await response.json()).hasWorkspace).toBe(false);
  });

  it.each([
    ["is not a uuid", "__Host-kanban-ws=not-a-uuid"],
    ["is upper case", `__Host-kanban-ws=${crypto.randomUUID().toUpperCase()}`],
    ["has another name", `kanban-ws=${crypto.randomUUID()}`],
  ])("ignores a cookie that %s", async (_, cookie) => {
    const api = setup();
    api.useCookie(cookie);
    const response = await api.call("/api/boards");

    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("finds the workspace cookie among others", async () => {
    const api = setup();
    await api.send(TOGGLE);
    api.useCookie(`theme=dark; __Host-kanban-ws=${api.workspaceId()}; a=1`);

    expect((await api.boards()).hasWorkspace).toBe(true);
  });

  it("marks a workspace as used at most once a day", async () => {
    const api = setup();
    await api.send(TOGGLE);
    const touchedAt = () =>
      api.sqlite.value("select touched_at from workspaces");

    const recently = Date.now() - 1000;
    api.sqlite.run("update workspaces set touched_at = ?1", recently);
    await api.boards();
    expect(touchedAt()).toBe(recently);

    const lastWeek = Date.now() - 7 * DAY_MS;
    api.sqlite.run("update workspaces set touched_at = ?1", lastWeek);
    await api.boards();
    expect(touchedAt()).toBeGreaterThan(Date.now() - DAY_MS);
  });
});

describe("the first write", () => {
  it("creates a workspace holding the seed plus the change", async () => {
    const api = setup();
    const response = await api.send(TOGGLE);

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toMatch(NEW_COOKIE);
    expect(await api.boards()).toEqual({
      boards: applyCommand(seedBoards, TOGGLE),
      hasWorkspace: true,
    });
    expect(api.sqlite.count("workspaces")).toBe(1);
  });

  it("creates nothing when the change is refused", async () => {
    const api = setup();
    const response = await api.send({ type: "deleteTask", taskId: "nope" });

    expect(response.status).toBe(404);
    expect(api.sqlite.count("workspaces")).toBe(0);
  });

  it("keeps the same workspace afterwards", async () => {
    const api = setup();
    await api.send(TOGGLE);
    const first = api.workspaceId();
    const response = await api.send({ ...TOGGLE, isCompleted: false });

    expect(response.headers.get("set-cookie")).toBe(
      `__Host-kanban-ws=${first}; Max-Age=7776000; ${COOKIE_ATTRIBUTES}`,
    );
    expect(api.sqlite.count("workspaces")).toBe(1);
  });

  it("gives each visitor their own workspace", async () => {
    const api = setup();
    const other = api.visitor();
    await api.send(TOGGLE);
    await other.send({ type: "deleteBoard", boardId: "seed-b3" });

    expect((await api.boards()).boards).toEqual(
      applyCommand(seedBoards, TOGGLE),
    );
    expect((await other.boards()).boards).toHaveLength(2);
  });

  it("is limited per visitor", async () => {
    const api = setup({ workspaces: false });
    const response = await api.send(TOGGLE, {
      ...SAME_ORIGIN,
      "cf-connecting-ip": "203.0.113.7",
    });

    expect(response.status).toBe(429);
    expect(api.env.WORKSPACE_LIMIT.limit).toHaveBeenCalledWith({
      key: "203.0.113.7",
    });
    expect(api.sqlite.count("workspaces")).toBe(0);
  });

  it("stops at the daily cap", async () => {
    const api = setup();
    seedWorkspaces(api, DAILY_WORKSPACE_LIMIT, Date.now());

    expect((await api.send(TOGGLE)).status).toBe(503);
    expect(api.sqlite.count("workspaces")).toBe(DAILY_WORKSPACE_LIMIT);
  });

  it.each([
    ["since midnight UTC", 0, 503],
    ["before midnight UTC", -1, 204],
  ])("counts workspaces created %s", async (_, offset, status) => {
    const api = setup();
    seedWorkspaces(
      api,
      DAILY_WORKSPACE_LIMIT,
      startOfUtcDay(Date.now()) + offset,
    );

    expect((await api.send(TOGGLE)).status).toBe(status);
  });
});

describe("writes", () => {
  it("store exactly what the shared reducer computes", async () => {
    const api = setup();
    let expected: Board[] = seedBoards;

    for (const command of SEQUENCE) {
      expected = applyCommand(expected, command);
      expect((await api.send(command)).status, command.type).toBe(204);
      expect((await api.boards()).boards, command.type).toEqual(expected);
    }
  });

  it("send only the statements a change needs", async () => {
    const api = setup();
    await api.send(TOGGLE);
    const batch = vi.spyOn(api.env.DB, "batch");
    await api.send({ ...TOGGLE, isCompleted: false });

    expect(batch.mock.calls.map(([statements]) => statements.length)).toEqual([
      5, 2,
    ]);
  });

  it("delete a board with everything in it", async () => {
    const api = setup();
    await api.send({ type: "deleteBoard", boardId: "seed-b2" });

    expect(api.sqlite.count("boards")).toBe(2);
    expect(api.sqlite.count("columns")).toBe(6);
    expect(api.sqlite.count("tasks")).toBe(19);
    expect(api.sqlite.count("subtasks")).toBe(41);
  });

  it("are limited per visitor", async () => {
    const api = setup({ writes: false });
    const response = await api.send(TOGGLE, {
      ...SAME_ORIGIN,
      "cf-connecting-ip": "203.0.113.7",
    });

    expect(response.status).toBe(429);
    expect(api.env.WRITE_LIMIT.limit).toHaveBeenCalledWith({
      key: "203.0.113.7",
    });
  });

  it("stop at the board limit", async () => {
    const api = setup();
    for (let index = seedBoards.length; index < 20; index += 1) {
      expect((await api.send(newBoard(`b${index}`))).status).toBe(204);
    }

    expect((await api.send(newBoard("b20"))).status).toBe(422);
    expect(api.sqlite.count("boards")).toBe(20);
  });

  it.each<[string, Command, number]>([
    ["a missing task", { type: "deleteTask", taskId: "nope" }, 404],
    ["a board id in use", newBoard("seed-b1"), 409],
    [
      "a column id in use",
      newBoard("b-new", [{ id: "seed-b1-c1", name: "A" }]),
      409,
    ],
  ])("refuse %s", async (_, command, status) => {
    const api = setup();
    await api.send(TOGGLE);
    const before = await api.boards();

    expect((await api.send(command)).status).toBe(status);
    expect(await api.boards()).toEqual(before);
  });
});

describe("request checks", () => {
  it.each<[string, HeaderMap, number]>([
    ["from another site", { "sec-fetch-site": "cross-site" }, 403],
    ["from a sibling site", { "sec-fetch-site": "same-site" }, 403],
    ["with a foreign origin", { origin: "https://evil.test" }, 403],
    ["with no origin", {}, 403],
    ["with this origin", { origin: ORIGIN }, 204],
  ])("handle a write %s", async (_, headers, status) => {
    const api = setup();
    expect((await api.send(TOGGLE, headers)).status).toBe(status);
  });

  it.each<[string, string, HeaderMap, string, number]>([
    ["an unknown path", "/api/columns", JSON_TYPE, "{}", 404],
    ["a body that isn't JSON", "/api/boards", {}, "{}", 415],
    ["broken JSON", "/api/boards", JSON_TYPE, "{", 400],
    ["a bad shape", "/api/boards", JSON_TYPE, "{}", 400],
  ])("answer %s", async (_, path, headers, body, status) => {
    const api = setup();
    const response = await api.call(path, {
      method: "POST",
      headers: { ...SAME_ORIGIN, ...headers },
      body,
    });

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuse a body that is too large", async () => {
    const api = setup();
    const headers = { ...SAME_ORIGIN, ...JSON_TYPE };
    const body = JSON.stringify({ name: "x".repeat(MAX_BODY_BYTES) });
    const declared = await api.call("/api/boards", {
      method: "POST",
      headers: { ...headers, "content-length": String(body.length) },
      body,
    });
    const undeclared = await api.call("/api/boards", {
      method: "POST",
      headers,
      body,
    });

    expect(declared.status).toBe(413);
    expect(undeclared.status).toBe(413);
  });

  it("refuse a body declared too large before reading it", async () => {
    const api = setup();
    const response = await api.call("/api/boards", {
      method: "POST",
      headers: {
        ...SAME_ORIGIN,
        ...JSON_TYPE,
        "content-length": String(MAX_BODY_BYTES + 1),
      },
      body: "{}",
    });

    expect(response.status).toBe(413);
  });

  it("hide an unexpected failure and log it", async () => {
    const api = setup();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    api.env.DB.batch = async () => {
      throw new Error("disk full");
    };
    api.useCookie(`__Host-kanban-ws=${crypto.randomUUID()}`);
    const response = await api.call("/api/boards");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Something went wrong." });
    expect(log).toHaveBeenCalledOnce();
  });
});

describe("the daily cleanup", () => {
  it("deletes workspaces untouched for 90 days with everything in them", async () => {
    const api = setup();
    const other = api.visitor();
    await api.send(TOGGLE);
    await other.send({ type: "deleteBoard", boardId: "seed-b2" });
    api.sqlite.run(
      "update workspaces set touched_at = ?1 where id = ?2",
      Date.now() - WORKSPACE_LIFETIME_MS - 1000,
      api.workspaceId(),
    );

    await worker.scheduled(undefined, api.env);

    expect(api.sqlite.count("workspaces")).toBe(1);
    expect(api.sqlite.count("subtasks")).toBe(41);
    expect((await other.boards()).hasWorkspace).toBe(true);
    expect((await api.boards()).hasWorkspace).toBe(false);
  });
});
