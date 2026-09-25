# Add the five example news sources directly in Supabase

## Goal

Populate the existing `public.sources` table directly with active homepage entries for Reuters, NPR, Fox News, BBC News, and The Guardian so later scraping can select them from Supabase. Do not create or edit a seed file.

## Skills and guidance read

- `AGENTS.md` and `.agents/skills/supabase/SKILL.md`.
- Supabase's current changelog and database overview documentation. The recent Data API exposure change does not alter this SQL seed workflow.

## Existing code inspected

- `supabase/schema.sql`: `sources` has a unique `listing_url`, `name`, optional `parser_strategy` and `logo_url`, and `is_active`.
- `supabase/seed.sql`: currently empty and must remain untouched per the user's update.
- `supabase/seed-qa-news.sql`: separate inactive QA fixture source; leave it untouched.
- `lib/supabase/queries/sources.ts`: later scraping reads only active rows, ordered by name.
- `lib/supabase/server.ts`, `.env.example`, `package.json`, and `README.md`.
- Read-only queries against the configured Supabase REST endpoint returned HTTP 401 with either the service key as `apikey` alone or as both `apikey` and bearer token. No authenticated browser session or Supabase CLI was available. Live table contents could not be verified yet.

## Decisions and assumptions

- Use these homepage entries: `https://www.reuters.com/`, `https://www.npr.org/`, `https://www.foxnews.com/`, `https://www.bbc.com/news`, and `https://www.theguardian.com/`. The BBC `/news` landing page is its news homepage. Do not add category or article URLs.
- Store display names `Reuters`, `NPR`, `Fox News`, `BBC News`, and `The Guardian`.
- Set `is_active = true`; leave `parser_strategy` and `logo_url` null because no parser or logo configuration is requested.
- Use `ON CONFLICT (listing_url) DO NOTHING` for a direct SQL insert so existing source settings are preserved and rows are not duplicated. Do not overwrite a row that already uses one of these URLs.
- This task adds sources only. It does not fetch pages, create schedules, or insert articles.

## Files likely to change

- None except this required implementation prompt. Apply the rows directly to the existing Supabase table.

## Implementation requirements

1. Inspect the current rows in `public.sources` through an authenticated database connection, if one is available.
2. Insert exactly the five source homepage records directly into `public.sources` with explicit columns and rerun-safe conflict handling.
3. Query the five configured rows back and confirm name, URL, and active status.
4. If authenticated database access remains unavailable, provide the exact SQL for the user to run in Supabase Dashboard > SQL Editor and clearly state that the live table has not yet been changed.
5. Leave `supabase/seed.sql`, QA fixtures, and application code untouched.

## Security requirements

- Keep Supabase credentials out of the prompt, repository output, and browser code.
- Do not change RLS, service role access, or table grants.
- Do not delete or update existing source rows.

## Acceptance criteria

- The existing Supabase table contains the five active source rows with the listed homepage URLs.
- Repeating the SQL creates no duplicates and leaves existing source settings unchanged.
- The active-source query can return these entries for future scraping.
- No articles, analyses, schedules, or QA fixtures are changed.

## Checks to run

- Query the connected database and compare name, URL, and active status. If access remains unavailable, report live verification as pending.
- `npm run typecheck` and `npm run lint` only if repository code changes beyond this prompt; no build is needed for a database data insert.

## Exact manual test steps expected after implementation

1. In Supabase Dashboard > SQL Editor, run the direct `INSERT` statement supplied after implementation.
2. Run the supplied verification `SELECT` and confirm Reuters, NPR, Fox News, BBC News, and The Guardian each appear once with `is_active = true` and the expected homepage URL.
3. Repeat the `INSERT`, then rerun the `SELECT` to confirm no duplicates.
4. Confirm pre-existing source rows and the inactive QA fixture source retain their prior values.
