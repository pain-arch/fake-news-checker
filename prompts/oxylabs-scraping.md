# Implement the Oxylabs manual scraping pipeline

## Goal

Implement `POST /api/scrape` to fetch configured source homepages through the Oxylabs Web Scraper API, identify real article links, fetch and validate article pages, and append valid articles to Supabase. Return a useful run summary and record progress in server logs. This prompt covers the manual scrape-to-insert pipeline that the later Scheduler can reuse.

## Skills and guidance read

- `AGENTS.md`, especially sections 7–17 and 21–22.
- `.agents/skills/supabase/SKILL.md`.
- The requested `.agents/skills/oxylabs-web-scraper/SKILL.md` does not exist in this checkout. The installed Oxylabs Web Scraper API skill is `.agents/skills/web-scraper-api/SKILL.md`; use its realtime `universal` scraper guidance. Do not invent a different skill.
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` for this installed Next.js version. Read any further relevant bundled guide before coding.
- Before implementation, follow the Supabase skill's current changelog and relevant query documentation checks.

## Existing code inspected

- `package.json`: Next.js 16.3.5 and Supabase client are installed; Cheerio and Zod are not yet dependencies.
- `lib/supabase/queries/sources.ts`: `getActiveSources()` reads active rows from Supabase.
- `lib/supabase/queries/persistence.ts`: `getExistingArticleUrls()` checks both URL columns in chunks of 15; `insertArticle()` validates and inserts without overwrite.
- `lib/supabase/queries/logs.ts`: `writeLog()` and `getRecentLogs()` exist.
- `lib/supabase/server.ts`, `lib/supabase/types.ts`, `supabase/schema.sql`, `.env.example`, and `README.md`.
- No scraper, parser, pipeline, or API route currently exists.
- Live active source names observed: BBC News, Fox News, NPR, Reuters, and The Guardian. Their `parser_strategy` values are currently null. Read homepage URLs from their Supabase rows at runtime; never copy URLs into scraper code.

## Decisions and assumptions

- With no source selection supplied, scrape all active sources, aiming for up to five valid new articles per source. Support an optional JSON body with selected source IDs or names and a bounded per-source limit; reject invalid or inactive selections.
- A manual request performs live Oxylabs fetches. It does not create schedules or trigger AI analysis. Keep its core source processing reusable for later scheduled homepage HTML.
- Prefer fewer valid articles over filling a quota with dubious pages. An Oxylabs request can be costly, so filter candidate links and existing URLs before article detail fetches.
- Derive source-specific URL checks from the five configured publishers' real homepage card and URL patterns during implementation. Keep the checks keyed by source strategy or hostname, never by hardcoded homepage URL.
- No schema change is expected. If a required field must change, update `supabase/schema.sql` and `lib/supabase/types.ts` together and provide the matching SQL for the Supabase Dashboard before testing.

## Files likely to change

- Add `app/api/scrape/route.ts` as a thin POST handler.
- Add small server-only modules under `lib/oxylabs/`, `lib/parsing/`, and `lib/pipeline/` for the API client, homepage and detail parsing, validation, and orchestration.
- Adjust `lib/supabase/queries/persistence.ts`, `sources.ts`, or `logs.ts` only where needed for the pipeline.
- Update `package.json` and `package-lock.json` for Cheerio and Zod if used.
- Update `.env.example` or `README.md` only if behavior or setup needs clarification.

## Implementation requirements

1. Expose `POST /api/scrape` only for the action. Require `x-biasly-admin-secret` equal to server-side `BIASLY_ADMIN_SECRET`; return 401 for missing or invalid values. Validate request JSON and limits. Keep credentials out of responses and logs.
2. Load active sources from Supabase for every run. Use the selected active sources when specified; otherwise all active sources. Homepage entry URLs must come solely from `sources.listing_url`. Never crawl into a secondary listing page.
3. Fetch each homepage through Oxylabs Realtime Web Scraper API using server-side Basic Auth and `source: "universal"`. Handle HTTP errors, empty results, timeouts, and malformed response content without exposing credentials.
4. With Cheerio, collect links from visible homepage story cards in the main content, excluding navigation, menu, footer, hidden elements, and the section 9 non-article reject list. Normalize HTTP(S) URLs, remove fragments and tracking parameters as appropriate, stay on the intended publisher host, dedupe candidates, and apply strict source-specific article URL checks before detail scraping.
5. Query existing original and canonical URLs in chunks of at most 15 per `.in()` filter. Skip existing candidates. Recheck original and canonical URL before insert to avoid duplicates. Preserve append-only storage and handle database uniqueness races.
6. Fetch only surviving article detail pages through Oxylabs. Parse title, canonical URL, image URL, published timestamp, and article body from article-specific metadata and DOM. Do not synthesize a missing image or date. Reject canonical URLs that point to non-article pages.
7. Clean scripts, styles, ads, newsletter and subscription blocks, recommendations, related stories, social/share controls, repeated navigation, CSS dumps, and other page debris from `raw_text`. Split a single large body where possible. Accept at least three meaningful paragraphs or at least 900 meaningful characters with an otherwise clear article subject. Reject generic titles, headline collections, non-article pages, missing required metadata, and low-quality body text.
8. Insert only valid `NewArticle` rows with source reference, original and canonical URLs, image, published date, clean raw text, and null `analyzed_at`. Never delete or replace existing articles.
9. Emit concise server console progress and write useful entries to the existing `logs` table for run start, source progress/errors, and completion. Return a typed summary with status, sources checked, candidates found, candidates rejected, duplicates skipped, detail pages scraped, articles inserted, articles rejected, articles failed, duration, and rejection reasons grouped by count. Continue other sources after a source-level failure; make the final status reflect partial failure.
10. Keep route handling, Oxylabs requests, parsing, pipeline orchestration, and Supabase persistence in separate modules. Keep all work server-side; the UI only reads stored records.

## Security requirements

- Never send `SUPABASE_SERVICE_ROLE_KEY`, `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, or `BIASLY_ADMIN_SECRET` to browser code, responses, query strings, or logs.
- Validate source URLs from the database and candidate URLs before network requests. Permit HTTP(S) publisher URLs and prevent requests to loopback, private network, or unrelated hosts.
- Keep the admin secret comparison on the server and reject unauthorized calls before starting any scraping work.
- Preserve RLS and the existing server-only service-role data access pattern. Do not add public Data API grants.

