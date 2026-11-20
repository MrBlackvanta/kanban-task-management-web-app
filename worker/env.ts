export type Statement = {
  bind(...values: (string | number)[]): Statement;
  all<Row = unknown>(): Promise<{ results: Row[] }>;
  run(): Promise<unknown>;
};

export type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<{ results: unknown[] }[]>;
};

export type RateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export type Env = {
  DB: Database;
  WRITE_LIMIT: RateLimiter;
  WORKSPACE_LIMIT: RateLimiter;
};

export type Context = { waitUntil(promise: Promise<unknown>): void };
