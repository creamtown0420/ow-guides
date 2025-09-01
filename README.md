# OW Custom Codes (React + Vite + Bootstrap)

Overwatch custom workshop codes explorer. Tailwind was replaced with Bootstrap. Optional Supabase integration enables email-link auth, likes, and code registration with unique code constraint.

## Stack
- React 19 + Vite 7
- Bootstrap 5 (CSS only)
- Optional: Supabase (Auth + Postgres)

## Getting Started
```
cd ow-guides
npm i
npm run dev
```

## Supabase (optional)
If you want login (magic link), likes, and code registration:

1) Create a Supabase project and enable Email (magic link) auth. Set Site URL to your dev or deployed URL.
2) In the Supabase SQL editor, run the schema:
   - `supabase/schema.sql` (creates `codes`, `likes`, RLS policies, etc.)
3) Add env vars in `ow-guides/.env` (Anon key is safe to expose in client builds):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```
4) Start the dev server. The header will show login (email) UI. Logged-in users can add new codes. Likes are per-user (1 per code).

Behavior without Supabase env: the app falls back to static seed data; likes use localStorage only.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build (outputs to `dist/`)
- `npm run preview` – preview built files

## Deploy
Any static host works (GitHub Pages, Netlify, Vercel, etc.). For GitHub Pages (Actions):
- Build with env vars set so Vite embeds `VITE_SUPABASE_*` into the bundle (configure as Actions environment vars or use a `.env` in the build step only).

## Notes
- Likes base count is 0. All displayed likes come from DB (or localStorage fallback).
- Codes table enforces `code` uniqueness; the app surfaces an error if duplicate.
- No Bootstrap JS used; only CSS.
