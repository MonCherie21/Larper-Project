# Feature 03 — Student dashboard & event discovery

This feature builds upon Feature 01, Feature 02 and the organization components of Feature 04.

## What it adds
- Featured upcoming approved events (prefers records with posters) and chronologically ordered upcoming events
- Event search by title, description, category, location and organization name
- Category filtering, including database categories beyond the six suggested values
- Event details with poster/fallback, organizer link and date/venue
- Sign in/sign up to use RSVP and bookmarks, as well as read a private student profile
- Responsive navigation for Dashboard, Events, Organizations, Bookmarks, Profile
- Loading, empty, and error feedback

## Setup
1. Use the \`feature/03-student-discovery\` branch.
2. In \`my-react-app\`, run \`npm install\`. The feature introduces **no new packages**.
3. Keep the existing local \`.env\` with \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_PUBLISHABLE_KEY\`. Never commit it.
4. Ensure Feature 02 schema **and security fixes** have been run in the same Supabase project.
5. Copy and run \`supabase/03_student_permissions.sql\` in the Supabase SQL Editor. This grants required API privileges without changing row policies.
6. Run \`npm run lint\`, \`npm run build\`, \`npm run dev\`.

## Test checklist
- Anonymous browsing: \`/\` and \`/events\` show **approved** upcoming events only; \`/events/:id\` never shows pending/rejected data. Nonexistent IDs show Not Found.
- Search: type a title, description word, organization, or venue; results update.
- Filters: selecting a category retains the search; clear filters resets both. \`Competition\` data appears under \`Competitions\`.
- Details: poster or gradient fallback, date (Philippine time), location, organizer name, and description.
- Navigation: dashboard, events, organizations, bookmarks, and profile work at desktop/mobile widths.
- Anonymous RSVP: prompts sign-in. Authenticated user can RSVP, cancel RSVP, bookmark, remove bookmark, and view their bookmarks.
- Profile: logged-in user sees their own info; anonymous visitor is offered sign-in.
- Empty/error conditions: no records, no matches, no database access.
- Run \`npm run lint\` and \`npm run build\` locally; database requests require a configured Supabase project.

## Limitations by design
- No fabricated featured events: highlighted entries are drawn from the earliest approved upcoming events, with poster-bearing items preferred. There is no featured flag in the current database.
- No general event eligibility/application system exists yet. An RSVP means **interest**, not guaranteed admission. Official registration and eligibility remain the organizers' responsibility.
- Supabase Auth email confirmation depends on the project configuration. Verify the email flow before demo day.
- No notification system or admin approval UI is implemented in this feature. Event approvals still depend on Feature 02 status + RLS.
- Supabase Row Level Security must be tested with actual anonymous, student, organizer and admin sessions before production release.
- No live Supabase database actions are performed by the GitHub commit.
