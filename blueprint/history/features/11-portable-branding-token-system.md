# Current Feature

**Branch:** feature/portable-branding-token-system
**Status:** verified

## Goal

Build plan item 11. Consolidate the project's design tokens (colors,
typography, spacing, shadows, border-radius) into one portable
`branding.css` file inside `src/app/(frontend)/styles/`, so the whole
`styles/` folder can be dropped into another Next.js + Tailwind v4 project
and re-skinned by editing only that one file. Ship it with a
personality-selection guide based on the Website-Personalities-Framework
(`theory-lectures.pdf` §26) so a new project can pick a coherent set of
starting values instead of guessing at colors/type/shadows/radius in
isolation.

Confirmed with the user: this stays a Tailwind v4 project — `branding.css`
keeps the `@theme static { ... }` syntax and is portable to other
Next.js + Tailwind v4 projects, not framework-agnostic to non-Tailwind
stacks. The portable unit is the whole `styles/` folder; `branding.css` is
the single file a new project edits.

## In scope

- One new `src/app/(frontend)/styles/branding.css` holding every token in
  the 5 named ingredients: color palette + semantic color roles, typography
  (families/sizes/weights), the base spacing unit, a new shadow token
  scale, and border-radius tokens.
- Moving the two structural token groups that are not brand ingredients
  (`--space-section-*`, `--header-height-*`) out of `_semantic.css` into a
  new `tokens/_layout.css`, so `branding.css` contains only what a re-skin
  would touch.
- Folding `_typography.css`'s non-token `@layer base` rule (the
  `font-size: 62.5%` rem trick and body defaults) into `base/_reset.css`,
  since it's a project mechanism, not a brand token.
- Deleting `_palette.css`, `_semantic.css`, `_typography.css`,
  `_spacing.css` once their contents have moved, and updating
  `index.css`'s `@import` list and header comment to match.
- Adding a small shadow token scale to `branding.css` and replacing the one
  hardcoded `box-shadow` literal in `components/_card.css` with a token, so
  no CSS file outside `branding.css` holds a literal color, shadow, or
  radius value.
- A new `src/app/(frontend)/styles/personalities.md` guide covering the 7
  Website-Personalities-Framework personalities (Serious/Elegant,
  Minimalist/Simple, Plain/Neutral, Bold/Confident, Calm/Peaceful,
  Startup/Upbeat, Playful/Fun), each with its industry fit and guidance
  across the ingredients `branding.css` encodes (typography, colors,
  shadows, border-radius) plus the two ingredients it doesn't encode as
  tokens (images/illustrations, icons), and the trait-injection technique
  for blending a neighboring personality's traits into a primary choice.
- Updating `blueprint/context/coding-standards.md`'s token-system
  description to match the new file layout.
- A one-line pointer comment at the top of `branding.css` to
  `personalities.md`.

## Out of scope

- Making `branding.css` work without Tailwind (framework-agnostic
  `:root` custom properties, a Tailwind bridge layer). Declined by the
  user — this project stays Tailwind-based; portability means "drop the
  `styles/` folder into another Tailwind v4 project," not "works in any
  CSS stack."
- `_breakpoints.css` - not one of the 5 named branding ingredients, left
  untouched and separately imported.
- Any change to component/block markup, layout structure, or visual
  design beyond the mechanical token moves and the one shadow
  tokenization. No new personality is applied to this project; the guide
  is documentation for future projects, not a re-skin of this one.
- Encoding "images/illustrations", "icons", or "layout" as CSS custom
  properties - the framework treats them as design ingredients too, but
  they are component/asset choices, not values `branding.css` can hold.
  The guide covers them as prose only.
- Any change to `_breakpoints.css`'s import position or the Tailwind
  cascade-layer order documented at the top of `index.css`.

## Build loop

Per `blueprint/config.json` (`workflow.stepReview: "feature"`,
`checkpointCommits: "disabled"`): implement all build steps below in one
pass, then present a single review packet covering the whole feature. No
per-step approval pauses and no intermediate checkpoint commits.

## Build steps

- [x] 1. Create `src/app/(frontend)/styles/branding.css`. Move into it,
  verbatim unless noted: all of `_palette.css` (including the
  `ui-gradient-primary` utility), `_semantic.css`'s color-role tokens
  (surfaces, actions, borders/focus, overlays, feedback) and its
  `--radius-*` tokens, all of `_typography.css`'s `@theme static` token
  block, and `_spacing.css`'s `--spacing` token. Combine these into
  `@theme static { ... }` sections with the same section-banner comment
  style already used in the source files, plus one line at the top:
  `/* See ./personalities.md before hand-editing these values for a new
  project. */`. Create `src/app/(frontend)/styles/tokens/_layout.css`
  holding `_semantic.css`'s `--space-section-*` and `--header-height-*`
  tokens (with their existing explanatory comments) inside their own
  `@theme static` block. Move `_typography.css`'s `@layer base` rule (the
  `html { font-size: 62.5% }` block and the `html, body` font-weight/
  line-height/color rule) into `base/_reset.css`. Delete `_palette.css`,
  `_semantic.css`, `_typography.css`, `_spacing.css`. Update
  `index.css`: replace the four deleted imports plus nothing-yet with
  `@import './branding.css';` and `@import './tokens/_layout.css';`
  (breakpoints import unchanged), and update the header comment above the
  token imports to describe the new branding.css / tokens/_layout.css
  split instead of the old five-file list. Update
  `blueprint/context/coding-standards.md`'s token-system bullets to match
  (branding.css as the single edited-per-project file, `_layout.css` for
  project-structural tokens, `_breakpoints.css` unchanged).
  Done when: `npm run build` succeeds, `npm run dev` renders `/`, `/blog`,
  and a `/blog/[slug]` post with no visible change, and
  `grep -rn "#[0-9a-fA-F]\{3,6\}" src/app/\(frontend\)/styles/` (outside
  `branding.css`) returns nothing.

