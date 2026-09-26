# Implement the AI article analysis pipeline

## Goal

Implement the production-style, server-only AI article analysis pipeline and `POST /api/analyze`. The endpoint must find valid articles that have no `article_analyses` row, generate and validate structured analysis with the Vercel AI SDK and OpenAI provider, persist the analysis in Supabase, and set `articles.analyzed_at` only after a valid analysis row is saved.

This task implements AGENTS.md section 19 only. It must not add pgvector embeddings, related articles, Oxylabs Scheduler, or new UI behavior.

## Skills and guidance read

- `AGENTS.md`, especially sections 2, 5, 7, 14-15, 19, and 21-22.
- `.agents/skills/supabase/SKILL.md` for service-role isolation, current documentation checks, RLS safety, query verification, and left-join behavior.
- `.agents/skills/ai-sdk/SKILL.md` for version-matched SDK/provider documentation, structured output, current model verification, and post-change type checking.
- Installed Next.js 16.3.5 guidance in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` and `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md`: Route Handlers are public endpoints, POST handlers are uncached, request bodies must be validated, credentials must be checked in the handler, sensitive errors must not be returned, and long-running handlers may be terminated by the deployment platform.
- Before coding model calls, install the required pinned packages and read the installed, version-matched `ai` and `@ai-sdk/openai` documentation/source. Before coding Supabase behavior, recheck the current Supabase changelog and relevant JavaScript insert/join documentation. Do not rely on remembered APIs.

## Existing code inspected

- `package.json` and `package-lock.json`: Next.js 16.3.5, Supabase JS 2.116.0, and Zod 4.6.5 are installed; `ai` and `@ai-sdk/openai` are not installed.
- `app/api/scrape/route.ts`: existing POST action-route conventions, bounded request body parsing, Zod validation, Node runtime, five-minute duration, and timing-safe admin-secret comparison.
- `lib/supabase/server.ts`: server-only service-role client creation.
- `lib/supabase/queries/analyses.ts`: existing left-join pending lookup, analysis validation/persistence, duplicate handling, and post-save timestamp update.
- `lib/supabase/queries/articles.ts`: homepage and details reads require both a saved analysis and non-null `analyzed_at`.
- `lib/supabase/queries/logs.ts`: persistent pipeline log helper.
- `lib/supabase/types.ts` and `supabase/schema.sql`: required analysis fields and database constraints already exist; no schema change is currently needed.
- `lib/pipeline/scrape.ts`: existing pipeline summary and console/persistent logging style.
- `README.md`: scraping documentation exists but analysis setup and invocation documentation do not.
- `.env.local`: required Supabase, OpenAI, admin-secret, and batch-size variable names are present. Secret values were not printed or inspected.
- `.env.example` is missing even though AGENTS.md defines it as the canonical environment-variable list.
- Live read-only Supabase count on 2026-09-25: 52 articles, zero `article_analyses` rows, and zero articles with non-null `analyzed_at`.

## Decisions and assumptions

- The request authorizes implementation, not an automatic paid production run across all 52 pending articles. Verification will use checks and read-only queries; the user can trigger a one-article live run with the documented curl command.
- Default authorized behavior processes all pending valid articles, in batches, until none remain. An optional `limit` caps the total work for a manual run, and optional `articleIds` restricts work to selected UUIDs. These options must not be hardcoded to current rows or sources.
- `ANALYSIS_BATCH_SIZE` defaults to 5 and is parsed defensively with a small upper bound. Invalid configuration falls back safely rather than producing an unbounded run.
- The AI model is a server-side constant selected only after verifying a currently supported OpenAI model ID in official/version-matched documentation. Save the exact model ID used with each analysis. Do not add an undocumented environment variable just to select the model.
- Limit article text sent to the model by a centralized character budget while retaining the title and enough body content for analysis. Never include the publisher/source name as political-framing evidence.
- Retry once only for model-call or invalid-output failure. A failed article is recorded for the current run and must not be selected repeatedly in an infinite loop.
- Leave existing valid analyses untouched. If an analysis already exists while `analyzed_at` is null, repair only the timestamp after validating that saved analysis row; do not call the model again.
- No schema migration is expected. If implementation reveals a real schema mismatch, stop and update `supabase/schema.sql` and `lib/supabase/types.ts` together, then provide exact ALTER SQL rather than silently changing the contract.

## Files likely to change

- Add `app/api/analyze/route.ts` as a thin authenticated POST handler.
- Add focused server-only modules under `lib/ai/` for the structured schema/prompt and OpenAI call.
- Add `lib/pipeline/analyze.ts` for batching, retries, logging, selection, and summary generation.
- Update `lib/supabase/queries/analyses.ts` for selected-ID/failed-ID-safe pending reads and safe stale-timestamp repair if necessary.
- Update `package.json` and `package-lock.json` with pinned `ai` and `@ai-sdk/openai` dependencies.
- Add `.env.example` with the complete canonical variable list from AGENTS.md and placeholder values only.
- Update `README.md` with analysis setup and exact manual test commands.

## Implementation requirements

1. Add `POST /api/analyze` only. Use the Node.js runtime and an appropriate route duration. Require `x-biasly-admin-secret` to match server-side `BIASLY_ADMIN_SECRET` using timing-safe comparison. Return `401` before any model or database work when missing or invalid.
2. Bound the request body size and validate strict JSON with Zod. Support optional `limit` as a positive bounded integer and optional `articleIds` as a non-empty bounded array of unique UUIDs. Return `400` for malformed JSON or invalid options without exposing internals.
3. Keep the route handler thin: authenticate, parse/validate input, invoke the analysis pipeline, and translate the typed result or sanitized failure into JSON.
4. Detect pending articles by left joining `articles` to `article_analyses` and selecting rows for which no analysis row exists. Never rely on `analyzed_at IS NULL` alone and do not use a joined-table `.eq('foreignTable.column', ...)` filter. Apply requested-ID filtering safely and skip invalid rows missing meaningful text, image, or published date.
5. Process configurable batches until no eligible pending work remains for an unrestricted run. Respect the total `limit` and selected IDs. Track attempted/failed IDs so a failed article is not retried by later batches in the same run.
6. Use the installed Vercel AI SDK and `@ai-sdk/openai` APIs exactly as documented for their installed versions. Use structured output validated by Zod. Send the article title and bounded article body only; instruct the model to use article-text evidence, avoid publisher-based inference, remain neutral, and treat political framing as AI-estimated rather than objective truth.
7. Require structured fields for neutral summary, sentiment score and label, political-framing label, left/center/right percentages, confidence, framing notes, loaded terms, and disclaimer. Enforce:
   - sentiment score in `-1..1` and label in `positive|neutral|negative`;
   - each percentage in `0..100`, with all three summing exactly to 100 after deterministic normalization if needed;
   - framing label in `left|center|right|mixed|unclear` and consistent with the strongest percentage unless evidence is weak or percentages are close;
   - confidence in `0..1`, with weak evidence represented as `unclear` and low confidence;
   - non-empty bounded text fields and a bounded string array for loaded terms.
8. Retry a model/validation failure once. After the second failure, record a sanitized error log, count the article as failed, leave both `article_analyses` and `analyzed_at` unchanged, and continue with other articles.
9. Derive `bias_score` in trusted code as `(right_percentage - left_percentage) / 100`; never accept a model-provided bias score. Persist all `NewArticleAnalysis` fields, including the exact model ID. Save the analysis first, then set `analyzed_at`. Preserve append-only articles and existing analyses.
10. Handle partial persistence safely: if the analysis insert exists but timestamp update failed, verify the stored row and repair `analyzed_at` without invoking the model again. Do not overwrite a concurrent valid analysis.
11. Emit concise server console progress and best-effort persistent `logs` entries for start, each batch, per-article failure, and completion. Return a typed summary containing status, analyzed count, skipped count, failed count, batch count, duration, and sanitized failure details/IDs as appropriate. Never log or return article bodies, prompts, raw model responses, credentials, or provider error payloads.
12. Add `.env.example` containing the complete AGENTS.md environment table with safe placeholders, including `OPENAI_API_KEY`, `BIASLY_ADMIN_SECRET`, and optional `ANALYSIS_BATCH_SIZE=5`; do not copy real `.env.local` values and do not add `CRON_SECRET` to local setup instructions.
13. Document unauthorized, one-article, selected-ID, default-all-pending, and repeat-run behavior in `README.md`. Do not trigger scraping or alter UI code as part of analysis.

## Security requirements

- Keep `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `BIASLY_ADMIN_SECRET` server-only. Never prefix them with `NEXT_PUBLIC_`, send them to client components, include them in responses, or print them in logs.
- Treat the Route Handler as publicly reachable. Perform authorization in the handler before parsing expensive work or calling external services.
- Use only the server-side service-role client for pipeline reads and writes. Do not weaken RLS, add public grants, or expose analysis mutations to browser code.
- Bound request size, selected IDs, batch size, total limit, model input length, model output fields, and retry count to control cost and abuse.
- Return sanitized errors. Do not expose Supabase error messages, OpenAI responses, stack traces, or secret/configuration values.

