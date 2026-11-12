-- Final Campus Connect signup guard (post-Feature 08).
--
-- INSTRUCTIONS:
-- 1. Run this SQL through Supabase SQL Editor.
-- 2. In Authentication -> Hooks -> Before User Created, select
--    "Postgres" and function "public.hook_restrict_lspu_signup".
--    Enable it only after verifying it using the SELECT checks below.
--
-- This hook rejects NEW Supabase Auth account creation when the email does
-- not match 03xx-xxxx@lspu.edu.ph, with every x a decimal digit.
-- Existing Alice/Bob/Carla/admin demo logins are unaffected: the hook only
-- runs BEFORE a user is created; it does not run when a user signs in.
-- The format alone cannot prove student identity; keep email confirmation on.
--
-- IMPORTANT: once enabled, this hook also applies to newly created
-- organizer/admin/test accounts. They must use the same format unless a
-- separate, reviewed invitation exception is introduced. The SQL itself
-- will NOT activate the hook automatically, to protect the live demo.

begin;

create or replace function public.hook_restrict_lspu_signup(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $hook$
declare
  candidate text := lower(btrim(coalesce(event->'user'->>'email', '')));
begin
  if candidate ~ '^03[0-9]{2}-[0-9]{4}@lspu[.]edu[.]ph$' then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Use an LSPU student email in the form 03xx-xxxx@lspu.edu.ph.'
    )
  );
end;
$hook$;

revoke all on function public.hook_restrict_lspu_signup(jsonb)
  from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_restrict_lspu_signup(jsonb)
  to supabase_auth_admin;

commit;

-- Optional read-only sanity checks:
-- SELECT public.hook_restrict_lspu_signup(
--   '{"user":{"email":"0312-3456@lspu.edu.ph"}}'::jsonb
-- ) AS allowed;
--
-- SELECT public.hook_restrict_lspu_signup(
--   '{"user":{"email":"student@gmail.com"}}'::jsonb
-- ) AS rejected;
--
-- Both queries return JSON, not database updates.
