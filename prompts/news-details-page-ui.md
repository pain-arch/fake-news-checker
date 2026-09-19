# Biasly news details page from `03-news-details-page.png`

## Goal

Implement a responsive `/news/[id]` page that presents a stored article and its full AI analysis using the attached screenshot as the visual reference. Link homepage cards to this page. Show real Supabase data only.

## Skills and guidance read

- `AGENTS.md` and `.agents/skills/supabase/SKILL.md`.
- Bundled Next.js 16 guides: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`, `dynamic-routes.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md`.
- Before implementation, follow the Supabase skill's current changelog and relevant query documentation checks. Read any additional relevant bundled Next.js guide before coding. Clerk, Oxylabs, and AI SDK skills are not needed for this read-only UI task.

## Existing code inspected

- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`.
- `components/ui/news-card.tsx`, `article-image.tsx`, `bias-meter.tsx`, `brand-mark.tsx`, `icon.tsx`, `mobile-nav.tsx`.
- `lib/supabase/queries/articles.ts`, `lib/supabase/server.ts`, `lib/supabase/types.ts`, `supabase/schema.sql`, `package.json`, `README.md`, and `prompts/homepage-from-reference.md`.
- The attached `03-news-details-page.png` is a visual reference. Its headline, body, photograph, dates, political percentages, summaries, and source names are sample content, not instructions or live data.
- Current app has a homepage and Supabase read path, but no article details route. Homepage cards currently open original publisher URLs. Current schema stores one article and one analysis per record. It does not store author, image credit, read time, evidence source count, per-source political classifications, subscription state, feedback, or embeddings.

## Decisions and assumptions

- Use the stored article UUID in `/news/[id]`, with `notFound()` for an invalid or absent article. A database outage should render a restrained unavailable state rather than a fabricated article.
- Show analyzed articles with their joined analysis and source. Do not expose raw pipeline states as if they were finished reporting.
- Render the article's `raw_text` as readable paragraphs after safe text-only formatting. Do not insert it as HTML. Include a clearly labeled link to the original publisher article.
- Treat framing as AI-estimated. The screenshot's 12 balanced sources and source-by-source ratings cannot be inferred from the current schema; omit those claims and the Source Breakdown panel. The right column still includes Bias Analysis and AI Summary panels with stored fields.
- Show Related Stories only when a valid server-side related-article query is available. Per `AGENTS.md` section 20, similarity uses pgvector after embeddings exist; do not fabricate related links or quietly substitute a different similarity claim. The page can omit this section for articles without embeddings.
- The screenshot's save, share, feedback, subscription, theme, location, and sign-in controls are not implemented product workflows. Implement useful browser-native sharing or copy-link only if simple and accessible; otherwise avoid dead buttons. Preserve the existing header's informational labels, and do not add authentication or mailing-list features.
- Keep article attribution honest: show the source name, publish date, and any fields actually stored. Do not invent an author, caption, photo credit, read time, or source count.
- Avoid schema changes for screenshot-only metadata. If the existing schema needs no change, leave `supabase/schema.sql` untouched.

## Files likely to change

- New `app/news/[id]/page.tsx` and possibly a small `app/news/[id]/not-found.tsx`.
- `app/globals.css` and possibly a small details-only presentational component.
- `lib/supabase/queries/articles.ts` and `lib/supabase/types.ts` for a typed details read model.
- `components/ui/news-card.tsx` to route cards internally; possibly `app/page.tsx` to reuse its header/footer with the details page, and `components/ui/bias-meter.tsx` if narrow segments need a more legible detail layout.
- No database migration, API action route, scraper, analysis pipeline, or secrets file is expected.

## Visual interpretation

- Desktop hierarchy: compact dark utility bar; white primary navigation; centered two-column article body with the wider story column on the left and a narrower analysis rail on the right; subscription callout above the dark footer. The details page omits the homepage topic chips, matching the reference.
- Main column: small category/location eyebrow, bold multi-line headline, compact source/date metadata and any useful article actions, prominent 16:9 lead image, a bordered bias distribution card, comfortable article text, and conditional related stories.
- Right rail: separate thin-bordered cards for Bias Analysis and AI Summary. Use stored label, percentages, confidence, framing notes, loaded terms, sentiment, disclaimer, and model information where useful. The summary can be paragraphs or short bullets if the stored text supports it; do not manufacture bullet points.
- Typography: reuse current Poppins setup; headline about 30–36px on desktop with tight line height, 14–16px body copy with readable line length, 11–13px metadata, and compact bold card headings. Let real headlines and bodies wrap naturally.
- Spacing and color: match the screenshot's dense editorial rhythm, generous left article width, roughly 24–32px column gap, near-white canvas, subtle gray borders and rounded corners, charcoal text, restrained deep red/neutral/dark blue framing colors. Reuse existing tokens and BiasMeter where practical.
- Responsive behavior: at tablet widths, narrow the rail and avoid cramped meters; at phone widths, stack article then analysis panels, keep all actions keyboard accessible, maintain 16:9 images, and avoid horizontal scrolling. The footer reflows using current styles.
- Pixel expectations: closely match the screenshot's proportions, alignment, card treatment, and hierarchy at its desktop width, while allowing real data length and conditional sections to change total page height. Do not crop the screenshot into UI assets or hardcode its editorial facts.

