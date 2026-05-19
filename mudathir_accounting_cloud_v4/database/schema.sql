
create extension if not exists "uuid-ossp";

create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text,
  manager_name text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists users_profiles (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique,
  phone text,
  role text not null check (role in ('general_manager','branch_manager','accountant','data_entry')),
  branch_id uuid references branches(id) on delete set null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists daily_revenues (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  revenue_date date not null,
  cash numeric default 0,
  bank_transfer numeric default 0,
  pos_amount numeric default 0,
  booking_amount numeric default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  expense_date date not null,
  category text not null,
  supplier text,
  amount numeric not null default 0,
  payment_method text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists bank_transactions (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  transaction_date date not null,
  bank_name text,
  reference_no text,
  amount numeric default 0,
  transaction_type text check (transaction_type in ('deposit','withdrawal','transfer','fee')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists pos_transactions (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  transaction_date date not null,
  device_name text,
  reference_no text,
  amount numeric default 0,
  settlement_status text default 'pending',
  notes text,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

create or replace view monthly_summary as
select
  b.id as branch_id,
  b.name as branch_name,
  date_part('year', d.revenue_date)::int as year,
  date_part('month', d.revenue_date)::int as month,
  sum(coalesce(d.cash,0) + coalesce(d.bank_transfer,0) + coalesce(d.pos_amount,0) + coalesce(d.booking_amount,0)) as total_revenue
from branches b
left join daily_revenues d on d.branch_id = b.id
group by b.id, b.name, date_part('year', d.revenue_date), date_part('month', d.revenue_date);

alter table branches enable row level security;
alter table users_profiles enable row level security;
alter table daily_revenues enable row level security;
alter table expenses enable row level security;
alter table bank_transactions enable row level security;
alter table pos_transactions enable row level security;

create policy "public_read_branches" on branches for select using (true);
create policy "public_insert_branches" on branches for insert with check (true);
create policy "public_update_branches" on branches for update using (true);
create policy "public_delete_branches" on branches for delete using (true);

create policy "public_all_daily" on daily_revenues for all using (true) with check (true);
create policy "public_all_expenses" on expenses for all using (true) with check (true);
create policy "public_all_bank" on bank_transactions for all using (true) with check (true);
create policy "public_all_pos" on pos_transactions for all using (true) with check (true);
create policy "public_all_users" on users_profiles for all using (true) with check (true);
