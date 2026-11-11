-- Campus Connect: Features 06 (admin), 07 (recommendations), 08 (engagement).
-- Run once AFTER schema.sql, 02b_security_fixes.sql, 03_student_permissions.sql,
-- 05_organizer_portal.sql and the Feature 05 storage ownership fix.
-- No new user-facing tables; no pre-existing event rows are altered.

begin;

-- Feature 06: only two publication clearances.
alter table public.events
  add column if not exists paperwork_verified boolean not null default false,
  add column if not exists dean_approved boolean not null default false,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Feature 07: optional preferences; program and comma-separated interests
-- already exist on public.profiles and are reused.
alter table public.profiles
  add column if not exists preferred_categories text[] not null default '{}'::text[],
  add column if not exists extracurricular_interests text[] not null default '{}'::text[];

-- Feature 06: ensure frontend and direct REST calls obey the SAME rules.
-- The existing Feature 05 approval trigger calls this function.
create or replace function public.protect_approval_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owns_org boolean := false;
  is_admin_user boolean := false;
  content_changed boolean := false;
  supplied_review_change boolean := false;
begin
  -- Trusted SQL Editor/server-side operations have no auth.uid().
  -- Never place a service-role key in the browser.
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from public.organizations o
    where o.owner_id = auth.uid()
      and o.id = new.organization_id
  ) into owns_org;
  is_admin_user := public.is_admin();

  if tg_op = 'INSERT' then
    if not is_admin_user or owns_org then
      if new.approval_status <> 'pending'
         or new.paperwork_verified or new.dean_approved
         or new.reviewed_by is not null or new.reviewed_at is not null
         or nullif(btrim(new.rejection_reason), '') is not null then
        raise exception 'Organizers can submit pending events only'
          using errcode = '42501';
      end if;
    end if;

    if new.approval_status = 'approved' then
      if not is_admin_user or owns_org
         or not new.paperwork_verified or not new.dean_approved then
        raise exception 'Administrator and both clearances required for approval'
          using errcode = '42501';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  -- Do not trust client-provided review stamps, even from administrators.
  if new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'Review audit fields cannot be set by the client'
      using errcode = '42501';
  end if;

  supplied_review_change :=
       new.approval_status is distinct from old.approval_status
    or new.paperwork_verified is distinct from old.paperwork_verified
    or new.dean_approved is distinct from old.dean_approved
    or new.rejection_reason is distinct from old.rejection_reason;

  if supplied_review_change and (not is_admin_user or owns_org) then
    raise exception 'Only an independent administrator may moderate this event'
      using errcode = '42501';
  end if;

  content_changed :=
       new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.category is distinct from old.category
    or new.location is distinct from old.location
    or new.start_time is distinct from old.start_time
    or new.end_time is distinct from old.end_time
    or new.poster_url is distinct from old.poster_url
    or new.organization_id is distinct from old.organization_id;

  if owns_org and new.organization_id is distinct from old.organization_id then
    raise exception 'An organizer cannot transfer an event to another organization'
      using errcode = '42501';
  end if;

  -- Editing event information re-submits it for moderation; existing
  -- checkmarks/decisions are no longer valid after substantive changes.
  if content_changed then
    if supplied_review_change and new.approval_status <> 'pending' then
      raise exception 'Modified event content must return to pending review'
        using errcode = '42501';
    end if;
    new.approval_status := 'pending';
    new.paperwork_verified := false;
    new.dean_approved := false;
    new.rejection_reason := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;

  if supplied_review_change then
    if new.approval_status = 'approved' then
      if not new.paperwork_verified or not new.dean_approved then
        raise exception 'Both paperworks and dean approval must be verified'
          using errcode = '23514';
      end if;
      new.rejection_reason := null;
    elsif new.approval_status = 'rejected' then
      if nullif(btrim(new.rejection_reason), '') is null then
        raise exception 'A rejection reason is required'
          using errcode = '23514';
      end if;
      new.paperwork_verified := false;
      new.dean_approved := false;
    else
      new.paperwork_verified := false;
      new.dean_approved := false;
      new.rejection_reason := null;
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;

  return new;
end;
$$;

-- Ensure the trigger exists regardless of Feature 05 installation order.
drop trigger if exists trg_events_protect_approval on public.events;
create trigger trg_events_protect_approval
before insert or update on public.events
for each row execute function public.protect_approval_status();

-- Feature 08: only approved event totals are public. Never expose
-- RSVP user IDs or email addresses to anonymous visitors.
create or replace function public.get_event_rsvp_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.rsvps r
  join public.events e on e.id = r.event_id
  where e.id = p_event_id
    and e.approval_status = 'approved';
$$;
revoke all on function public.get_event_rsvp_count(uuid) from public;
grant execute on function public.get_event_rsvp_count(uuid) to anon, authenticated;

-- Feature 08: only accept RSVPs for approved, not-yet-ended events.
-- Unique constraints on (user_id,event_id) already prevent duplicate RSVPs.
drop policy if exists "rsvps_insert_own" on public.rsvps;
create policy "rsvps_insert_own"
on public.rsvps for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.approval_status = 'approved'
      and e.end_time > now()
  )
);

-- Profiles remain private under their existing RLS policies.
grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.rsvps, public.bookmarks to authenticated;

commit;
