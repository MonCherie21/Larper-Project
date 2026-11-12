# Final design patch — Upcoming Events, club emblems and LSPU registration

This patch follows the merged PR #12 dashboard refresh. It does **not** reset
the database, alter role policies, or change existing student/organizer/admin
accounts.

## Design
- The Dashboard Upcoming Events feed now groups each day in a clearly outlined
  card with an indigo date header, event-count pill, and separated event rows.
- Seven **original illustrative** organization emblems are included under
  `my-react-app/public/org-logos/`. They are not official university seals.
  `organizations.logo_url` still takes precedence when the organization has
  an authorized official logo. Unknown organizations fall back to initials.
- No SQL updates or Storage uploads are required for these SVG files.

## New student email format

For **new self-registered student accounts**, the format is strictly:

`03xx-xxxx@lspu.edu.ph`

All six x positions are digits, with the leading `03` fixed. Example:
`0312-3456@lspu.edu.ph` (example only; not a real institution address).

The React signup form and `signUp()` client service validate this format,
and the database-side enforcement uses Supabase Auth's **Before User Created**
Postgres hook. Frontend checks are for feedback only and are **not** the security
boundary.

### Safe activation process

1. Run `supabase/patches/12_lspu_signup_hook.sql` in Supabase SQL Editor.
2. Optionally use the read-only SELECT examples at the end of that script
   to check expected allow/reject JSON responses.
3. In **Supabase Dashboard → Authentication → Hooks → Before User Created**,
   choose the Postgres function `public.hook_restrict_lspu_signup`, then enable.
4. In Supabase Auth settings, **enable email confirmation**. A matching string
   alone is not evidence that a person actually owns an LSPU account.
5. Test signup with a valid institutional address you control (should proceed
   through confirmation) and invalid public address (should be rejected).
6. Test existing demo account logins `alice@example.edu`,
   `bob@example.edu`, `cte.organizer@example.edu`, and
   `admin@example.edu`. These existing users are **not removed or blocked**.
7. Test organizer event creation and admin publication to confirm no regression.

**Caution:** Before User Created applies to all **future new accounts**,
including accounts an administrator creates from Supabase Auth. Existing
non-institutional demo users still sign in, but **new** external-email demo users
cannot be created while this hook is enabled. Plan future organizers/admins
using their institutional addresses or a separately reviewed invitation
exception. This avoids breaking the current project while restricting new
student registrations.

A Before User Created hook runs on account creation, not on subsequent
email-change flows. To guarantee continued institutional identity beyond
signup, audit email-change and invitation paths or adopt LSPU-managed SSO.
Do not claim this pattern proves current enrollment.

### Test and deploy

From `my-react-app`:

```sh
npm ci
npm run lint
npm run build
npm run dev
```

Check small/large screens; profile and organizer logo usage; public
organization logos override; no-organization initial fallback; event date
groups with multiple events on one date.

For Vercel, merge only after validation, then verify deployment of the updated
`main` branch. Supabase SQL/hook activation does not happen automatically
because of a GitHub merge.

## Additional PR #13 feedback refinements

- Removed the explanatory subtitle under **Student profile** (privacy access rules are unchanged).
- Recolored illustrative emblems to calmer, activity-appropriate flat palettes:
  CCS navy/steel blue, chess charcoal/wood, teacher education chalkboard green,
  cultural heritage terracotta, dance dusty rose, robotics muted teal, and
  varsity basketball orange/charcoal. No third-party or official logos copied.
- Updated the seeded CCS description to **College of Computer Science**.
  Existing Supabase data will not update on a GitHub merge:
  run `supabase/patches/13_ccs_description.sql` once in Supabase SQL Editor.

## Final profile and organization labels

- Admin accounts now see **Admin** as the profile heading; organizers see
  **Organizer profile**, and students retain **Student profile**.
- **CTE Test Organization** is renamed to **CTE**, with the exact description
  `College of Teachers Education`.
- The demo CTE emblem works for both the old and the new organization name.
- Run `supabase/patches/13_ccs_description.sql` for both CCS and CTE updates
  on an existing database. The script checks the test CTE owner's email and
  does not alter any organization ID, owner, associated events, or RSVPs.
