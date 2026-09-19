# Rename the product to Fake or Real

## Goal

Make the visible product brand and project/package name **Fake or Real**. Remove the visible “Biasly News” identity from the Home and News details pages without changing article data flow or page features.

## Skills and guidance read

- `AGENTS.md` instructions supplied in this conversation.
- Bundled Next.js 16 guide: `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md` for root metadata.
- No Clerk, Supabase, Oxylabs, or AI SDK implementation skill is needed for the UI and package rename. Existing Supabase fixture data remains synthetic QA content.

## Existing code inspected

- `components/ui/brand-mark.tsx`, `components/ui/mobile-nav.tsx`, `components/site-chrome.tsx`, `app/layout.tsx`, `app/globals.css`.
- `package.json`, `package-lock.json`, `README.md`, `.env.example`, `supabase/schema.sql`, and `supabase/seed-qa-news.sql`.
- The current logo renders lowercase `biasly`; header labels, footer copyright, and metadata say Biasly. The npm package is `fake-news-checker`. The QA seed calls its inactive source `Biasly QA Fixtures` and uses reserved `biasly-qa.example.invalid` URLs.
- Current Git state contains pre-existing staged and unstaged edits, including a staged deletion of `AGENTS.md`; preserve those changes rather than resetting or restoring them.

## Decisions and assumptions

- Display the brand exactly as **Fake or Real** in the logo, accessible labels, footer copyright, and browser title. Rename the npm package to `fake-or-real`, including lockfile root package entries. Do not rename the workspace directory.
- Keep the existing neutral news-analysis description/tagline unless it includes the old brand. Do not imply the app determines factual truth with certainty.
- Update QA fixture source label and reserved URL host to `fake-or-real-qa.example.invalid` for a clean repository rename. Since the database is not configured in this workspace, do not attempt a live data migration; make the seed safe for first-time use and keep optional cleanup scoped to its new fixture identifiers/URLs. If existing users already applied the old seed, document that old rows need separate cleanup.
- Keep `BIASLY_ADMIN_SECRET` unchanged for now: it is a documented internal security variable in the project instructions, and changing its contract is outside a visual/package rename. It is not shown to users.
- Do not alter or run the article pipeline, source selection, authentication, or any secrets.

## Files likely to change

- `components/ui/brand-mark.tsx`, `components/ui/mobile-nav.tsx`, `components/site-chrome.tsx`, `app/layout.tsx`, and possibly `app/globals.css` for a longer wordmark.
- `package.json` and `package-lock.json` root package name.
- `README.md`, `supabase/schema.sql` comment, and `supabase/seed-qa-news.sql` brand references.
- No database schema or query behavior change is expected.

## Implementation requirements

1. Replace all user-facing Biasly/Biasly News labels with Fake or Real, including accessible home-link labels and footer copyright.
2. Change root metadata title to start with Fake or Real, retaining an accurate analysis-oriented description.
3. Rename npm package metadata consistently in package and lock files without reinstalling or changing dependency versions.
4. Check the longer wordmark in header, mobile navigation, and footer. Make only the CSS or font-size adjustment needed to avoid clipping or collision.
5. Update current QA fixture and documentation copy to the new name. Preserve stable fixture UUIDs, three article/analysis records, their numerical values, inactive source status, and repeatable inserts.
6. Search active source files and docs for remaining user-facing `biasly` references. Leave historical prompt files and the internal secret variable alone.

## Security requirements

- Do not print, rename, or expose secret values. No browser code receives server-only variables.
- Do not loosen Supabase RLS or change schema grants. The QA source remains inactive.
- Preserve safe link handling and article rendering on both pages.

## Visual interpretation

- Keep the current minimal editorial layout, Poppins typography, near-white canvas, dark utility bar/footer, and existing spacing and colors.
- The new wordmark uses title case with spaces: “Fake or Real”. It should feel like the primary visual brand in the header and footer, with similar weight to the current mark.
- Recheck desktop and narrow mobile widths because the new name is longer. Keep the logo aligned with the navigation and prevent overflow or overlap. Do not redesign cards, topic chips, or analysis panels.
- Pixel-perfect expectation: preserve the current page proportions and rhythm while accommodating the longer text; no requested visual reference image exists for a new logo treatment.

## Acceptance criteria

- Header, mobile menu, footer, accessible brand labels, and browser tab use Fake or Real; no user-facing “Biasly News” remains.
- `package.json` and `package-lock.json` identify the project as `fake-or-real`.
- Home and News details routes keep their current behavior and responsive layout.
- Existing QA seed still inserts three synthetic analyzed articles under an inactive source when applied to a configured Supabase project.

## Checks to run

- `npm run typecheck`, `npm run lint`, and `npm run build` because root metadata/components and package metadata change. Report exact output.
- Search source and current docs for old brand mentions, accounting for intentionally retained historical prompts and `BIASLY_ADMIN_SECRET`.
- Inspect the header/footer at desktop and about 375px width if a browser/dev server is available.

## Exact manual test steps expected after implementation

1. Run `npm run dev` from the project root and open `http://localhost:3000`.
2. Confirm the browser tab, desktop header logo, mobile menu logo/home label, and footer copyright read Fake or Real.
3. At about 375px width, verify the longer logo fits without clipping or covering navigation.
4. If Supabase is configured and QA records are seeded, open each card and check the details page header/footer remain correctly branded. The inactive fixture source should show the new QA label after applying the updated seed to a fresh fixture dataset.
5. Check `npm pkg get name` returns `"fake-or-real"`.