## Acceptance criteria

- Missing or incorrect admin secret returns `401` with no model call or database mutation.
- Invalid JSON/options return `400`; a valid authorized request invokes the server-only pipeline.
- Default behavior drains all valid pending rows in bounded batches; `limit` and `articleIds` constrain the run correctly.
- Pending detection is based on absence of `article_analyses`, including the stale case where `analyzed_at` is non-null but no analysis exists.
- Each saved analysis passes schema validation and database constraints, percentages total 100, and `bias_score` equals `(right - left) / 100`.
- Invalid output is retried once and never saved after the second failure; other articles continue processing.
- `analyzed_at` is set only after a valid analysis exists, and partial-save timestamps can be repaired without duplicate model calls.
- Existing analysis rows are not overwritten or duplicated. A repeat run reports no new eligible work.
- Homepage cards and detail pages can display newly stored analysis without UI changes.
- No embedding, pgvector, related-article, scheduler, or scraping behavior is added.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Read-only Supabase verification: compare article, analysis, pending, and analyzed counts; inspect required fields; verify percentage totals, derived bias scores, and matching `analyzed_at` state.
- Exercise the unauthorized endpoint locally to confirm `401` without spending model tokens.
- Do not claim a live OpenAI/Supabase write test passed unless the authorized one-article curl command is actually run and its saved row is verified.

