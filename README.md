# FocusFlow MVP

FocusFlow is a study planner with a landing page, email-only sign in, profile setup, timer, goals, analytics, history, and settings.

## Run locally

```bash
npm install
npm run dev
```

The Vite dev server opens at `http://127.0.0.1:5173`.

## Email verification setup

FocusFlow now uses verified email only. Phone sign-up has been removed.

1. Copy `.env.example` to `.env`.
2. Add your Supabase project URL and anon key.
3. In Supabase Auth, make sure your email redirect URL includes `http://127.0.0.1:5173/sign-in` for local development.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Without those env vars, the sign-in page will show a local configuration warning instead of sending verification emails.

## Checks

```bash
npm run lint
npm run build
```
