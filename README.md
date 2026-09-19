This is a Next.js news reader with Supabase article storage and Clerk authentication.

## Supabase database

Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in the deployment environment. Keep the service-role key server-only. The anon key is reserved for future client needs; current article reads and all writes use the server-only client.

In Supabase Dashboard → SQL Editor, run `supabase/schema.sql` for a new database. For a database with the original `sources`, `articles`, and `article_analyses` tables, run `supabase/upgrade-data-access.sql` instead. The upgrade preserves existing rows and may be rerun. It expects the original three-table schema; if a table was customized, compare its columns and constraints before running it. No data cleanup is needed for the repository's original schema or QA seed. Ensure the `public` schema is exposed by the Data API for server queries.

Run `supabase/verify-data-access.sql` next. Its temporary inserts are rolled back. The permission result should show six tables with RLS enabled and service-role access, while `anon` and `authenticated` have no direct table read access. The exact Oxylabs schedule and job IDs should remain unchanged. The pending-analysis query finds articles with no analysis row regardless of `analyzed_at`.

For UI smoke testing, run `supabase/seed-qa-news.sql` if synthetic content is wanted, then `npm run dev` and open `http://localhost:3000` and `/news/e1400000-0000-4000-8000-000000000101`. Rerunning the seed must not create duplicates. Check the Home page and details page for the stored analysis. The QA source is inactive and is never selected by `getActiveSources()`.

Server-only helpers live in `lib/supabase/queries/`: `sources.ts` reads active sources; `persistence.ts` checks URLs in chunks of 15 and inserts articles without replacement; `analyses.ts` finds missing analyses and saves valid results; `logs.ts` writes and lists logs; `schedules.ts` stores exact string IDs and lists schedules and runs. Pipeline routes are not part of this change.

## Authentication

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the [Clerk Dashboard](https://dashboard.clerk.com/~/api-keys). Set the same keys in your deployment environment.

The homepage and article pages are public. **Sign up** and **Log in** in the header and mobile menu open Clerk dialogs. Signed-in users get an account button for profile management and sign out.

Run `npm run typecheck`, `npm run lint`, and `npm run build` to verify the integration.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
