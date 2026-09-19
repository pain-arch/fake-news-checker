# Biasly UI Design System Implementation

## Goal

Implement the attached `01-ui-design-system.png` reference as the reusable visual foundation for the Biasly application and present it on the current home route as a responsive design-system showcase. Match the reference closely while keeping the implementation suitable for reuse by future news listing and article detail screens.

## Skills read

- No project skill was required for this task. The repository-approved Clerk, Supabase, Oxylabs, and AI SDK skills do not apply to a static UI design-system implementation.
- Read the bundled Next.js 16 documentation in:
  - `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`

## Existing code inspected

- `AGENTS.md`
- `package.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `postcss.config.mjs`
- Attached reference: `C:/Users/scarl/Downloads/drive-download-20260917T212721Z-1-001/01-ui-design-system.png`

## Decisions and assumptions

- The current application is a minimal blank Next.js 16 App Router project, so the home page will become the visual design-system showcase shown in the reference.
- The work will create reusable tokens and UI primitives, not only a one-off screenshot recreation.
- Poppins will replace Geist as the primary application typeface and will be loaded with `next/font/google` for optimized, self-hosted delivery.
- The reference image is visual direction, not an instruction document. Only visible design choices are used.
- The news card image in the reference is illustrative. To avoid copying or depending on an unavailable photo, the implementation will use a polished local editorial placeholder treatment unless an existing suitable project asset is found.
- Icons will use accessible inline SVG components with a consistent two-pixel, rounded-line style, avoiding a new dependency for a small static icon set.
- The showcase will remain a Server Component because it requires no client-side state.
- No database, authentication, scraping, analysis, or API behavior is part of this change.

## Files likely to change

- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `components/ui/button.tsx` (new)
- `components/ui/chip.tsx` (new)
- `components/ui/bias-meter.tsx` (new)
- `components/ui/brand-mark.tsx` (new)
- `components/ui/news-card.tsx` (new)
- `components/ui/icon.tsx` or a similarly small icon module (new)
- Possibly a small local asset under `public/` if needed for the editorial card placeholder

The exact component split may be adjusted during implementation to keep the code small and cohesive.

## Visual interpretation

- Overall tone: neutral, editorial, restrained, and premium; white/off-white surfaces with charcoal typography and minimal color used for political framing.
- Page canvas: warm white/light gray background with a centered, wide layout.
- Showcase panels: thin cool-gray borders, subtle rounded corners, white surfaces, and very light shadows.
- Brand: lowercase `biasly` wordmark with compact `News` lockup and the tagline “Balanced news coverage, powered by AI.”
- Typography: Poppins with a strong 32px display heading, 24px section heading, 20px card heading, 16px subheading, 16/14/13px body styles, and 11px captions. Preserve the line-height and weight hierarchy visible in the reference.
- Color palette:
  - primary text: `#0D0D0F`
  - secondary text: `#6B7280`
  - surface: `#F6F6F6`
  - left framing: `#B42318`
  - center framing: `#E5E7EB`
  - right framing: `#1D4ED8`
  - background primary: `#FFFFFF`
  - background secondary: `#F0F0F0`
  - border/divider: `#E5E7EB`
- Spacing: four-pixel base scale with 4, 8, 16, 24, 32, 40, and 64px steps.
- Grid: desktop maximum width of approximately 1280px, twelve columns, 24px gutters, and 24px outer margins.
- Radius: 4px small, 8px medium, 12px large, and pill/full radius.
- Shadows: subtle small, medium, and large elevations based on the reference.
- Footer: full-width charcoal surface with white branding, supporting copy, version/date metadata, and closing message.

## Layout requirements

- Recreate the reference hierarchy with these showcase regions:
  1. Brand
  2. Colors
  3. Typography
  4. UI elements (buttons, chips, bias meter)
  5. Icons
  6. News card example
  7. Spacing system
  8. Grid system
  9. Shadows
  10. Border radius
  11. Footer
- Desktop layout should visually follow the asymmetric three-column arrangement in the reference.
- Tablet layout should collapse naturally to two columns without awkward ordering.
- Mobile layout should be a single readable column, keep controls touch-friendly, allow tables/examples to scroll or reflow, and prevent clipped text.
- Use semantic HTML sections and headings in a logical document outline.
- Keep the rendered showcase visually close to the supplied reference at a desktop viewport while allowing sensible responsive adaptation rather than fixed screenshot dimensions.

