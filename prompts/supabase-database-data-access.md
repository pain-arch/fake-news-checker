# Supabase database and data access for Skew News

## Goal

Complete the Supabase persistence layer for the news product in this repository. Keep Supabase as the source of truth for sources, articles, analyses, logs, and Oxylabs schedule tracking. Provide small, typed, server-only data access functions that current pages and later pipeline routes can use.

## Skills and guidance read

- `AGENTS.md` and `.agents/skills/supabase/SKILL.md`.
- Bundled Next.js 16 guidance: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `08-caching.md` (server-only modules and request-time database reads).
- Current Supabase changelog (`https://supabase.com/changelog.md`) and API security guide (`https://supabase.com/docs/guides/api/securing-your-api.md`), checked on 2026-09-19. The listed breaking changes do not alter this project's service-role table access. Recheck the relevant Supabase documentation before execution as the skill requires.

## Existing code inspected

- `supabase/schema.sql`, `supabase/seed-qa-news.sql`, `lib/supabase/types.ts`, `lib/supabase/server.ts`, and `lib/supabase/queries/articles.ts`.
- `app/page.tsx` and `app/news/[id]/page.tsx`, which already read analyzed articles on the server.
- `package.json`, `.env.example`, `README.md`, and existing prompts.
- The schema currently has `sources`, `articles`, and `article_analyses` with RLS enabled. It lacks `logs`, `oxylabs_schedules`, and `oxylabs_schedule_runs`. Current data access covers home and detail reads only. `.env.local` exists, but the Supabase CLI is not installed in the current shell.

## Decisions and assumptions

- “Skew News” refers to this repository. This task does not rename the current app, database tables, environment variables, or `x-biasly-admin-secret` header.
- Preserve existing article and analysis columns and QA fixture compatibility. Add the three missing core tables and indexes with forward-safe SQL; do not drop or reset data.
- This is the database and data access layer only. Do not add scraping, Scheduler API calls, AI generation, routes, cron configuration, or UI behavior.
- Follow `AGENTS.md` section 20: defer `embedding vector(1536)`, the vector index, and related-article search until AI analysis is working and pgvector is enabled. Do not add embedding to the initial schema.
- Store Oxylabs schedule and job IDs as exact text values because they can exceed JavaScript's safe integer range. Data access must never convert those IDs through `number`.
- Use the existing server-only service-role client. Do not add Supabase Auth or browser data access. Keep missing configuration explicit and fail writes safely.
- Use the project's existing `supabase/schema.sql` as the baseline and supply a separate, repeatable upgrade SQL file for existing deployed databases. No declarative schema directory or Supabase migration setup exists.

## Files likely to change

- `supabase/schema.sql` and a new SQL upgrade file under `supabase/`.
- `lib/supabase/types.ts`, `lib/supabase/server.ts`, and focused modules under `lib/supabase/queries/` for sources, articles, analyses, logs, and schedules/runs.
- `README.md` for setup, upgrade, and verification steps; `.env.example` only if an actual variable change is necessary.
- Existing page files only if a required type or query correction makes a small change unavoidable. Leave the user's untracked `.env.example` content intact unless required.

## Implementation requirements

1. Extend `supabase/schema.sql` with `logs`, `oxylabs_schedules`, and `oxylabs_schedule_runs`, including primary keys, source/schedule relationships, useful status/timestamp fields, uniqueness for external IDs, and indexes for active source, pending analysis, recent logs, and schedule-run lookups. Use text for Oxylabs external IDs. Keep the six core tables and their foreign keys consistent.
2. Retain article original-URL and canonical-URL dedupe constraints, required image URL and published date, analysis score/percentage checks, and analyzed timestamp semantics. Add only targeted constraints that preserve current valid rows and QA seed data. Document any data cleanup needed before applying an upgrade.
3. Enable RLS on every public table. Grant service-role access explicitly and prevent direct `anon`/`authenticated` access to internal pipeline tables. Keep all writes on the server. Do not create blanket public policies, security-definer functions, or views that bypass RLS.
4. Keep TypeScript types aligned with every schema column, including nullable fields and insert/update payloads where useful. Avoid `any`. Ensure the existing Home and details query result shapes remain compatible.
5. Add server-only functions for active source reads; URL existence checks in chunks of at most 15 URLs; append-only valid article insertion with duplicate handling for original/canonical URL conflicts; pending-analysis reads based on missing `article_analyses` rows rather than `analyzed_at` alone; analysis insert and analyzed timestamp update only after valid persistence; log insertion and recent-log reads; schedule and run upserts/reads using exact string external IDs. Keep functions small and avoid filtering a joined table using `.eq('foreignTable.column', ...)`.
6. Make errors observable without logging credentials or article body text. Return typed results or throw clear server-side errors as appropriate. Preserve page read behavior: Home and details show only analyzed, complete stored records.
7. Provide SQL upgrade and verification queries for existing projects. Ensure both a fresh install and an upgrade from the current three-table schema are covered. Keep the QA seed runnable after the schema change.

## Security requirements

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, Oxylabs credentials, OpenAI credentials, or admin secrets to client code or logs.
- Use `server-only` imports for privileged modules. No browser Supabase writes and no Supabase Auth.
- Treat `anon` and `authenticated` as untrusted for the six internal tables; confirm grants and RLS together.
- Preserve append-only scraping storage. No delete, truncate, or replace operations in the data access API.

## Acceptance criteria

- Fresh schema creates all six tables with expected constraints, indexes, grants, and RLS; upgrade SQL adds missing pieces without deleting existing articles, analyses, or QA fixtures.
- All new data access functions typecheck and can be called from server modules. Current Home and details pages continue to read analyzed rows.
- A duplicate original or canonical article URL is reported as a duplicate and does not overwrite an existing article.
- Pending analysis includes an article with no analysis row even if `analyzed_at` is set.
- Oxylabs IDs round-trip as exact strings. No external API calls or pipeline jobs are started by this change.

## Checks to run

- `npm run typecheck`, `npm run lint`, and `npm run build` from the project root; report exact output.
- Run schema/upgrade and read/write verification SQL against the configured Supabase project if a safe database connection is available. Otherwise provide exact Supabase Dashboard SQL Editor steps and clearly mark live database verification as pending.
- Verify QA seed compatibility and a read of the existing Home and detail data when a connected database is available. Stop optional testing once these risks are covered.

## Exact manual test steps expected after implementation

1. In Supabase Dashboard → SQL Editor, run `supabase/schema.sql` on a new project, or run the new upgrade SQL on an existing project. Do not run a destructive reset. Enable the Data API for `public` if the project has it disabled.
2. Run the supplied verification SQL. Confirm six tables, RLS enabled, service-role grants, unique article URLs and schedule IDs, and the expected indexes.
3. Run `supabase/seed-qa-news.sql` if test content is wanted. Rerun it to confirm no duplicates and confirm the fixture source stays inactive.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` without sharing their values. Run `npm run dev`, open `http://localhost:3000`, and open one QA article at `/news/<article-id>`. Confirm the stored article and analysis render.
5. Use the supplied read/write verification query or server-side check to confirm active-source filtering, URL duplicate detection, missing-analysis detection, recent-log retrieval, and exact-string schedule/run ID storage. Confirm `anon` and `authenticated` cannot directly read or write internal pipeline tables.
