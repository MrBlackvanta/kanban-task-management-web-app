import type { Database, Statement } from "./env";
import {
  TABLES,
  type BoardRow,
  type Changes,
  type ColumnRow,
  type Rows,
  type SubtaskRow,
  type Table,
  type TaskRow,
} from "./rows";
import { DAY_MS } from "./time";

const FIELDS: Record<Table, Record<string, string>> = {
  boards: { name: "name", position: "position" },
  columns: { board_id: "boardId", name: "name", position: "position" },
  tasks: {
    column_id: "columnId",
    title: "title",
    description: "description",
    position: "position",
  },
  subtasks: {
    task_id: "taskId",
    title: "title",
    is_completed: "isCompleted",
    position: "position",
  },
};

type StoredSubtask = Omit<SubtaskRow, "isCompleted"> & { isCompleted: number };

export async function loadRows(
  db: Database,
  workspaceId: string,
): Promise<Rows | undefined> {
  const [workspace, boards, columns, tasks, subtasks] = await db.batch([
    db.prepare("select id from workspaces where id = ?1").bind(workspaceId),
    ...TABLES.map((table) => db.prepare(selectSql(table)).bind(workspaceId)),
  ]);
  if (workspace.results.length === 0) return undefined;

  return {
    boards: boards.results as BoardRow[],
    columns: columns.results as ColumnRow[],
    tasks: tasks.results as TaskRow[],
    subtasks: (subtasks.results as StoredSubtask[]).map((row) => ({
      ...row,
      isCompleted: row.isCompleted === 1,
    })),
  };
}

export async function createWorkspace(
  db: Database,
  workspaceId: string,
  changes: Changes,
  now: number,
) {
  await db.batch([
    db
      .prepare(
        "insert into workspaces (id, created_at, touched_at) values (?1, ?2, ?2)",
      )
      .bind(workspaceId, now),
    ...writeStatements(db, workspaceId, changes),
  ]);
}

export async function updateWorkspace(
  db: Database,
  workspaceId: string,
  changes: Changes,
  now: number,
) {
  await db.batch([
    db
      .prepare("update workspaces set touched_at = ?2 where id = ?1")
      .bind(workspaceId, now),
    ...writeStatements(db, workspaceId, changes),
  ]);
}

export async function touchWorkspace(
  db: Database,
  workspaceId: string,
  now: number,
) {
  await db
    .prepare(
      "update workspaces set touched_at = ?2 where id = ?1 and touched_at < ?3",
    )
    .bind(workspaceId, now, now - DAY_MS)
    .run();
}

export async function countWorkspacesSince(db: Database, since: number) {
  const { results } = await db
    .prepare("select count(*) as total from workspaces where created_at >= ?1")
    .bind(since)
    .all<{ total: number }>();
  return results[0]?.total ?? 0;
}

export async function deleteWorkspacesUntouchedSince(
  db: Database,
  since: number,
) {
  await db
    .prepare("delete from workspaces where touched_at < ?1")
    .bind(since)
    .run();
}

function writeStatements(
  db: Database,
  workspaceId: string,
  changes: Changes,
): Statement[] {
  const statements: Statement[] = [];
  function add(sql: string, items: unknown[]) {
    if (items.length === 0) return;
    statements.push(db.prepare(sql).bind(workspaceId, JSON.stringify(items)));
  }

  for (const table of TABLES) add(insertSql(table), changes[table].inserts);
  for (const table of TABLES) add(updateSql(table), changes[table].updates);
  for (const table of TABLES) add(deleteSql(table), changes[table].deletes);
  return statements;
}

function selectSql(table: Table) {
  const fields = Object.entries(FIELDS[table]).map(
    ([column, key]) => `${column} as ${key}`,
  );
  return `select id, ${fields.join(", ")} from ${table} where workspace_id = ?1 order by position, id`;
}

function insertSql(table: Table) {
  const columns = Object.keys(FIELDS[table]);
  const values = Object.values(FIELDS[table]).map(
    (key) => `item.value ->> '${key}'`,
  );
  return `insert into ${table} (workspace_id, id, ${columns.join(", ")}) select ?1, item.value ->> 'id', ${values.join(", ")} from json_each(?2) as item`;
}

function updateSql(table: Table) {
  const assignments = Object.entries(FIELDS[table]).map(
    ([column, key]) => `${column} = item.value ->> '${key}'`,
  );
  return `update ${table} set ${assignments.join(", ")} from json_each(?2) as item where ${table}.workspace_id = ?1 and ${table}.id = item.value ->> 'id'`;
}

function deleteSql(table: Table) {
  return `delete from ${table} where workspace_id = ?1 and id in (select value from json_each(?2))`;
}
