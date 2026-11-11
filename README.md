# Campus Connect — Campus Activity & Discovery Platform

**Hack4Success 2026 · Student Around Services**  
**Primary challenge:** Quality of Life  
**Related themes:** EdTech / Academic Accessibility; Data-Driven Administration

> **Before submission:** Add your team's 3–5 members and their programs/sections here. Add the deployed URL after hosting.

## The problem

University events and student organization announcements are spread across different Facebook pages and groups. Students may miss activities, competitions or opportunities simply because they don't follow the right page.

## The solution

**Campus Connect** provides a single, accessible place to find university activities and organizations — even when a student isn't eligible or able to attend. It combines student event discovery, authenticated organization submissions, and administrator verification before public publication.

## Features by role

| Role | Main capabilities |
| --- | --- |
| Visitor | Browse approved upcoming events; search/filter; view public organization profiles |
| Student | RSVP and cancel, bookmark events, export .ics calendar files, update interests and receive explainable recommendations |
| Organizer | Create/edit/delete **their own organization's** events; upload posters; view pending/approved/rejected status and RSVP counts |
| Administrator | Review submissions, verify **Paperworks** and **Dean Approval**, approve/publish, reject with a reason, unpublish |

**University authorization is external:** Campus Connect records that the dean's in-person approval and applicable paperwork have been verified; it does not replace the university process. RSVP expresses interest; it does not guarantee participation.

The recommendation system uses a lightweight deterministic weighting: 50% interests, 30% program relevance and a proposed 20% schedule factor. With no timetable data, schedule matching is omitted and remaining weights normalized. No AI/ML API is used.

## Architecture

- React 19 + React Router for responsive user interface.
- Vite 8 and Tailwind CSS 4 for build and styling.
- Supabase JS SDK for the backend connection.
- Supabase PostgreSQL for profiles, organizations, events, RSVPs and bookmarks.
- Supabase Auth for user login and access roles; Row Level Security and database triggers protect actions.
- Supabase Storage for public event posters with organizer-folder ownership checks.
- Vercel for production web hosting.

**Flow:** Vercel-hosted React frontend → Supabase Auth / PostgreSQL (RLS) / Storage.

## Structure

```text
Larper-Project/
├─ README.md
├─ my-react-app/
│  ├─ src/
│  │  ├─ pages/          # route pages: student, organizer, admin
│  │  ├─ components/     # shared UI, cards, role guards
│  │  ├─ services/       # Supabase queries and mutations
│  │  ├─ hooks/          # auth state
│  │  └─ lib/            # formatting, ranking, calendar export
│  ├─ package.json
│  └─ vercel.json        # React Router deep-link fallback
└─ supabase/             # database schema and migrations
```

## Local setup

Requirements: a compatible Node.js and npm installation; a Supabase project.

```sh
cd my-react-app
npm ci
```

Create `my-react-app/.env` privately:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Never put the Supabase **service-role or secret key** into a Vite client-side environment variable.

```sh
npm run lint
npm run build
npm run dev
```

Open the localhost address displayed by Vite.

### Database migrations

When setting up a **new** Supabase database, apply these scripts from the SQL Editor in order:

1. `supabase/schema.sql`
2. `supabase/02b_security_fixes.sql`
3. `supabase/03_student_permissions.sql`
4. `supabase/05_organizer_portal.sql`
5. `supabase/patches/05_fix_storage_owner_policy.sql`
6. `supabase/06_07_08_features.sql`

For an **already initialized** database, run **only missing migrations**. Do not recreate accounts or reload demonstration seeds. GitHub merges never automatically run SQL scripts. Sample dataset scripts are under `supabase/examples/`.

## Test and demo sequence

1. Open Events as a student or visitor; search, filter and view organization details.
2. Sign in as an organizer, create an event and upload a poster; verify it remains pending.
3. Sign in as an administrator. Verify Paperworks and Dean Approval and approve the event.
4. Refresh Events as a student; check newly published event, RSVP count, bookmark and calendar download.
5. Reject or unpublish an event; check public visibility and organizer status.
6. Set /preferences and review personalized suggestions on the dashboard.
7. Confirm students cannot open /admin and organizers cannot modify other organizations' events.

See `my-react-app/FEATURE06_07_08_README.md` for additional tests.

## Vercel deployment

1. Connect the GitHub repository `MonCherie21/Larper-Project` to Vercel.
2. Set **Root Directory** to `my-react-app`, **Framework** to Vite, **Build Command** to `npm run build`, and **Output Directory** to `dist`.
3. Under Vercel Project Settings → Environment Variables, set **VITE_SUPABASE_URL** and **VITE_SUPABASE_PUBLISHABLE_KEY** for Production. Redeploy when changed.
4. The `my-react-app/vercel.json` rewrite sends direct React Router URLs (e.g. `/admin`) to the SPA entry point.
5. Review the production Site URL / redirect URLs in Supabase Auth if using email confirmation and authentication redirects.
6. Visit the deployed URL and repeat the demo and role/RLS smoke tests.

## Known limitations and future work

No timetable synchronization, participation eligibility check, university SSO, push notification service, or digitally issued dean approval exists. Further expansion could onboard more colleges, organization representatives and campus offices, and integrate official university systems.

## Hack4Success 2026 submission

Official theme **Student Around Services**; submission deadline **November 12, 2026, 12:00 PM**; pitching **November 12, 2026, 1:00 PM** at **CTE Function Hall**. Submission requires a source-code/prototype link and complete README, a **5–10 slide deck**, and a **maximum 10-minute live pitch** with working demo plus Q&A.

Add your team's names and a verified deployment URL before submitting.
