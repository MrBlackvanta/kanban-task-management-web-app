import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Database, Statement } from "./env";

const MIGRATIONS = join(import.meta.dirname, "..", "migrations");

export function createSqliteDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("pragma foreign_keys = on");
  for (const file of readdirSync(MIGRATIONS).toSorted()) {
    sqlite.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }

  function statement(query: string, values: (string | number)[]): Statement {
    return {
      bind: (...next) => statement(query, next),
      all: async <Row>() => ({
        results: sqlite.prepare(query).all(...values) as Row[],
      }),
      run: async () => sqlite.prepare(query).run(...values),
    };
  }

  const database: Database = {
    prepare: (query) => statement(query, []),
    async batch(statements) {
      sqlite.exec("begin");
      try {
        const results = [];
        for (const item of statements) results.push(await item.all());
        sqlite.exec("commit");
        return results;
      } catch (error) {
        sqlite.exec("rollback");
        throw error;
      }
    },
  };

  function value(query: string) {
    const row = sqlite.prepare(query).get();
    return row ? Number(Object.values(row)[0]) : undefined;
  }

  return {
    database,
    value,
    count: (table: string) => value(`select count(*) from ${table}`),
    run: (query: string, ...values: (string | number)[]) => {
      sqlite.prepare(query).run(...values);
    },
  };
}