## Acceptance criteria

- Authorized POST requests scrape selected active sources or all five active sources by default, with a default limit of five valid new articles per source.
- The scraper fetches source homepages only from Supabase and accepts only visible story card candidates that pass source-specific article URL checks.
- Invalid pages, missing images/dates, duplicate URLs, and poor article bodies do not become article rows.
- Existing articles remain unchanged across repeated runs.
- A run returns all required counters and rejection reasons, and its key progress is visible in the Next.js terminal and `logs` table.
- Unauthorized requests return 401 without external fetches or database writes.
- The shared pipeline can later consume scheduled homepage HTML without duplicating validation and persistence logic.

## Checks to run after implementation

- `npm run typecheck`
- `npm run lint`
- `npm run build` (route and server modules affect the production build)
- Perform a read-only Supabase verification query for inserted rows, required fields, duplicates, and recent logs after a user-triggered manual scrape. Avoid automatically starting a paid live scrape during checks.

## Exact manual test steps to share after implementation

1. Set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, and `BIASLY_ADMIN_SECRET` in `.env.local`; keep them server-only. Run `npm run dev` and watch that terminal for scrape progress.
2. Confirm missing-secret rejection with `curl.exe -i -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" -d "{}"`; expect 401.
3. Set a local shell variable for the admin secret without printing it. Call `curl.exe -i -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" -H "x-biasly-admin-secret: <your BIASLY_ADMIN_SECRET>" -d "{}"` to use all active sources and the default per-source limit.
4. For a small selected run, call `curl.exe -i -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" -H "x-biasly-admin-secret: <your BIASLY_ADMIN_SECRET>" -d "{\"sourceNames\":[\"Reuters\"],\"limitPerSource\":1}"` (adjust quoting to the shell). Expect a summary object and terminal progress.
5. In Supabase, check newly inserted article rows have source, original URL, image URL, published date, clean `raw_text`, and null `analyzed_at`; inspect recent `logs` rows. Repeat the same small run and confirm no existing article is replaced or duplicated.
