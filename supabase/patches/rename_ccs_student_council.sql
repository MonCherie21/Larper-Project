-- Display name update only: existing seeded CCS organization.
-- Apply once in Supabase SQL Editor; safe to rerun.
-- Does not touch event records, memberships, roles, or the organization ID.
update public.organizations
set name = 'CCS'
where name = 'CCS Student Council';

-- Confirm the new display name:
select id, name, description
from public.organizations
where name = 'CCS';
