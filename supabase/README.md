# Supabase database setup and migrations

The SQL files here are for review and **manual execution** in the Supabase SQL Editor. Committing them to GitHub does **not** apply database changes.

## Setup order for a new Supabase project

1. Run `schema.sql` once. Do not blindly rerun it: some policies are not idempotent.
2. Run `02b_security_fixes.sql` to prevent role escalation and unauthorized event approvals, restrict organization creation, and create a public organizer display-name view.
3. Apply `03_student_permissions.sql` for public approved-event reads and signed-in participation grants.
4. Apply `05_organizer_portal.sql` for organizer event management and the `event-posters` bucket.
5. Apply `patches/05_fix_storage_owner_policy.sql` for the scoped poster ownership helper.
6. Apply `06_07_08_features.sql` for admin clearances, student preferences, and RSVP total functions.
7. Optionally create test users in Supabase Authentication and confirm the `profiles` rows exist.
8. For a test database only, copy `examples/seed.sql`, replace the sample Auth UUID placeholders, and run once.
9. For a test database only, copy `examples/seed_04_organizations.sql`, replace placeholders, and run to add sample organizations/events.

**The existing Campus Connect production database already has its migrations applied. Do not rerun the schema or reload seed scripts just to update documentation.** For any existing project, inspect actual tables, policies, and data **before** running anything. These sample files are not executable unchanged: they intentionally contain placeholders.

## Security notes

- The base schema is **not safe by itself** for application use until the fixes script is applied.
- The reviewed patch raises an error if a non-admin tries to update an account's role or set/change an event approval status.
- Only authenticated organizer/admin accounts may create organizations.
- `organization_organizers` is deliberately public and exposes only organization ID and owner display name. The view uses owner's rights to read names from otherwise-private profiles. Confirm those names are suitable for public display before applying.
- Never expose a service-role/secret key in a Vite `.env`; use the Supabase publishable key.
- Test RLS using real anonymous, student, organizer, and admin sessions. The SQL Editor alone cannot simulate the frontend user's permissions.

## Frontend

The organization queries live in `my-react-app/src/services/organizations.js` and use the single existing `src/lib/supabase.js` client. The directory route is `/organizations` and profile route is `/organizations/:id`. The service explicitly filters public events to approved status.
