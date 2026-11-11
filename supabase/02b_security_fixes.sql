-- ============================================================================
-- Feature 02 - security fixes. Run AFTER schema.sql. Safe to re-run.
-- Replaces functions/triggers/policies and adds one view. No rows are changed.
--
-- Note: auth.uid() is NULL in the Supabase SQL Editor and for the service
-- role. The triggers below treat that as trusted (so seed.sql and manual
-- approvals from the dashboard work) and only restrict real signed-in users.
-- ============================================================================

-- 1) Block self-promotion.
-- The old "profiles_update_own" policy let any user run:
--   update profiles set role = 'admin' where id = auth.uid();
-- Now only admins can change a role (and admins can edit profiles in-app).
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and new.role is distinct from old.role then
    raise exception 'Changing account roles is not permitted' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_protect_role on public.profiles;
create trigger trg_profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- 2) Close the approval bypass.
-- The old trigger only ran on UPDATE, so an organizer could INSERT an event
-- with approval_status = 'approved'. Now non-admin inserts must be
-- 'pending' and non-admin status changes are rejected.
create or replace function public.protect_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.approval_status <> 'pending' then
      raise exception 'New events require approval' using errcode = '42501';
    end if;
  elsif new.approval_status is distinct from old.approval_status then
    raise exception 'Only admins may change event approval' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_events_protect_approval on public.events;
create trigger trg_events_protect_approval
before insert or update on public.events
for each row execute function public.protect_approval_status();

-- 3) Only organizers/admins can create organizations.
-- Previously any signed-in student could create one (and then submit events).
drop policy if exists "organizations_insert_own" on public.organizations;
create policy "organizations_insert_own"
on public.organizations for insert
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('organizer', 'admin')
  )
);

-- 4) Public organizer name for the organization profile page (Feature 04).
-- profiles is private under RLS, so students can't join to it. This view
-- exposes ONLY the organization id and the owner's full name (no email, no
-- role, no program). It runs with the view owner's rights on purpose, so
-- Supabase's linter may flag it as a "security definer view"; that's expected.
create or replace view public.organization_organizers as
select o.id as organization_id, p.full_name as organizer_name
from public.organizations o
join public.profiles p on p.id = o.owner_id;

grant select on public.organization_organizers to anon, authenticated;