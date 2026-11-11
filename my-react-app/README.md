# Campus Connect — Web App

The React + Vite frontend for Campus Connect.

Read the [project documentation](../README.md) for system purpose, user roles, architecture, migrations, deployment and demo instructions.

## Run locally

```sh
npm ci
npm run lint
npm run build
npm run dev
```

Provide a local `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Use only the public publishable key in frontend code.

**Vercel:** Set this `my-react-app` directory as the project Root Directory; Vite; build `npm run build`; output `dist`. The `vercel.json` rewrite supports direct React Router links.

For detailed Feature 06–08 tests, see [FEATURE06_07_08_README.md](FEATURE06_07_08_README.md).
