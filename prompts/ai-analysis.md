# Analyze pending articles so scraped news appears on the homepage

## Goal

Implement the server-side AI analysis pipeline and `POST /api/analyze`, then process the six currently pending scraped articles once `OPENAI_API_KEY` is configured. Save validated analysis before setting `articles.analyzed_at`, so the existing homepage and details queries can display the news.

## Skills and guidance read

- The user-provided `AGENTS.md` instructions, especially sections 2, 14–15, 19, 21–22. `AGENTS.md` is currently deleted in the working tree, so its tracked contents were also checked with `git show HEAD:AGENTS.md`; do not restore or overwrite the user's deletion as part of this task.
- `.agents/skills/ai-sdk/SKILL.md` for version-matched SDK documentation and model selection.
- `.agents/skills/supabase/SKILL.md` for server-only queries, validation, and verification.
- The installed Next.js route handler guide at `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` was read during the scraping implementation. Recheck relevant installed docs before coding.
- Before implementation, read the current Supabase changelog and relevant query documentation. Install `ai`, inspect its bundled docs/source and the OpenAI provider package docs before writing model calls; verify the selected current model ID against official documentation.

## Existing code and state inspected

- `app/page.tsx` calls `getHomeArticles()` and displays an empty state when no analyzed rows are returned.
- `lib/supabase/queries/articles.ts` requires both an inner joined `article_analyses` row and non-null `analyzed_at` for home and detail reads.
- `lib/supabase/queries/analyses.ts` already provides a LEFT JOIN based pending query, validates analysis records, inserts analysis, and sets `analyzed_at` only after a saved row exists.
- `lib/supabase/types.ts`, `supabase/schema.sql`, `lib/supabase/queries/logs.ts`, `app/api/scrape/route.ts`, `.env.example`, `package.json`, and `README.md`.
- Live read-only Supabase check: six `articles`, zero `article_analyses`, and zero articles with non-null `analyzed_at`. `OPENAI_API_KEY` is currently unset; `BIASLY_ADMIN_SECRET` and Supabase server credentials are configured.
- No `/api/analyze` route or AI model module exists. `ai` and `@ai-sdk/openai` are not installed.

## Decisions and assumptions

- Keep the homepage's analyzed-only behavior and existing card/detail layouts. The missing analysis pipeline, rather than the UI, is the cause of the empty page.
- Default POST behavior drains all pending valid articles in configurable batches (default `ANALYSIS_BATCH_SIZE=5`). Accept an optional total limit or selected article IDs for small runs; do not hardcode the current six IDs or source names.
- The OpenAI API key must be configured server-side in `.env.local` before a live run. Do not call the model until it is present. Choose a currently supported model suitable for structured article analysis after checking official/current SDK and provider documentation.
- Leave pgvector embeddings and scheduler integration to their separate approved work; this prompt implements section 19 analysis only.
- No schema change is expected. If one becomes necessary, update `supabase/schema.sql` and `lib/supabase/types.ts` together and provide the exact ALTER SQL before testing.

## Files likely to change

- Add `app/api/analyze/route.ts` as a thin POST handler.
- Add small server-only modules under `lib/ai/` and `lib/pipeline/` for the prompt/schema, model call, batching, retries, and progress summary.
- Refine `lib/supabase/queries/analyses.ts` only if needed to safely select requested IDs, repair partial saves, or keep full runs from retrying the same failed article indefinitely.
- Add `ai` and `@ai-sdk/openai` to `package.json` and `package-lock.json`; use existing Zod.
- Update `README.md` with exact manual run steps and any necessary `.env.example` clarification.

## Implementation requirements

