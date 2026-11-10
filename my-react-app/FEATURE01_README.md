# Feature 01 — Project foundation

This overlay is designed for the existing `Larper-Project/my-react-app` Vite starter. It does not replace the repository. Review and copy the files into your cloned repository at the same relative paths.

## Install (from `my-react-app/`)

Use Node.js 22.12+ (or an up-to-date supported Node.js release).

```bash
npm install
npm install react-router-dom @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite
```

The first command uses the existing repository `package.json`. The following commands update `package.json` and `package-lock.json` with the new dependencies. Commit both files.

## Environment

```bash
cp .env.example .env
```

On Windows PowerShell: `Copy-Item .env.example .env`

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from Supabase. Do not use `service_role` or secret keys in Vite environment variables.

Supabase is optional for running the foundation locally; if values are absent, `supabase` is `null` and pages still render. Future services should handle a missing client during setup.

Do not commit `.env`. Verify with `git check-ignore my-react-app/.env` from repository root. If already tracked, run `git rm --cached my-react-app/.env` (keeps the file locally), then commit the removal.

## Run and verify

```bash
npm run dev
npm run build
npm run lint
```

Visit the URL printed by Vite. Open `/`, `/events`, `/organizations`, and `/missing-page` and verify header navigation and the 404 page. Test narrow/mobile width. Restart Vite after changing `.env`.

## Structure notes

- Reusable UI: `src/components/`
- Layouts and route shell: `src/layouts/`
- Route pages: `src/pages/`
- Supabase client only: `src/lib/supabase.js`
- Future database operations: `src/services/` (create when needed)
- Future hooks: `src/hooks/` (create when needed)
- Existing `src/assets/` untouched
- `src/main.jsx` remains unchanged

No tables, RPC, RLS policies, event submission, bookmarks, login, or administrative features are added here.