- [x] 2. Add a shadow token scale to `branding.css`: `--shadow-md` set to
  the exact current card-hover value
  (`0 0.4rem 1.6rem color-mix(in srgb, var(--color-neutral-1000) 15%, transparent)`),
  plus `--shadow-sm` and `--shadow-lg` following the same
  `color-mix()`-based construction at a lighter/heavier weight
  respectively. Replace the hardcoded `box-shadow` in
  `components/_card.css`'s `.card:hover` rule with `var(--shadow-md)`.
  Done when: `npm run build` succeeds and hovering a card on `/blog` shows
  the identical shadow as before the change.

- [x] 3. Write `src/app/(frontend)/styles/personalities.md`. For each of
  the 7 personalities, capture: name, industries, one-line design intent,
  and guidance for typography, colors, shadows, and border-radius (the 4
  ingredients with a direct token in `branding.css`), plus images/
  illustrations and icons (prose-only guidance, no token). Base the
  content on the source framework (`theory-lectures.pdf` §26, pages
  237-249): Serious/Elegant, Minimalist/Simple, Plain/Neutral,
  Bold/Confident, Calm/Peaceful, Startup/Upbeat, Playful/Fun. Add a
  closing section on the trait-injection technique: the
  bold/calm x serious/playful quadrant and the book's three worked
  combinations (Startup/Upbeat + Bold/Confident, Bold/Confident +
  Calm/Peaceful, Bold/Confident + Playful/Fun), explaining that a
  personality's traits aren't mutually exclusive buckets - pull 1-2 traits
  from a neighboring personality into a primary choice. Done when: the
  file exists, all 7 personalities and the trait-injection section are
  present, and `branding.css`'s pointer comment (from step 1) resolves to
  this file.

## Files / areas

- `src/app/(frontend)/styles/branding.css` (new)
- `src/app/(frontend)/styles/personalities.md` (new)
- `src/app/(frontend)/styles/tokens/_layout.css` (new)
- `src/app/(frontend)/styles/tokens/_palette.css`,
  `tokens/_semantic.css`, `tokens/_typography.css`,
  `tokens/_spacing.css` (deleted)
- `src/app/(frontend)/styles/base/_reset.css` (gains the typography base
  rule)
- `src/app/(frontend)/styles/index.css` (import list + header comment)
- `src/app/(frontend)/styles/components/_card.css` (shadow tokenized)
- `blueprint/context/coding-standards.md` (token-system description)

## Data / contracts

None - CSS custom-property renames stay 1:1 (every existing `--color-*`,
`--radius-*`, `--text-*`, `--font-*`, `--spacing` name is preserved; only
its source file moves), so no consumer (`_header.css`, `_footer.css`,
`_section.css`, block components, etc.) needs an edit beyond `_card.css`'s
shadow line. No Payload schema, API, or data-model change.

## Testing

No test command covers CSS. Verification is: `npm run build` (Tailwind
will fail the build on malformed `@theme` syntax or a token consumed
before it's defined) after each step, plus a manual visual check of `/`,
`/blog`, and one post detail page to confirm no rendering change - record
this as unverified-by-automation in the review packet, per
`verification.uiEvidence: "when-available"` truthfully reflecting that no
browser tool ran in this session unless `/check` or manual testing is
run separately.

## Notes for the AI

- Preserve every token name exactly; this is a file-reorganization and
  additive-token feature, not a rename or value change (except the two new
  `--shadow-sm`/`--shadow-lg` tokens, which are new).
- Keep the same section-banner comment style (`/*===...===*/`) already used
  across the token files - `branding.css` is explicitly the file another
  project's maintainer opens first, so its internal organization should
  read as cleanly as the files it replaces.
- The `ui-gradient-primary` `@utility` stays with the palette tokens it's
  built from inside `branding.css`, even though it's a derived utility
  rather than a raw token - splitting it into a separate file for one
  utility isn't worth a new file.
- Do not touch `_breakpoints.css`, its import, or the Tailwind
  cascade-layer-order comment at the top of `index.css`.
- The personality guide documents images/icons/layout guidance as prose
  because the framework packages them alongside the tokenized ingredients,
  but do not invent a CSS custom property for them - there is no portable
  value to hold.

## Post-implementation refactors (same branch, after this spec was verified)

Extensive additional work landed on this branch after the spec above was
built and marked verified, none of it part of this spec: an SVG featured-image
fallback bug fix (`getMediaSize.ts`), a post-detail header/spacing/banner
layout pass (`PostPreview.tsx`, the post page), a new `headerAppearance`/
`bodyAppearance` field pair on Posts, a new general N-column `Table` block,
and a full reorganization of `styles/` (component/section CSS colocated next
to its `.tsx`, dead `layouts/` folder removed, `branding.css` split into
raw-values/derived-tokens files, both renamed and relocated multiple times,
landing at `src/app/(frontend)/styles/base/_base-tokens.css` and
`src/app/(frontend)/styles/base/_alias-tokens.css` — not `branding.css`/
`tokens/_layout.css` as this spec describes above). This archive intentionally
preserves the spec as originally written and built; the file paths above are
historical, not current. See `src/app/(frontend)/styles/README.md` for the
current, accurate file layout.