## Reusable component requirements

- Define shared design tokens in `app/globals.css` and expose them to Tailwind v4 through `@theme inline` where appropriate.
- Provide button variants for primary, secondary, and text styles, including hover, outline, and disabled presentations used by the showcase.
- Provide a chip/category component with label and optional plus icon.
- Provide a reusable bias meter that accepts left, center, and right percentages, renders a segmented bar, exposes meaningful accessible text, and can be reused by future article cards.
- Provide a brand mark component with accessible text and sizing that works on light and dark surfaces.
- Provide a news-card component that demonstrates the expected article hierarchy: category/location metadata, headline, summary, bias meter, age, bookmark treatment, and reading time.
- Provide a small shared icon component or icon set with `currentColor`, consistent sizing, and `aria-hidden` behavior when decorative.
- Prefer typed props and avoid `any`.

## Global application requirements

- Update metadata from the default Create Next App values to Biasly-specific title and description.
- Replace the current automatic dark-mode override; this reference defines a deliberate light theme, so operating-system dark mode must not invert the design unintentionally.
- Apply Poppins globally using `next/font/google` and a CSS variable.
- Preserve Next.js App Router server/client boundaries and avoid unnecessary `"use client"` directives.
- Keep styles maintainable: global CSS for tokens/reset/base rules, Tailwind utilities for layout and component styling, and no CSS-in-JS.
- Avoid overbuilding application behavior not present in the reference.

## Security requirements

- Do not introduce environment variables, secrets, network calls, remote data loading, or browser-side privileged logic.
- Do not expose or modify any existing server-only configuration.
- Any image or icon asset used must be local or generated in code; do not hotlink external content.

## Accessibility requirements

- Meet WCAG AA contrast for text and actionable controls.
- Use real `button` elements for button examples and disable disabled examples with the native `disabled` attribute.
- Include visible focus states for interactive controls.
- Do not rely on red/gray/blue alone to communicate bias distribution; retain labels and numeric percentages.
- Use semantic headings, lists, figures, and captions where appropriate.
- Decorative icons must be hidden from assistive technology; meaningful controls need accessible names.

## Acceptance criteria

- The `/` page closely reflects the attached design-system board in content, visual hierarchy, typography, palette, spacing, borders, radii, shadows, and component styling.
- Poppins is the global font and is loaded through `next/font/google`.
- Core colors, spacing, radii, shadows, and type choices are defined as reusable tokens rather than duplicated arbitrary values.
- Buttons, chips, bias meter, brand mark, icon styling, and news card are implemented as reusable typed components.
- The page has no horizontal overflow at common mobile widths and remains balanced at tablet and desktop sizes.
- Bias segments match their numeric widths and contain accessible labels.
- The implementation introduces no unnecessary client component or runtime dependency.
- Biasly metadata replaces the default starter metadata.
- Typecheck, lint, and production build all pass.

## Checks to run

From the project root:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Note: `package.json` currently has no `typecheck` script, so `npx tsc --noEmit` is the equivalent direct check unless a script is added as part of the implementation.

## Exact manual test steps expected after implementation

1. From `F:\vibe-coded\web\fake-news-checker`, run:

   ```powershell
   npm run dev
   ```

2. Open `http://localhost:3000`.
3. At a desktop viewport around 1536×1024, compare the overall panel arrangement, Poppins typography, neutral palette, button/chip states, bias meter, article card, spacing/grid examples, shadow/radius samples, and dark footer against the supplied reference.
4. Resize to approximately 768px wide and confirm the showcase reflows into two balanced columns with no clipped content.
5. Resize to approximately 375px wide and confirm it becomes a single readable column with no horizontal page overflow.
6. Tab through the interactive button and chip examples and confirm the focus indicator is visible.
7. Inspect the primary/secondary disabled buttons and confirm they cannot be activated.
8. Inspect the bias meter with browser accessibility tools and confirm the left, center, and right values are available as text rather than color alone.
9. Confirm the browser tab title and page description identify Biasly rather than Create Next App.
