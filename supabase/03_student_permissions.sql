-- Feature 03: student-facing event discovery, RSVP and bookmarks.
-- Apply after schema.sql and 02b_security_fixes.sql.
-- This script DOES NOT create new tables or disable RLS.
-- Policies from Feature 02 still restrict which rows each user can access.

begin;

-- Read-only public discovery for approved events and public organizations.
-- The events SELECT policy hides unapproved events from anonymous visitors.
grant usage on schema public to anon, authenticated;
grant select on public.events, public.organizations to anon, authenticated;

-- Authenticated students can see only their own private profile via the
-- existing profiles_select_own_or_admin RLS policy.
grant select on public.profiles to authenticated;

-- RSVPs and bookmarks are private user records. Their existing RLS policies
-- restrict selection/insertion/deletion to the current user, subject to
-- approval checks for new RSVPs.
grant select, insert, delete on public.rsvps, public.bookmarks to authenticated;

-- This feature intentionally does NOT grant public writes or
-- student permission to approve events.
commit;
