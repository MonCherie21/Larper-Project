-- Feature 05 permanent poster owner-policy repair.
-- Apply AFTER supabase/05_organizer_portal.sql.
-- Do not disable RLS. Does not change existing events, files or ownership.
-- This replaces the temporary Alice-only test rule with a reusable,
-- folder-restricted owner check for every authenticated organizer.

begin;

-- Verify poster path ownership in a trusted helper, so the policy's
-- cross-table lookup does not depend on RLS behavior in the Storage context.
-- This schema is NOT an exposed Data API schema.
create schema if not exists private;

create or replace function private.is_event_poster_owner(object_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.organizations o
      where o.owner_id = auth.uid()
        and o.id::text = (storage.foldername(object_path))[1]
    );
$$;

revoke all on function private.is_event_poster_owner(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_event_poster_owner(text) to authenticated;

drop policy if exists "event_posters_insert_own_org" on storage.objects;
create policy "event_posters_insert_own_org"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-posters'
  and private.is_event_poster_owner(name)
);

drop policy if exists "event_posters_delete_own_org" on storage.objects;
create policy "event_posters_delete_own_org"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-posters'
  and private.is_event_poster_owner(name)
);

-- IMPORTANT: the successful Alice-only test policy is temporary.
-- Remove it only after creating the replacement policies above.
drop policy if exists "event_posters_debug_alice_ccs" on storage.objects;

commit;
