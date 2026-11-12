-- PR #13 follow-up: update the existing CCS display description only.
-- Safe for repeated execution; no changes to event IDs, approvals or accounts.
update public.organizations
set description = 'Official student council of the College of Computer Science.'
where id = 'a1111111-1111-1111-1111-111111111111'::uuid
  and name = 'CCS';

-- Confirm the result:
select id, name, description
from public.organizations
where id = 'a1111111-1111-1111-1111-111111111111'::uuid;

-- Rename the existing CTE test organization without changing its ID or owner.
-- Limited to the test organizer account and the exact former organization name.
update public.organizations
set name = 'CTE',
    description = 'College of Teachers Education'
where name = 'CTE Test Organization'
  and owner_id = (
    select id from auth.users
    where email = 'cte.organizer@example.edu'
  );

-- Check both records after applying:
select id, name, description
from public.organizations
where id = 'a1111111-1111-1111-1111-111111111111'::uuid
   or name = 'CTE';
