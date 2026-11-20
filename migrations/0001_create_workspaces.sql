create table workspaces (
  id text primary key,
  created_at integer not null,
  touched_at integer not null
) strict;

create index workspaces_by_created_at on workspaces (created_at);
create index workspaces_by_touched_at on workspaces (touched_at);

create table boards (
  workspace_id text not null references workspaces (id) on delete cascade,
  id text not null,
  name text not null,
  position integer not null,
  primary key (workspace_id, id)
) strict;

create table columns (
  workspace_id text not null,
  id text not null,
  board_id text not null,
  name text not null,
  position integer not null,
  primary key (workspace_id, id),
  foreign key (workspace_id, board_id)
    references boards (workspace_id, id) on delete cascade
) strict;

create index columns_by_board on columns (workspace_id, board_id);

create table tasks (
  workspace_id text not null,
  id text not null,
  column_id text not null,
  title text not null,
  description text not null,
  position integer not null,
  primary key (workspace_id, id),
  foreign key (workspace_id, column_id)
    references columns (workspace_id, id) on delete cascade
) strict;

create index tasks_by_column on tasks (workspace_id, column_id);

create table subtasks (
  workspace_id text not null,
  id text not null,
  task_id text not null,
  title text not null,
  is_completed integer not null check (is_completed in (0, 1)),
  position integer not null,
  primary key (workspace_id, id),
  foreign key (workspace_id, task_id)
    references tasks (workspace_id, id) on delete cascade
) strict;

create index subtasks_by_task on subtasks (workspace_id, task_id);
