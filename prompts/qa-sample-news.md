# Three synthetic news records for page QA

## Goal

Add three clearly fictional, analyzed news records so the existing Home and News details pages can be QA tested with populated cards and full analysis panels.

## Skills and guidance read

- `AGENTS.md` and `.agents/skills/supabase/SKILL.md`.
- Bundled Next.js 16 guides: `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md` and `12-images.md`.
- Before execution, check the Supabase changelog and relevant current SQL documentation as the Supabase skill requires. No Clerk, Oxylabs, or AI SDK workflow is needed for static QA fixtures.

## Existing code inspected

- `app/page.tsx`, `app/news/[id]/page.tsx`, `components/ui/news-card.tsx`, and `components/ui/article-image.tsx`.
- `lib/supabase/queries/articles.ts`, `lib/supabase/types.ts`, `lib/supabase/server.ts`, `supabase/schema.sql`, `package.json`, and `.env.example`.
- The home and details queries read Supabase rows only. They require a joined source and analysis, valid HTTP image/original URLs, a publish date, article body, and non-null `analyzed_at`.

## Decisions and assumptions

- Create exactly three synthetic articles and analyses under one inactive source named `Biasly QA Fixtures`. Its `listing_url` and each article's `original_url` use reserved `example.invalid` URLs, so they cannot be confused with reporting or scraped by the active-source pipeline. The original-article link will intentionally have no live destination.
- Store fixtures in Supabase via a repeatable SQL seed file, rather than adding fallback news to UI code or local JSON storage. Do not modify production query behavior.
- Use three distinct fictional civic topics and varied card lengths, sentiment, framing labels, percentages, and loaded terms to exercise the UI. All summaries and framing notes must clearly describe the stories as synthetic QA content, never a real AI result. Use `model = 'qa-fixture'` and the standard AI-estimate disclaimer.
- Use stable fixture UUIDs and conflict-safe inserts so rerunning the seed does not duplicate rows or overwrite non-fixture rows. Include narrowly scoped cleanup SQL, but do not run it unless asked.
- Use HTTPS placeholder image URLs with descriptive labels. The existing image fallback handles an unavailable image host. No external news imagery or publication identity is needed.

## Files likely to change

- New `supabase/seed-qa-news.sql` with source, article, and analysis inserts plus verification queries and clear application instructions.
- Possibly a short README section pointing to the seed and cleanup steps. No schema, page, query, scraper, or API changes are expected.

## Implementation requirements

1. Insert an inactive QA source with a unique reserved listing URL.
2. Insert three articles with unique reserved original/canonical URLs, plausible but explicitly fictional titles, meaningful multi-paragraph body text, required image URL and publish date, category/location, scraped timestamp, and non-null analyzed timestamp.
3. Insert one valid analysis per article with every required column. Percentages must each be 0–100 and total 100; `bias_score` must equal `(right_percentage - left_percentage) / 100`. Include positive, neutral, and negative sentiment examples and at least two framing labels.
4. Make insertion repeatable and constrained to fixture IDs/URLs. Provide verification SQL that returns the three joined records and all fields needed by both pages.
5. Keep fixtures visually and textually labeled as synthetic. Avoid invoking Oxylabs or OpenAI.

## Security requirements

- Do not add credentials, keys, or secrets to the seed, repository, or browser code.
- Keep the source inactive so automatic scraping never targets the reserved domain.
- Do not relax RLS or grant browser write access. Do not modify or delete existing real articles.
- Treat all framing values as mock UI data and disclose that in the fixture copy.

## Visual interpretation and QA coverage

- Retain the current layout, typography, spacing, colors, and responsive behavior. This task supplies content to exercise them and does not redesign either page.
- Use one short, one medium, and one long headline to reveal card wrapping and grid alignment issues. Give each story several body paragraphs so the detail column can be checked for readable spacing.
- Give the three records distinct image labels and content categories so cards are easy to distinguish at desktop, tablet, and phone widths. Use contrasting left/center/right splits to exercise meters and detail percentage bars.
- Pixel-perfect expectation: no requested design change; populated pages should preserve the existing design without clipping, overlap, or horizontal overflow.

## Acceptance criteria

- After the seed runs against the configured Supabase database, exactly three QA fixture cards appear among any existing analyzed news on the Home page, subject to the current 12-article limit and publish-date ordering. Use recent fixed dates so they are visible.
- Each fixture card opens `/news/<fixture-id>` and shows its matching full article, image or fallback, analysis, loaded terms, disclaimer, and model value.
- All three analyses pass existing schema checks and query validation. The source remains inactive.
- Rerunning the seed produces no duplicate records and leaves non-fixture content unchanged.

## Checks to run

- `npm run typecheck` and `npm run lint`, reporting exact output. A build is unnecessary if only a SQL seed and documentation change.
- Run the verification SQL against a connected Supabase project if available; otherwise provide the exact Dashboard SQL Editor steps and state that live DB verification was not performed.
- Inspect the Home and each details page at desktop and narrow mobile widths when a connected instance is available.

## Exact manual test steps expected after implementation

1. Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; do not share their values.
2. Apply `supabase/schema.sql` first if the tables are not present. In Supabase Dashboard → SQL Editor, run `supabase/seed-qa-news.sql`.
3. Run its verification query and confirm three rows with an inactive source and complete analyses. Run it a second time to confirm idempotency.
4. From the project root, run `npm run dev`, then open `http://localhost:3000`. Find the three `Biasly QA Fixtures` cards.
5. Open each card. Confirm title, body, source, date, image or fallback, sentiment, AI-estimated framing percentages, confidence, notes, loaded terms, summary, disclaimer, and `qa-fixture` model. The `Read original` link uses a reserved, intentionally nonfunctional URL.
6. Check the Home grid and details pages at desktop and about 375px width for wrapping and horizontal overflow.
7. When QA is complete, run the cleanup SQL scoped to the three fixture IDs if the fixture records are no longer wanted.
