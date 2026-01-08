create extension if not exists "pgcrypto";

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Crew',
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  start_time time not null,
  end_time time not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.availabilities (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  day date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint assignments_one_employee_per_shift unique (shift_id)
);

create index if not exists idx_shifts_day on public.shifts(day);
create index if not exists idx_avail_day on public.availabilities(day);
create index if not exists idx_avail_employee on public.availabilities(employee_id);

alter table public.employees enable row level security;
alter table public.shifts enable row level security;
alter table public.availabilities enable row level security;
alter table public.assignments enable row level security;

create policy "employees_all_authenticated"
on public.employees for all
to authenticated
using (true)
with check (true);

create policy "shifts_all_authenticated"
on public.shifts for all
to authenticated
using (true)
with check (true);

create policy "availabilities_all_authenticated"
on public.availabilities for all
to authenticated
using (true)
with check (true);

create policy "assignments_all_authenticated"
on public.assignments for all
to authenticated
using (true)
with check (true);
