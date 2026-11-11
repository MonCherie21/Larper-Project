# Campus Connect — Web App

The React + Vite frontend for Campus Connect.

For the complete project description, architecture, migrations, deployment and demo instructions, start with the [main project README](../README.md). Read the [CHANGELOG](../CHANGELOG.md) for the development history of Features 01–08 and follow-up fixes.

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
