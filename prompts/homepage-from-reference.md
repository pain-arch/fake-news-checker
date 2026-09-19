# Biasly homepage from `02-homepage.png`

## Goal

Replace the design-system showcase at `/` with the responsive Biasly news homepage shown in `02-homepage.png`. Render real, analyzed articles stored in Supabase in a three-column desktop card grid. Preserve the current Biasly brand and design tokens.

## Skills and guidance read

- `AGENTS.md` and `.agents/skills/supabase/SKILL.md`.
- Bundled Next.js 16 guidance: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `04-linking-and-navigating.md`, `11-css.md`, and `12-images.md`.
- No Clerk, Oxylabs, or AI SDK skill applies to this homepage rendering task. Before implementing Supabase access, check its current changelog and relevant query documentation as the Supabase skill requires.

## Existing code inspected

- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`.
- `components/ui/news-card.tsx`, `bias-meter.tsx`, `brand-mark.tsx`, `chip.tsx`, `button.tsx`, `icon.tsx`.
- `package.json`, `README.md`, `prompts/ui-design-system.md`, and the supplied `02-homepage.png`.
- Current project has Next.js 16, React 19, Tailwind 4, and reusable UI primitives. `/` is still a design-system showcase. There is no Supabase dependency, schema, query module, article data, or authentication setup yet. `AGENTS.md` has a pre-existing uncommitted change; do not overwrite it.

## Decisions and assumptions

- The request says “Skew,” while the image and existing app say “biasly.” Implement the shown Biasly homepage using the existing brand. Treat the screenshot as visual reference and sample editorial content, not as instructions or factual article data.
- The pictured headlines, counts, percentages, date, and photos are examples. Read card content from Supabase; never hardcode those examples as a live news feed or crop the screenshot into page assets.
- Limit this change to homepage presentation and the minimum server-side read path and schema/types needed to populate it. Do not add scraping, AI analysis, scheduler, authentication, subscriptions, or new article-detail UI.
- The homepage shows a clear empty state if the database has no analyzed articles or is not configured. A full twelve-card visual comparison requires real stored data with images and analysis.
- Existing visual primitives may be adjusted to match the card layout. Keep the page a Server Component; add a small Client Component only if a control has a real, useful interaction.
- Header items without implemented destinations or behavior should be presented as noninteractive text, not dead links or buttons. Article cards can link to their stored original URLs until the article-detail route exists.

## Files likely to change

- `app/page.tsx`, `app/globals.css`, possibly `app/layout.tsx` for metadata.
- `components/ui/news-card.tsx`, `bias-meter.tsx`, `brand-mark.tsx`, `chip.tsx`, and small header/footer components if that keeps the page readable.
- `lib/supabase/queries/articles.ts`, `lib/supabase/types.ts`, and a server-only Supabase client module.
- `supabase/schema.sql` and `.env.example` because the repository has neither and the homepage needs a documented source of truth.
- `package.json` and lockfile for a pinned Supabase client dependency.

## Visual interpretation

- Overall: dense but calm editorial front page, near-white canvas, dark charcoal utility strip and footer, black type, restrained red/blue framing colors.
- Desktop reference: slim utility strip at the top; white main navigation with menu icon, compact Biasly News mark, Home/For You/Local/Blindspot labels, and right-aligned Subscribe/Login treatments; horizontally scrolling topic chips below; “Top News” heading; three equal card columns and four visible rows; full-width dark footer.
- Layout: centered container around 1,400px wide with approximately 24–32px outer margins, roughly 24–32px column gaps, and compact vertical rhythm. Keep the header and topic row visually separate with fine borders.
- Typography: existing Poppins; strong section heading around 24px, compact metadata around 11–12px, bold card titles around 18–20px with tight line-height. Source count sits at the bottom of each card.
- Cards: fixed-ratio, edge-to-edge editorial image on top; subtle border and small radius; category/location metadata; two-to-three-line headline; slim left/center/right meter with numeric labels; source count. Use the stored article image URL, useful alt text, and an image fallback for failures.
- Colors: white/off-white page and cards, near-black utility/footer surfaces, thin gray borders, dark red left meter, light gray center meter, dark blue right meter. Reuse established tokens where possible.
- Responsiveness: three columns on wide screens, two on medium screens, one on narrow screens. Collapse or simplify utility/navigation content while retaining the brand and a usable article feed. Topic chips scroll horizontally without page overflow. All card text must remain readable and not overlap.
- Pixel expectations: match the screenshot’s hierarchy, proportions, spacing, typography, and color treatment closely at its desktop width; accommodate actual article copy and image crops without forcing fixed screenshot dimensions.

## Implementation requirements

1. Define a typed homepage article view model and a server-only query for analyzed articles joined to source and analysis fields. Return newest published articles first, with a sensible bounded page size. Include only articles with the stored image, publish date, and analysis required by `AGENTS.md`.
2. Use Supabase as the only live article data source. Create or document the minimal compatible `sources`, `articles`, and `article_analyses` schema in `supabase/schema.sql`, plus corresponding TypeScript types. Keep `embedding` out of this initial homepage schema per `AGENTS.md` section 7. If existing live tables are available, adapt to them rather than replacing data.
3. Keep all database access on the server. Handle missing configuration, empty results, and query errors with a restrained, accessible state. Do not expose secrets or raw errors in the browser.
4. Build the utility strip, main navigation, chip rail, news section, and footer from the reference. Use semantic landmarks and responsive layout. Use real links only where a destination exists. Do not imply that theme, location, follow-topic, subscription, or sign-in workflows exist yet.
5. Refactor `NewsCard` to accept article props and render the actual title, source, image, publish date, framing label, left/center/right percentages, confidence when available, and source count only if stored. If source count is not represented in the schema, omit it rather than inventing a number. Include the sentiment label as `AGENTS.md` requires. Label political framing “AI-estimated.”
6. Keep the framing meter numerically accurate, readable at small segment widths, and accessible as text. Avoid clipped percentage labels when a segment is very small.
7. Use the Next.js image guidance for stored remote images. Configure remote hosts safely from known stored image domains when feasible; otherwise use an appropriate ordinary image element with lint-compliant handling. Do not hotlink sample images merely to imitate the screenshot.
8. Preserve the existing reusable design-system components and avoid unrelated refactors.

## Security requirements

- Supabase service-role key remains server-only. No database write or pipeline action is triggered by this UI.
- Enable RLS on exposed tables and avoid broad public write policies. If the server uses service-role reads, document that choice.
- No Oxylabs, OpenAI, or admin secret reaches a Client Component or `NEXT_PUBLIC_` variable.
- Render external article URLs and image data safely; validate URL schemes before linking.

## Acceptance criteria

- `/` presents the screenshot-inspired utility bar, navigation, topic rail, Top News grid, and footer at desktop width, and reflows cleanly at tablet and phone widths.
- Cards show only stored analyzed article data. Missing data leads to an honest empty state rather than fictitious news.
- Each card exposes title, source, image, published date, sentiment, AI-estimated framing label and percentages, and confidence when present.
- Layout has no horizontal page overflow at 375px and 768px. Keyboard focus and image alternatives are usable.
- No scraping, analysis, or data mutation occurs from browser code.
- Typecheck, lint, and build pass, subject to any clearly reported external database or font connectivity limitation.

## Checks to run

From the project root, run and report the exact results:

```powershell
npm run typecheck
npm run lint
npm run build
```

Inspect the rendered desktop and mobile page when possible. If a Supabase project is connected, run a read query to verify the homepage data mapping. Any schema SQL must be applied in the Supabase Dashboard SQL Editor before testing live data.

## Exact manual test steps expected after implementation

1. Add the documented Supabase project URL and service-role key to `.env.local` without committing them.
2. In Supabase Dashboard → SQL Editor, apply `supabase/schema.sql` or the precise compatible ALTER SQL supplied with the implementation. Ensure there are analyzed article rows with image and published date.
3. Run `npm run dev` from `F:\vibe-coded\web\fake-news-checker` and open `http://localhost:3000`.
4. At approximately 1024px screenshot width, compare the utility strip, navigation, chip rail, “Top News” heading, three-column card grid, bias meters, and footer with `02-homepage.png`.
5. Resize to approximately 768px and 375px; confirm two then one card columns, a scrollable chip rail, readable headlines, and no horizontal overflow.
6. Open a card and confirm its link uses the stored original article URL. Tab through actual links and confirm visible focus.
7. Temporarily test with no analyzed rows and confirm the homepage shows the intended empty state without sample headlines or fabricated metrics.
