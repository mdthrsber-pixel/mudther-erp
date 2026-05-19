
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_name text,
  action text,
  table_name text,
  details jsonb,
  created_at timestamptz default now()
);
