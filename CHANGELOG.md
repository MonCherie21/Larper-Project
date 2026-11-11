# Campus Connect — Changelog

Development milestones and fixes for **Hack4Success 2026**. This history summarizes changes already committed to GitHub, not a guarantee that every workflow has completed production quality assurance. For installation, architecture and submission details, see the [main README](README.md).

## Unreleased — Hackathon documentation and hosting preparation

- Created a single project-wide README at the repository root with feature overview, architecture, setup, SQL migration order, role permissions, testing and Vercel deployment.
- Replaced the default Vite app README with Campus Connect quickstart instructions.
- Added Vercel single-page application rewrite configuration for direct URLs such as `/admin` and `/events/:id`.
- Fixed SQL function dollar quoting in the Feature 05 setup file for new installations. Existing live Supabase databases are not automatically changed.
- Added this changelog and a documentation index linking all feature guides.
- Production build, hosting and final role/RLS checks remain to be verified.

## 2026-11-11 — Features 06, 07 and 08 integrated

Implemented in [PR #9](https://github.com/MonCherie21/Larper-Project/pull/9).

### Feature 06 — Administrator moderation

- Created an administrator-only `/admin` dashboard to review pending, approved and rejected events.
- Added a simplified approval checklist: **Paperworks** and **Dean Approval**.
- Added approval/publication, rejection with reason and unpublish-to-pending actions.
- Added database review fields and a trigger guarding moderation permissions and approved-event requirements.
- Kept the dean's official approval as an in-person university process; administrators record its verification.

### Feature 07 — Recommendations

- Added student onboarding/preferences at `/preferences` for academic program, interests, activity categories and extracurricular interests.
- Added recommended approved events and organizations with a reason for each match.
- Used a lightweight scoring heuristic (no external AI/ML service). Since academic timetables are unavailable, schedule compatibility is omitted rather than guessed.

### Feature 08 — Participation

- Extended existing RSVP and bookmarks workflows with duplicate-handling and RSVP availability checks.
- Added RSVP totals through a limited database function.
- Added `.ics` calendar export from approved event pages.

**Reported local checks:** Admin rejection and unpublication updated organizer/public state; organizers could edit and resubmit rejected events; recommendations displayed relevant options. Calendar import and production testing were not yet confirmed.

## 2026-11-11 — Feature 05 organizer portal and follow-up fixes

Feature 05 introduced in [PR #4](https://github.com/MonCherie21/Larper-Project/pull/4).

- Built an assigned-organization dashboard with event status filters, RSVP counts and event management.
- Added event creation, editing, deletion, poster upload and required-field validation.
- Added role-aware access and owner-restricted Storage policies.
- Ensured organizer submissions remain pending for administrator verification.

**Follow-up fixes:**

- [PR #5](https://github.com/MonCherie21/Larper-Project/pull/5): renamed the seeded organization display name from *CCS Student Council* to *CCS*, with a separate SQL update for existing data.
- [PR #6](https://github.com/MonCherie21/Larper-Project/pull/6): added *Remove selected photo* and the ability to undo removal before saving.
- [PR #8](https://github.com/MonCherie21/Larper-Project/pull/8): repaired Storage upload authorization using an owner-verification helper, replacing a temporary account-specific test policy.

**Reported local checks:** CCS and CTE organizers could submit independently; an organizer could not open another organization's edit form; approved events remained publicly discoverable across departments. Some direct API and production security tests remain.

## 2026-11-11 — Feature 03 student dashboard and event discovery

Implemented in [PR #3](https://github.com/MonCherie21/Larper-Project/pull/3).

- Added featured/upcoming approved-event sections and event detail pages.
- Added text search, category filtering and organization links.
- Added account screens, student profile, RSVP and bookmarks.
- Added loading, error and empty states plus responsive navigation.

## 2026-11-10 — Features 02 and 04 database and organizations

- Added Supabase schema for profiles, organizations, events, RSVPs and bookmarks.
- Added Row Level Security, authorization triggers, grants and incremental security fixes.
- Added organization directory/profile, filtering and upcoming approved-event summaries.
- Corrected organization page lint issues and integrated seeded test records.

## 2026-11-10 — Feature 01 foundation

- Initialized the React + Vite application and project structure.
- Added Tailwind styling, React Router, navigation and a Supabase client.
- Set up environment configuration and development/build commands.

## Remaining release checks

- Run `npm ci`, `npm run lint` and `npm run build` using the final branch.
- Verify Vercel production hosting, environment variables and refreshing deep links.
- Test calendar download/import, duplicate RSVP handling and bookmarks.
- Verify database RLS for real student, organizer and admin accounts, including direct API operations.
- Replace temporary demo data and add final team members and deployment URL to [README.md](README.md).

For detailed steps, see the feature-specific documentation linked from the [main README](README.md).