## Exact manual test steps expected after implementation

1. Copy `.env.example` to `.env.local` only if starting fresh. Set real `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `BIASLY_ADMIN_SECRET`; optionally set `ANALYSIS_BATCH_SIZE=5`. Do not put `CRON_SECRET` in `.env.local`.
2. Run `npm run dev` and watch that terminal for batch progress and the final summary.
3. Confirm unauthorized behavior:
   `curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d "{}"`
   Expect `401` and no model/database work.
4. In PowerShell, set the secret without printing it:
   `$adminSecret = Read-Host "BIASLY_ADMIN_SECRET"`
5. Run one article first:
   `$body = '{"limit":1}'`
   `$body | curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -H "x-biasly-admin-secret: $adminSecret" --data-binary '@-'`
6. In Supabase, verify one valid `article_analyses` row, exact percentage total 100, matching derived bias score, and a non-null `articles.analyzed_at`. Refresh `http://localhost:3000` and open the new card's detail page.
7. Test selected IDs by replacing the placeholders with real pending UUIDs:
   `$body = '{"articleIds":["<article-uuid>"],"limit":1}'`
   `$body | curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -H "x-biasly-admin-secret: $adminSecret" --data-binary '@-'`
8. Process all remaining pending valid articles only when intended:
   `curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -H "x-biasly-admin-secret: $adminSecret" -d "{}"`
9. Repeat the request and confirm no duplicate analysis rows are created and no already analyzed article is sent to OpenAI again.