1. Implement `POST /api/analyze` with `x-biasly-admin-secret` matching server-side `BIASLY_ADMIN_SECRET`. Return 401 before any work when missing or invalid. Validate JSON body, optional `limit` and selected `articleIds`, and reject invalid values. Do not expose secrets to the browser or logs.
2. Detect pending work from the absence of `article_analyses` rows through the existing LEFT JOIN helper, never from `analyzed_at IS NULL` alone. Skip invalid articles missing required text, image, or date. If an analysis row exists but its article timestamp is null, repair the timestamp only after confirming a valid saved analysis.
3. Process in configurable batches and continue until no unattempted pending articles remain in an unrestricted run. Track failed IDs within a run so one bad article cannot cause an infinite retry loop. Respect requested total limits and article IDs.
4. Use the Vercel AI SDK and OpenAI provider in server-only code. Give the model the article title and cleaned text, ask for a neutral summary, sentiment, political framing percentages/label, confidence, framing notes, loaded terms, and a disclaimer. Require evidence from article text; never infer framing from publisher name alone. Label framing as AI-estimated, not objective truth.
5. Validate model output with Zod before persistence: sentiment score in −1..1, valid sentiment label, percentages each 0..100 summing to 100, framing label in `left|center|right|mixed|unclear`, confidence in 0..1, sensible text fields, and low confidence/`unclear` for weak evidence. Retry invalid output once, then count the article as failed without saving bad analysis.
6. Derive `bias_score` in code as `(right_percentage - left_percentage) / 100`; store all fields required by `article_analyses`, including the actual model name. Mark `analyzed_at` only after valid analysis is saved. Preserve existing analyses and article text.
7. Emit neat server console progress and persist useful start, batch, error, and completion events to `logs`. Return a typed summary with analyzed, skipped, failed, batch count, duration, and status. Do not log full article text, prompt contents, API keys, or model responses.
8. After implementation and with the key configured, run a small live analysis first, verify the saved row and homepage rendering, then process the remaining pending valid articles. Confirm cards and details render stored analysis correctly. Do not invoke scraping as part of analysis.

## Security requirements

- Keep `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `BIASLY_ADMIN_SECRET` server-only; never use `NEXT_PUBLIC_` for these values.
- Only an authenticated admin-secret request may start model calls or database writes. Use POST, never URL query parameters for secrets.
- Keep analysis writes behind the service-role client and existing RLS rules. Do not add public database grants or browser-side model calls.
- Limit article text sent to the model to a bounded size sufficient for analysis, and avoid putting it in logs or API responses.

## Acceptance criteria

- An authorized default POST analyzes all pending valid articles and returns a complete summary; a selected/limited run respects its options.
- Missing or invalid admin secret returns 401 without model calls or writes.
- Invalid model output cannot enter `article_analyses`; `analyzed_at` remains null when no valid analysis is saved.
- A repeat run skips already analyzed articles, and an existing analysis row with a missing timestamp is repaired safely.
- The six current scraped articles can be analyzed after `OPENAI_API_KEY` is supplied; the homepage displays their news cards and the details pages show full analyses.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build` (new route and server modules affect the production build)
- Read-only Supabase verification query: article and analysis counts, required analysis fields, percentage totals, matching bias scores, and `analyzed_at` state. Check the homepage and a detail page after the live run.

## Exact manual test steps to share after implementation

1. Add `OPENAI_API_KEY` to `.env.local` without printing it. Keep `BIASLY_ADMIN_SECRET` set. Run `npm run dev` and watch that terminal for per-batch and final logs.
2. Confirm unauthorized behavior: `curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d "{}"` should return 401.
3. In PowerShell, set `$adminSecret = Read-Host "BIASLY_ADMIN_SECRET"`. For a one-article run, use `$body = '{"limit":1}'` and `$body | curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -H "x-biasly-admin-secret: $adminSecret" --data-binary '@-'`.
4. Check the new `article_analyses` row and the matching non-null `articles.analyzed_at`; refresh `http://localhost:3000` and open that card's detail page.
5. Process all remaining pending valid articles: `curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -H "x-biasly-admin-secret: $adminSecret" -d "{}"`. Confirm the final summary, more news cards, and no duplicate analyses on repeat.
