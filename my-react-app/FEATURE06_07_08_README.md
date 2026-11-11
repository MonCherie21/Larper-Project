# Campus Connect — Features 06, 07, and 08

These features have been integrated into `main`. The original integration branch was `integration/features-06-07-08`. Live prototype: [https://campis.vercel.app](https://campis.vercel.app).

## Install & database migration
1. Do NOT re-run the original schema or re-create your existing seeded test users.
2. For a **new** database, apply `supabase/06_07_08_features.sql` after the preceding migrations. The existing live Supabase project has already run this migration; **do not apply it again just because you pulled GitHub changes**. It adds review fields, preferences, a public-count RPC, and updated policies.
3. Run npm install, npm run lint, npm run build, npm run dev from my-react-app.
4. Keep .env private. No secret/service-role keys belong in Vite.
5. Use admin@example.edu to test /admin; organizer accounts should get "Administrator access only."

## Feature 06 — Admin moderation
- /admin shows pending, approved, rejected and all events, posters and submitting organization.
- Two checkboxes: **Paperworks** and **Dean Approval**. The administrator verifies existing official approval, not issues the dean's authorization.
- Approve & publish requires both checked; reject requires a reason.
- Approved events can be unpublished to pending. Edits to event content reset moderation to pending.
- Admin can't approve/reject an organization owned by that admin; DB trigger independently enforces the restriction.
- Review timestamps, user IDs and rejection reason are stored in existing events table as new fields.
- Historical approved rows remain approved without backfilling old verification flags. New approvals must pass both checks.

## Feature 07 — Recommendations
- /preferences offers academic program, personal interests, preferred event categories and extracurricular interests. Preferences stay inside the user's protected profile row.
- Dashboard offers ranked approved events and organization recommendations, with an explanation.
- Base weights: 50% shared interests, 30% program relevance, 20% schedule. Schedule compatibility is **omitted**, not invented; active weights normalize to 62.5%/37.5%.
- Pure JavaScript scorer with no AI API; users without preferences get public discovery fallback.
- The existing profiles.interests, academic_program are reused, with preferred_categories and extracurricular_interests added.

## Feature 08 — Engagement
- Existing RSVP, cancellation, bookmarks and booklist reused.
- Prevent duplicate RSVPs/bookmarks via existing unique constraints (23505 handled idempotently).
- RSVP creation blocked for unapproved or finished events via RLS. Already-recorded RSVPs can still be canceled.
- Event details show total RSVP count using a limited SECURITY DEFINER RPC that returns counts only for approved events.
- Download RFC 5545 .ics from approved event details without credentials or calendar APIs.
- No academic schedule conflict detection.
- No member eligibility checks or guaranteed seat reservations: RSVP reflects intent to attend.

## Test checklist
- Run npm run lint; npm run build.
- Admin account: view pending events; approve one with just one box checked (must be blocked), then with both checked (must succeed); verify it appears on student Events page; unpublish (must disappear); reject another with reason (saved and visible to admins).
- Organizer account: /admin blocked, cannot approve its own event even via direct API. Editing a published event moves it back to pending.
- Student account: /admin blocked. On /preferences, update preferences, return to Dashboard for recommendations/explanations. Test no-preferences fallback.
- Event detail: RSVP, re-RSVP without duplicates, cancel, bookmark/unbookmark, refresh counts and bookmarks. Export .ics and import into a calendar.
- Anonymous account: can browse approved events and export calendar but cannot RSVP or bookmark; profile preferences are private.
- Review existing Feature 05 and 04 paths and regression test different-organization restrictions.

## Current limitations
- No real academic schedule source; don't invent compatibility.
- Events use the existing fields as keywords; no new event tags table is added.
- The team has reported successful live tests for admin approval/rejection/unpublication, recommendations, RSVP totals, email confirmation redirection, and Google Calendar `.ics` import. These user-reported checks are not a substitute for a full security regression or automated end-to-end test.
