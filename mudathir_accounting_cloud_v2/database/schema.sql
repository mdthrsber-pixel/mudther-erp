
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

insert into branches (name, city, manager_name)
select 'الفرع الرئيسي', 'الرياض', 'مدير الفرع'
where not exists (select 1 from branches where name='الفرع الرئيسي');

insert into branches (name, city, manager_name)
select 'فرع السليمانية', 'الرياض', 'مدير السليمانية'
where not exists (select 1 from branches where name='فرع السليمانية');

insert into users_profiles (full_name, email, role)
select 'مدثر صابر', 'mdthrsber@gmail.com', 'general_manager'
where not exists (select 1 from users_profiles where email='mdthrsber@gmail.com');

-- ملاحظة: في النسخة القادمة نفعّل Row Level Security حسب المستخدم والفرع.
