# Supabase database setup and migrations

The SQL files here are for review and **manual execution** in the Supabase SQL Editor. Committing them to GitHub does **not** apply database changes.

## Setup order for a new Supabase project

1. Run `schema.sql` once. Do not blindly rerun it: some policies are not idempotent.
2. Run `02b_security_fixes.sql` to prevent role escalation and unauthorized event approvals, restrict organization creation, and create a public organizer display-name view.
3. Apply `03_student_permissions.sql` for public approved-event reads and signed-in participation grants.
4. Apply `05_organizer_portal.sql` for organizer event management and the `event-posters` bucket.
5. Apply `patches/05_fix_storage_owner_policy.sql` for the scoped poster ownership helper.
6. Apply `06_07_08_features.sql` for admin clearances, student preferences, and RSVP total functions.
7. Apply `patches/13_ccs_description.sql` **only if** you need the CCS description and CTE sample organization rename updated in an existing database.
8. To restrict future Auth registration to LSPU-pattern emails, run `patches/12_lspu_signup_hook.sql` and **separately enable** `public.hook_restrict_lspu_signup` under Supabase **Authentication → Hooks → Before User Created**. Confirm institutional-email ownership before relying on the restriction.
9. Optionally create test users in Supabase Authentication and confirm the `profiles` rows exist. If using non-institutional demo addresses, do this **before** activating the Auth creation hook.
10. For a test database only, copy `examples/seed.sql`, replace the sample Auth UUID placeholders, and run once.
11. For a test database only, copy `examples/seed_04_organizations.sql`, replace placeholders, and run to add sample organizations/events.

**The team has reported the earlier feature migrations applied to the Campus Connect live database. PR #13 added optional, follow-up SQL scripts; merging GitHub code does not prove they have been run or that the signup hook was activated. Do not rerun the schema or reload seed scripts just to update documentation.** For any existing project, inspect actual tables, policies, and data **before** running anything. These sample files are not executable unchanged: they intentionally contain placeholders.

## Security notes

- The base schema is **not safe by itself** for application use until the fixes script is applied.
- The reviewed patch raises an error if a non-admin tries to update an account's role or set/change an event approval status.
- Only authenticated organizer/admin accounts may create organizations.
- `organization_organizers` is deliberately public and exposes only organization ID and owner display name. The view uses owner's rights to read names from otherwise-private profiles. Confirm those names are suitable for public display before applying.
- Never expose a service-role/secret key in a Vite `.env`; use the Supabase publishable key.
- The new registration hook affects **new account creation** only when manually enabled, including new organizers/admins; existing test accounts remain valid. Email pattern checking is not university enrollment verification, and email-change paths need separate controls for stronger assurance.
- Test RLS using real anonymous, student, organizer, and admin sessions. The SQL Editor alone cannot simulate the frontend user's permissions.

## Frontend

The organization queries live in `my-react-app/src/services/organizations.js` and use the single existing `src/lib/supabase.js` client. The directory route is `/organizations` and profile route is `/organizations/:id`. The service explicitly filters public events to approved status.