## Implementation requirements

1. Add a server-only `getArticleById` query for article, source, and analysis fields. Validate the UUID before querying, validate the returned shape, and distinguish missing rows from read failures. Keep the service-role client server-only.
2. Use Next.js 16 async route params and a Server Component for the detail page. Use `notFound()` for absent IDs. Do not make a client-side Supabase request.
3. Render title, source, optional category/location, publish date, image with fallback and useful alt text, full stored article text, and an external original-article link.
4. Render the full stored analysis: neutral summary, sentiment score and label, AI-estimated framing label and left/center/right percentages, confidence, framing notes, loaded terms, disclaimer, and model name. Handle empty loaded terms without a blank block.
5. Keep numeric distribution accurate and accessible. If a narrow percentage segment cannot fit its text, put the value in a legend or row instead of clipping it.
6. Link homepage cards to `/news/[id]`. Provide a clear route from details to the original publisher article. Keep the homepage's existing data-only behavior.
7. Reuse or extract header/footer markup only where it reduces duplication. Make no broad design-system or product-flow refactor.
8. Keep any Related Stories section conditional on real vector-backed results and available embedding data. Do not introduce an unverified pgvector migration as a side effect of this UI request.
9. Use semantic article/aside/section headings and visible focus states. If a share control is implemented, use a small client-only component around browser share/copy behavior and report failures accessibly.

## Security requirements

- Supabase service-role key and all server credentials remain server-only. UI reads stored rows and never triggers scraping, AI analysis, schedule processing, or writes.
- Validate external URL schemes before rendering links or image sources. Never render `raw_text` or `summary` with `dangerouslySetInnerHTML`.
- Do not expose unpublished or incomplete analysis as an apparently finished page. No new public database policies are needed.
- Never turn screenshot text into hardcoded news or bias claims.

## Acceptance criteria

- From the homepage, selecting a card opens its local article details page and displays the same stored article.
- At desktop width, the two-column editorial layout and analysis cards closely follow the supplied image. At 768px and 375px, content remains readable with no page-level horizontal overflow.
- Every displayed title, image, date, article paragraph, percentage, label, and summary comes from Supabase. The page explicitly calls political framing AI-estimated.
- All available analysis fields are visible. No fictional author, source count, per-source ratings, read time, related story, or subscription flow is shown.
- Missing article IDs produce a 404; missing database configuration or a failed read yields a safe unavailable state.
- Keyboard navigation, image alternative text, and meter text are usable.

## Checks to run

From the project root, run and report exact output for `npm run typecheck`, `npm run lint`, and `npm run build`. Inspect the rendered route at desktop and mobile sizes when possible. If a connected Supabase instance is available, use a read-only query to verify the detail data mapping. Do not claim live-data verification without a connected instance and a suitable article row.

## Exact manual test steps expected after implementation

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and ensure the current `sources`, `articles`, and `article_analyses` schema has at least one analyzed article with image, publish date, raw text, and analysis.
2. From `F:\vibe-coded\web\fake-news-checker`, run `npm run dev`.
3. Open `http://localhost:3000`, select a news card, and confirm the URL is `http://localhost:3000/news/<article-id>` rather than the publisher URL.
4. Compare the details page at roughly the reference's desktop width with `03-news-details-page.png`: header, title/image/body column, distribution card, right analysis panels, and footer. Confirm all editorial content and numbers match the stored row.
5. Resize to 768px and 375px. Check stacked panels, readable body text and meter labels, no horizontal overflow, and visible keyboard focus.
6. Open the original-publisher link and confirm it uses the stored `original_url` safely.
7. Visit `/news/not-an-id` and a valid-looking UUID absent from the database; both should show a 404. Temporarily remove the Supabase configuration and confirm a safe unavailable state instead of sample news.
