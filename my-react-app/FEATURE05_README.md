# Feature 05 — Organizer Portal & Event Management

## Routes
- `/organizer` — organizer dashboard, status filters, RSVP counts, edit/delete
- `/organizer/events/new?org=<uuid>` — submit an event for an assigned organization
- `/organizer/events/<uuid>/edit` — edit an event belonging to an assigned organization
- `/sign-in` — **existing** login for all user roles; no new login screen

## Setup (do not skip SQL)
1. Create/check user accounts in Supabase Authentication. Organizer representatives must have `role = 'organizer'` in `public.profiles` and own an organization (`organizations.owner_id = profiles.id`). Do not permit role self-assignment.
2. Ensure `schema.sql`, `02b_security_fixes.sql`, and `03_student_permissions.sql` were previously run in the same Supabase project.
3. Run `supabase/05_organizer_portal.sql` in the SQL Editor. It grants authenticated event CRUD permissions, installs the updated approval trigger, and creates `event-posters` storage with restricted upload/delete policies. SQL changes are **not applied** by merging a PR.
4. Keep local `.env` configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (never use service-role/secret keys in Vite).
5. In `my-react-app`, run `npm install`, `npm run lint`, `npm run build`, and `npm run dev`.

## Test checklist
- Sign in as an assigned organizer; verify `/organizer` lists only events for organizations they own.
- Create an event with all required fields; ensure new event is `pending` and invisible to students.
- Upload a JPG/PNG/WebP poster up to 5MB; verify valid image loads on the public page **after approval**.
- Reject file types other than JPG/PNG/WebP or sizes above 5MB.
- Edit an existing approved event; verify it returns to `pending` and disappears from the public feed until reviewed again.
- Delete an event and verify the list updates; associated RSVPs are cascade-deleted.
- View RSVP counts for the organization's events.
- Verify student and anonymous accounts cannot create, edit, delete or upload an event poster.
- Verify an organizer cannot modify an event for an organization they don't own (test API operations, not only hidden links).
- Verify neither organizer nor an admin who owns the target organization can approve that organization's event.
- Verify correct error/empty/loading states, and test mobile screen width.

## Approval process
Events are **only submitted**, not approved, by organizers. The university conducts its official paperwork, venue/dean clearance and face-to-face approval *outside* the platform. Feature 06 will give independent admins a checklist to verify those records and then update the event to `approved` for publication. Status stays `pending` until this verification. Do not store private dean approval documents in the public `event-posters` bucket.

## Notes
- Form uses browser-local datetime inputs, converted to UTC for PostgreSQL `timestamptz`. Public pages format dates in Philippine time. Verify the test machine's timezone is correct.
- Edit/remove poster cleanup is best-effort. Existing external poster URLs are not deleted.
- The existing `owner_id` represents a single assigned organization owner. Supporting multiple representatives per organization would require a future membership/join table and matching RLS updates.
- No new npm packages were added.
