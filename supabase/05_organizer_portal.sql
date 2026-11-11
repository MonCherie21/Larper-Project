-- FEATURE 05 — Organizer portal and event management.
-- Run after schema.sql, 02b_security_fixes.sql, and 03_student_permissions.sql.
-- Safe to rerun: function replacement and named storage policies are idempotent.
-- No existing event rows are modified.

begin;

-- PostgreSQL table permissions are separate from RLS. RLS from Feature 02
-- restricts event management to the owners of the linked organization.
grant select, insert, update, delete on public.events to authenticated;
grant select on public.organizations, public.profiles, public.rsvps to authenticated;

-- Keep event approval independent from organizer submissions.
-- After changes to a published/rejected event, it returns to pending review.
-- This function also blocks admins from approving events for organizations
-- they themselves own. The dean's actual authorization is verified offline.
create or replace function public.protect_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owns_event boolean;
  content_changed boolean;
begin
  -- Dashboard SQL editor / trusted administrative service operations.
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from public.organizations o
    where o.id in (new.organization_id, case when tg_op = 'UPDATE' then old.organization_id else new.organization_id end)
      and o.owner_id = auth.uid()
  ) into owns_event;

  if tg_op = 'INSERT' then
    if new.approval_status <> 'pending' and (owns_event or not public.is_admin()) then
      raise exception 'Organizer submissions must start as pending' using errcode = '42501';
    end if;
    return new;
  end if;

  -- A representative cannot choose an approval status, including when the
  -- representative happens to also have an administrator account.
  if owns_event then
    if new.approval_status is distinct from old.approval_status then
      raise exception 'An organizer cannot approve their own event' using errcode = '42501';
    end if;

    content_changed :=
         new.title           is distinct from old.title
      or new.description     is distinct from old.description
      or new.category        is distinct from old.category
      or new.location        is distinct from old.location
      or new.start_time      is distinct from old.start_time
      or new.end_time        is distinct from old.end_time
      or new.poster_url      is distinct from old.poster_url
      or new.organization_id is distinct from old.organization_id;

    if content_changed and old.approval_status <> 'pending' then
      new.approval_status := 'pending';
    end if;
    return new;
  end if;

  -- Only independent admins may change event approvals.
  if not public.is_admin() and new.approval_status is distinct from old.approval_status then
    raise exception 'Only authorized administrators may change event approval' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 02b already creates this trigger; do not add a duplicate trigger.
-- Replace it in case the database was initialized with an older version.
drop trigger if exists trg_events_protect_approval on public.events;
create trigger trg_events_protect_approval
before insert or update on public.events
for each row execute function public.protect_approval_status();

-- Public poster assets only. NEVER store private approvals or paperwork here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-posters', 'event-posters', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can view public event posters, but only an authenticated owner can
-- upload to or remove from their own organization's UUID folder.
drop policy if exists "event_posters_select_all" on storage.objects;
create policy "event_posters_select_all"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'event-posters');

drop policy if exists "event_posters_insert_own_org" on storage.objects;
create policy "event_posters_insert_own_org"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'event-posters'
  and exists (
    select 1 from public.organizations o
    where o.owner_id = auth.uid()
      and o.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "event_posters_delete_own_org_or_admin" on storage.objects;
drop policy if exists "event_posters_delete_own_org" on storage.objects;
create policy "event_posters_delete_own_org"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'event-posters'
  and exists (
    select 1 from public.organizations o
    where o.owner_id = auth.uid()
      and o.id::text = (storage.foldername(name))[1]
  )
);

commit;
