-- ============================================================
-- VANTAGE ROOFING — FULL SCHEMA
-- Drop everything and recreate clean.
-- Run in Supabase SQL editor. Safe to re-run on a fresh project.
-- ============================================================


-- ------------------------------------------------------------
-- 1. DROP EXISTING OBJECTS (clean slate)
-- ------------------------------------------------------------

drop view if exists jobs_with_calculations;

drop trigger if exists set_updated_at on jobs;

drop table if exists jobs cascade;
drop table if exists work_types cascade;
drop table if exists divisions cascade;
drop table if exists profiles cascade;

drop function if exists handle_updated_at();
drop function if exists is_active_user();
drop function if exists is_manager_or_owner();

-- ------------------------------------------------------------
-- 2. PROFILES
-- Must exist before jobs since jobs FK → profiles
-- ------------------------------------------------------------

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text unique,
  role        text not null default 'employee',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 3. DIVISIONS
-- ------------------------------------------------------------

create table divisions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

insert into divisions (name, is_default) values
  ('T',   false),
  ('R',   false),
  ('C',   false),
  ('N/A', true);


-- ------------------------------------------------------------
-- 4. WORK TYPES
-- ------------------------------------------------------------

create table work_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

insert into work_types (name, is_default) values
  ('Inspection',    false),
  ('Repair',        false),
  ('RR_Vista',      false),
  ('RR_Torch On',   false),
  ('RR_Windsor',    false),
  ('RR_Cambridge',  false),
  ('RR_Metal',      false),
  ('NR_Vista',      false),
  ('NR_Torch On',   false),
  ('NR_Windsor',    false),
  ('NR_Cambridge',  false),
  ('NR_Metal',      false),
  ('Skylight(s)',   false),
  ('Gutters',       false),
  ('Misc',          false),
  ('RR_Legacy',     false),
  ('TPO',           false),
  ('Composite',     false),
  ('Cedar',         false),
  ('Maintenance',   false),
  ('RR_CTD',        false),
  ('Unclassified',  true);


-- ------------------------------------------------------------
-- 5. JOBS
-- ------------------------------------------------------------

create table jobs (
  id              uuid primary key default gen_random_uuid(),
  job_address     text not null,
  division_id     uuid not null references divisions(id),
  month_quoted    date,
  month_sold      date,
  sold            boolean not null default false,
  work_type_id    uuid not null references work_types(id),
  salesperson_id  uuid not null references profiles(id),
  squares         decimal(10,2) not null default 0,
  days            decimal(10,2) not null default 0,
  materials       decimal(12,2) not null default 0,
  labour          decimal(12,2) not null default 0,
  disposal        decimal(12,2) not null default 0,
  warranty        decimal(12,2) not null default 0,
  other           decimal(12,2) not null default 0,
  gutters         decimal(12,2) not null default 0,
  sales_price     decimal(12,2) not null default 0,
  date_entered    timestamptz not null default now(),
  entered_by      uuid not null references profiles(id),
  updated_at      timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 6. UPDATED_AT TRIGGER
-- Automatically stamps updated_at on every row edit.
-- ------------------------------------------------------------

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on jobs
  for each row
  execute function handle_updated_at();


-- ------------------------------------------------------------
-- 7. JOBS_WITH_CALCULATIONS VIEW
-- Always query this instead of the raw jobs table.
-- NULLIF guards on days prevent divide-by-zero.
-- security_invoker = true means RLS still applies through the view.
-- ------------------------------------------------------------

create or replace view jobs_with_calculations
with (security_invoker = true)
as
select
  j.id,
  j.job_address,
  j.division_id,
  d.name                                            as division_name,
  j.work_type_id,
  wt.name                                           as work_type_name,
  j.month_quoted,
  j.month_sold,
  j.sold,
  j.salesperson_id,
  sp.full_name                                      as salesperson_name,
  j.squares,
  j.days,
  j.materials,
  j.labour,
  j.disposal,
  j.warranty,
  j.other,
  j.gutters,
  j.sales_price,
  j.date_entered,
  j.entered_by,
  eb.full_name                                      as entered_by_name,
  j.updated_at,

  -- Calculated fields
  (j.materials + j.labour + j.disposal + j.warranty + j.other + j.gutters)
                                                    as total_job_cost,

  case
    when j.sales_price = 0 then null
    else round(
      ((j.materials + j.labour + j.disposal + j.warranty + j.other + j.gutters)
        / j.sales_price) * 100, 2)
  end                                               as total_cost_percent,

  (j.sales_price - (j.materials + j.labour + j.disposal + j.warranty + j.other + j.gutters))
                                                    as mgn,

  case
    when j.squares = 0 then null
    else round(j.sales_price / j.squares, 2)
  end                                               as dollar_per_square,

  case
    when j.days = 0 then null
    else round(
      (j.sales_price - (j.materials + j.labour + j.disposal + j.warranty + j.other + j.gutters))
        / j.days, 2)
  end                                               as mgn_per_day,

  case
    when j.days = 0 then null
    else round(j.labour / j.days, 2)
  end                                               as ee_mgn_per_day

from jobs j
  left join divisions  d  on j.division_id    = d.id
  left join work_types wt on j.work_type_id   = wt.id
  left join profiles   sp on j.salesperson_id = sp.id
  left join profiles   eb on j.entered_by     = eb.id;


-- ------------------------------------------------------------
-- 8. RLS HELPER FUNCTIONS
-- ------------------------------------------------------------

create or replace function is_active_user()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and is_active = true
  );
$$ language sql security definer;

create or replace function is_manager()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and is_active = true
    and role='manager'
  );
$$ language sql security definer;

create or replace function is_owner()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and is_active = true
    and role='owner'
  );
$$ language sql security definer;

create or replace function is_manager_or_owner()
returns boolean as $$
  select is_manager() or is_owner();
$$ language sql security definer;


-- ------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- ------------------------------------------------------------

-- profiles --
alter table profiles enable row level security;

create policy "Active users can read all profiles"
  on profiles for select
  using (is_active_user());

create policy "Owners can update profiles"
  on profiles for update
  using (is_owner());

create policy "Auth callback can insert profiles"
  on profiles for insert
  with check (id = auth.uid());

-- divisions --
alter table divisions enable row level security;

create policy "Authenticated users can read divisions"
  on divisions for select
  using (is_active_user());

create policy "Owners can insert divisions"
  on divisions for insert
  with check (is_owner());

create policy "Owners can delete divisions"
  on divisions for delete
  using (is_owner());

-- work_types --
alter table work_types enable row level security;

create policy "Authenticated users can read work types"
  on work_types for select
  using (is_active_user());

create policy "Owners can insert work types"
  on work_types for insert
  with check (is_owner());

create policy "Owners can delete work types"
  on work_types for delete
  using (is_owner());

-- jobs --
alter table jobs enable row level security;

create policy "Active users can read jobs"
  on jobs for select
  using (is_active_user());

create policy "Active users can insert jobs"
  on jobs for insert
  with check (is_active_user());

create policy "Users can update own jobs, managers and owners can update any"
  on jobs for update
  using (
    is_active_user()
    and (salesperson_id = auth.uid() or is_manager_or_owner())
  );

create policy "Users can delete own jobs, managers and owners can delete any"
  on jobs for delete
  using (
    is_active_user()
    and (salesperson_id = auth.uid() or is_manager_or_owner())
  );