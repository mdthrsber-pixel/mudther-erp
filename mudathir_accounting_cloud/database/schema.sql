
create extension if not exists "uuid-ossp";

create table branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text,
  manager_name text,
  status text default 'active',
  created_at timestamptz default now()
);

create table users_profiles (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique,
  phone text,
  role text not null check (role in ('general_manager','branch_manager','accountant','data_entry')),
  branch_id uuid references branches(id) on delete set null,
  active boolean default true,
  created_at timestamptz default now()
);

create table daily_revenues (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  revenue_date date not null,
  cash numeric default 0,
  bank_transfer numeric default 0,
  pos_amount numeric default 0,
  booking_amount numeric default 0,
  notes text,
  created_by uuid references users_profiles(id),
  created_at timestamptz default now()
);

create table monthly_revenues (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  month integer not null,
  year integer not null,
  total_cash numeric default 0,
  total_bank numeric default 0,
  total_pos numeric default 0,
  total_booking numeric default 0,
  total_revenue numeric generated always as (total_cash + total_bank + total_pos + total_booking) stored,
  notes text,
  created_at timestamptz default now()
);

create table bank_transactions (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  transaction_date date not null,
  bank_name text,
  reference_no text,
  amount numeric not null default 0,
  transaction_type text check (transaction_type in ('deposit','withdrawal','transfer','fee')),
  notes text,
  created_at timestamptz default now()
);

create table pos_transactions (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  transaction_date date not null,
  device_name text,
  reference_no text,
  amount numeric not null default 0,
  settlement_status text default 'pending',
  notes text,
  created_at timestamptz default now()
);

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  expense_date date not null,
  category text not null,
  supplier text,
  amount numeric not null default 0,
  payment_method text,
  notes text,
  created_by uuid references users_profiles(id),
  created_at timestamptz default now()
);

create table reports (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) on delete cascade,
  report_month integer,
  report_year integer,
  revenue_total numeric default 0,
  expense_total numeric default 0,
  net_profit numeric generated always as (revenue_total - expense_total) stored,
  notes text,
  created_at timestamptz default now()
);

create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users_profiles(id),
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

insert into branches (name, city, manager_name) values
('الفرع الرئيسي', 'الرياض', 'مدير الفرع'),
('فرع السليمانية', 'الرياض', 'مدير السليمانية');

insert into users_profiles (full_name, email, phone, role)
values ('مدثر صابر', 'mdthrsber@gmail.com', '', 'general_manager');
