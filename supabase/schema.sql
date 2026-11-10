-- ============================================================================
-- Campus Activity & Discovery Platform
-- Feature 02 — Database & Supabase schema
-- Run this in the Supabase SQL Editor (or as a migration file).
-- Tables/indexes use IF NOT EXISTS so it's safe to re-run. Policies and
-- triggers are NOT idempotent — drop them first if you re-apply this file.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;

-- ---------- Enum types ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'organizer', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type approval_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

-- ============================================================================
-- 1. PROFILES — extends auth.users with app-specific fields
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'student',
  academic_program text,
  interests text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

-- Auto-create a profile row whenever a new auth user signs up.
-- Optional, but saves the frontend an extra insert call right after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================================
-- 2. ORGANIZATIONS
-- ============================================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  logo_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_organizations_owner on public.organizations(owner_id);

-- ============================================================================
-- 3. EVENTS
-- ============================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  poster_url text,
  approval_status approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint events_end_after_start check (end_time > start_time)
);

create index if not exists idx_events_org on public.events(organization_id);
create index if not exists idx_events_status on public.events(approval_status);
create index if not exists idx_events_start_time on public.events(start_time);

-- ============================================================================
-- 4. RSVPS
-- ============================================================================
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  registered_at timestamptz not null default now(),
  constraint uq_rsvp_user_event unique (user_id, event_id)
);

create index if not exists idx_rsvps_event on public.rsvps(event_id);

-- ============================================================================
-- 5. BOOKMARKS
-- ============================================================================
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_bookmark_user_event unique (user_id, event_id)
);

create index if not exists idx_bookmarks_event on public.bookmarks(event_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.bookmarks enable row level security;

-- Helper: is the current session an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- PROFILES policies ----------
-- Users read/update their own full profile; admins read everyone's.
-- No public policy here on purpose — "posted by" on an event can use
-- organizations.name instead, which is already public. See note below.
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- ---------- ORGANIZATIONS policies ----------
-- Org profiles are public — discovery is the whole point of the app.
create policy "organizations_select_all"
on public.organizations for select
using (true);

create policy "organizations_insert_own"
on public.organizations for insert
with check (owner_id = auth.uid());

create policy "organizations_update_own_or_admin"
on public.organizations for update
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

create policy "organizations_delete_own_or_admin"
on public.organizations for delete
using (owner_id = auth.uid() or public.is_admin());

-- ---------- EVENTS policies ----------
-- Everyone sees approved events; an org's owner sees all of their own
-- events regardless of status; admins see everything.
create policy "events_select_approved_or_own_or_admin"
on public.events for select
using (
  approval_status = 'approved'
  or public.is_admin()
  or exists (
    select 1 from public.organizations o
    where o.id = events.organization_id and o.owner_id = auth.uid()
  )
);

create policy "events_insert_own_org"
on public.events for insert
with check (
  exists (
    select 1 from public.organizations o
    where o.id = organization_id and o.owner_id = auth.uid()
  )
);

create policy "events_update_own_org_or_admin"
on public.events for update
using (
  public.is_admin()
  or exists (
    select 1 from public.organizations o
    where o.id = events.organization_id and o.owner_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.organizations o
    where o.id = events.organization_id and o.owner_id = auth.uid()
  )
);

create policy "events_delete_own_org_or_admin"
on public.events for delete
using (
  public.is_admin()
  or exists (
    select 1 from public.organizations o
    where o.id = events.organization_id and o.owner_id = auth.uid()
  )
);

-- RLS alone can't stop an organizer from slipping approval_status =
-- 'approved' into their own update request. This trigger closes that gap:
-- any change to approval_status made by a non-admin is silently reverted.
create or replace function public.protect_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.approval_status is distinct from old.approval_status then
    new.approval_status := old.approval_status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_events_protect_approval on public.events;
create trigger trg_events_protect_approval
before update on public.events
for each row execute function public.protect_approval_status();

-- ---------- RSVPS policies ----------
create policy "rsvps_select_own_or_org_or_admin"
on public.rsvps for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.events e
    join public.organizations o on o.id = e.organization_id
    where e.id = rsvps.event_id and o.owner_id = auth.uid()
  )
);

create policy "rsvps_insert_own"
on public.rsvps for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.approval_status = 'approved'
  )
);

create policy "rsvps_delete_own"
on public.rsvps for delete
using (user_id = auth.uid());

-- ---------- BOOKMARKS policies ----------
create policy "bookmarks_select_own"
on public.bookmarks for select
using (user_id = auth.uid());

create policy "bookmarks_insert_own"
on public.bookmarks for insert
with check (user_id = auth.uid());

create policy "bookmarks_delete_own"
on public.bookmarks for delete
using (user_id = auth.uid());