# Supabase setup (Feature 02 + Feature 04)

The SQL files here are for review and **manual execution** in the Supabase SQL Editor. Committing them to GitHub does **not** apply database changes.

## Setup order for a new Supabase project

1. Run `schema.sql` once. Do not blindly rerun it: some policies are not idempotent.
2. Run `02b_security_fixes.sql` to prevent role escalation and unauthorized event approvals, restrict organization creation, and create a public organizer display-name view.
3. Create test users via Supabase Authentication, then confirm the `profiles` rows exist.
4. Make a copy of `examples/seed.sql`, replace **all** ALICE_ID, BOB_ID, ADMIN_ID placeholders with real Auth UUIDs, and run once on a test project.
5. Make a copy of `examples/seed_04_organizations.sql`, replace ALICE_ID, then run to add extra sample organizations and events.

For an existing project, inspect actual tables, policies, and data **before** running anything. These sample files are not executable unchanged: they intentionally contain placeholders.

## Security notes

- The base schema is **not safe by itself** for application use until the fixes script is applied.
- The reviewed patch raises an error if a non-admin tries to update an account's role or set/change an event approval status.
- Only authenticated organizer/admin accounts may create organizations.
- `organization_organizers` is deliberately public and exposes only organization ID and owner display name. The view uses owner's rights to read names from otherwise-private profiles. Confirm those names are suitable for public display before applying.
- Never expose a service-role/secret key in a Vite `.env`; use the Supabase publishable key.
- Test RLS using real anonymous, student, organizer, and admin sessions. The SQL Editor alone cannot simulate the frontend user's permissions.

## Frontend

The organization queries live in `my-react-app/src/services/organizations.js` and use the single existing `src/lib/supabase.js` client. The directory route is `/organizations` and profile route is `/organizations/:id`. The service explicitly filters public events to approved status.
