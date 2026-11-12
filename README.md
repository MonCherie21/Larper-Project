# Campus Connect — Campus Activity & Discovery Platform

**Hack4Success 2026 · Student Around Services**  
**Primary challenge:** Quality of Life  
**Related themes:** EdTech / Academic Accessibility; Data-Driven Administration

> **Live platform:** [https://campis.vercel.app](https://campis.vercel.app)  
> **GitHub:** [MonCherie21/Larper-Project](https://github.com/MonCherie21/Larper-Project)  
> **Team:** Add the actual team members and programs/sections before final submission.

## Documentation index

**Start here:** this root `README.md` is the primary guide for judges and new contributors. The feature READMEs remain available as detailed reference files.

| Document | Purpose |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | Features 01–08, fixes and release readiness |
| [Web app README](my-react-app/README.md) | Quickstart for the React/Vite app |
| [Feature 01 — Foundation](my-react-app/FEATURE01_README.md) | Base setup and environment configuration |
| [Features 02 & 04 — Database and organizations](supabase/README.md) | Supabase schema, security and organizations |
| [Feature 03 — Student discovery](my-react-app/FEATURE03_README.md) | Events, search, filtering, profile and bookmarks |
| [Feature 05 — Organizer portal](my-react-app/FEATURE05_README.md) | Submissions, poster uploads and management |
| [Features 06–08 — Final feature integration](my-react-app/FEATURE06_07_08_README.md) | Admin review, recommendations and participation |
| [Final design and institutional signup](my-react-app/FINAL_DESIGN_AND_SIGNUP.md) | Dashboard, organization emblems, role-aware profiles, and signup hook setup |

Some feature-specific documents describe their original implementation stage. For current full-project installation and deployment, use **this README**.

## The problem

University events and student organization announcements are spread across different Facebook pages and groups. Students may miss activities, competitions or opportunities simply because they don't follow the right page.

## The solution

**Campus Connect** provides a single, accessible place to find university activities and organizations — even when a student isn't eligible or able to attend. It combines student event discovery, authenticated organization submissions, and administrator verification before public publication.

## Features by role

| Role | Main capabilities |
| --- | --- |
| Visitor | Browse approved events, search/filter, use the campus calendar, and view public organization profiles |
| Student | RSVP and cancel, bookmark events, export .ics calendar files, update interests and receive explainable recommendations |
| Organizer | Create/edit/delete **their own organization's** events; upload posters; view pending/approved/rejected status and RSVP counts |
| Administrator | Review submissions, verify **Paperworks** and **Dean Approval**, approve/publish, reject with a reason, unpublish |

**Institutional signups:** New student self-registration is checked against `03xx-xxxx@lspu.edu.ph` (every `x` a digit). A separate Supabase Auth **Before User Created** hook is supplied; **it must be installed and activated manually** before this becomes server-enforced. Existing demo accounts continue to sign in. Email confirmation verifies address ownership, not enrollment. See [setup notes](my-react-app/FINAL_DESIGN_AND_SIGNUP.md).

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

## Dashboard and organization polish

- [PR #12](https://github.com/MonCherie21/Larper-Project/pull/12): campus calendar, academic-style brand mark, compact event presentation and cleaner navigation.
- [PR #13](https://github.com/MonCherie21/Larper-Project/pull/13): clearer date-group separation in Upcoming Events; seven muted, **original illustrative** emblems for sample clubs (not official university seals). A genuine, authorized organization `logo_url` takes precedence.
- Profile headers reflect account role: **Admin**, **Organizer profile**, or **Student profile**.
- Sample CCS description: *College of Computer Science.* Sample CTE group: **CTE**, description *College of Teachers Education*. The [scoped SQL patch](supabase/patches/13_ccs_description.sql) must be run in Supabase to change existing records; it does not change organization IDs, owners, or events.

## Structure

```text
Larper-Project/
├─ README.md
├─ CHANGELOG.md
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
7. `supabase/patches/13_ccs_description.sql` (optional demonstration-data label update)
8. `supabase/patches/12_lspu_signup_hook.sql` (optional account-creation rule; the hook must then be enabled under **Authentication → Hooks → Before User Created**)

For an **already initialized** database, run **only missing migrations or scoped data patches**. Do not recreate accounts or reload demonstration seeds. GitHub merges never automatically run SQL scripts or activate Supabase Auth hooks. The new signup rule affects all **future newly created** accounts once activated (including new organizer/admin test users), but not existing logins. Keep confirmation enabled and test both allowed/blocked signups. Sample dataset scripts are under `supabase/examples/`.

## Test and demo sequence

1. Open Events as a student or visitor; search, filter and view organization details.
2. Sign in as an organizer, create an event and upload a poster; verify it remains pending.
3. Sign in as an administrator. Verify Paperworks and Dean Approval and approve the event.
4. Refresh Events as a student; check newly published event, RSVP count, bookmark and calendar download.
5. Reject or unpublish an event; check public visibility and organizer status.
6. Set /preferences and review personalized suggestions on the dashboard.
7. Confirm students cannot open `/admin` and organizers cannot modify other organizations' events; test direct RLS/API operations separately.
8. Check the calendar, date groups, organization emblems and role-specific profile heading.
9. If the signup hook has been enabled, test valid/invalid new registration and existing logins.

See `my-react-app/FEATURE06_07_08_README.md` for additional tests.

## Vercel deployment

1. **Deployed production website:** [https://campis.vercel.app](https://campis.vercel.app). Connect the GitHub repository `MonCherie21/Larper-Project` to Vercel to manage future deployments.
2. Set **Root Directory** to `my-react-app`, **Framework** to Vite, **Build Command** to `npm run build`, and **Output Directory** to `dist`.
3. Under Vercel Project Settings → Environment Variables, set **VITE_SUPABASE_URL** and **VITE_SUPABASE_PUBLISHABLE_KEY** for Production. Redeploy when changed.
4. The `my-react-app/vercel.json` rewrite sends direct React Router URLs (e.g. `/admin`) to the SPA entry point.
5. Review the production Site URL / redirect URLs in Supabase Auth if using email confirmation and authentication redirects.
6. Visit the deployed URL and repeat the demo and role/RLS smoke tests.

## Known limitations and future work

No timetable synchronization, participation eligibility check, university SSO, push notification service, or digitally issued dean approval exists. The university-format email check does not itself establish current enrollment; email-change flows and stronger identity verification are outside the current implementation. Further expansion could onboard more colleges, organization representatives and campus offices, and integrate official university systems.

## Hack4Success 2026 submission

Official theme **Student Around Services**; submission deadline **November 12, 2026, 12:00 PM**; pitching **November 12, 2026, 1:00 PM** at **CTE Function Hall**. Submission requires a source-code/prototype link and complete README, a **5–10 slide deck**, and a **maximum 10-minute live pitch** with working demo plus Q&A.

**Live deployment:** [Campus Connect](https://campis.vercel.app). Add the team's actual names and double-check all required submissions before sending the final repository link.
