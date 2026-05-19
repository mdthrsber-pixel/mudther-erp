create table if not exists app_snapshots (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table app_snapshots enable row level security;

drop policy if exists "app_snapshots_select" on app_snapshots;
drop policy if exists "app_snapshots_insert" on app_snapshots;
drop policy if exists "app_snapshots_update" on app_snapshots;

create policy "app_snapshots_select"
on app_snapshots for select
to anon
using (true);

create policy "app_snapshots_insert"
on app_snapshots for insert
to anon
with check (true);

create policy "app_snapshots_update"
on app_snapshots for update
to anon
using (true)
with check (true);
