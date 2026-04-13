create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  role_type text not null check (role_type in ('youth-program-operator', 'ngo-nonprofit', 'school-university', 'startup-builder', 'government-policy', 'funder-donor', 'other')),
  focus_area text not null check (focus_area in ('entrepreneurship', 'education', 'employment', 'peacebuilding-civic-engagement', 'technology-innovation', 'other')),
  primary_constraint text not null check (primary_constraint in ('funding', 'execution-capacity', 'engagement', 'institutional-support', 'training-skills', 'other')),
  organization_name text not null default '',
  organization_description text not null default '',
  estimated_reach bigint not null default 0,
  contact text,
  created_at timestamptz not null default now()
);

alter table public.entries enable row level security;

drop policy if exists "Allow anonymous inserts" on public.entries;

create policy "Allow anonymous inserts"
on public.entries
for insert
to anon
with check (true);

drop policy if exists "Allow anonymous reads" on public.entries;

create policy "Allow anonymous reads"
on public.entries
for select
to anon
using (true);
