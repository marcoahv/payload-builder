# Current Feature

**Title:** Header logo: real light/dark images instead of CSS mask
**Type:** Fix
**Status:** verified
**Branch:** `fix/header-logo-real-images`

## The problem

The header logo currently renders as a single uploaded asset used as a CSS
`mask-image` filled with `currentColor` ([_logo.css](src/app/(frontend)/styles/elements/_logo.css)), so it "fakes" color
switching between the header's Default/Inverse/Muted/Accent surface
options by inheriting whatever text color (`--header-fg`) that surface
currently sets. This only works for a single-color silhouette mark with
real alpha transparency — the file's own comment documents this as a
caveat, not a real multi-tone logo swap.

The Header global already defines a second field, `logoDark`
(`src/globals/Header/config.ts:20-29`, optional, currently completely
unused by the frontend — confirmed via repo-wide grep), originally
intended for the visitor's OS dark-mode preference. The user wants the
header to stop masking and instead switch between two real images —
reusing `logo` and `logoDark` — driven by the Default/Inverse surface
picker, not by adding a third field.

Decisions confirmed with the user:
- Keep `logoDark` semantically about background lightness (not repurposed
  away from color-scheme entirely) — reuse the existing `logo`/`logoDark`
  pair for both Default and Inverse, inverting which one wins for Inverse
  (since Inverse's background is the literal opposite of Default's at any
  given OS scheme).
- Muted and Accent surfaces are fixed, always light-ish/dark-ink-needing
  backgrounds (their `--color-on-surface-*` tokens are fixed dark, not
  `light-dark()` pairs) — they always show `logo`, never `logoDark`.
- The existing "transparent header adopts the section beneath it" behavior
  (`_header.css`, the `body:has(...)` override block) must keep working
  exactly as today, just producing an image choice instead of a color.

## Background facts driving the CSS logic

From `src/app/(frontend)/styles/base/_alias-tokens.css`:
- `--color-surface` (Default): `light-dark(neutral-0, neutral-950)` —
  tracks OS scheme normally (light bg in light mode, dark bg in dark mode).
- `--color-surface-inverse`: `light-dark(neutral-950, neutral-0)` — the
  literal flip of Default at any given OS scheme.
- `--color-surface-muted` / `-accent`: fixed brand colors, not
  `light-dark()` pairs — same (light-ish, dark-ink) appearance regardless
  of OS scheme.

Resulting image-per-case table (`logo` = light-bg/dark-ink asset,
`logoDark` = dark-bg/light-ink asset):

| Surface  | OS light  | OS dark   |
|----------|-----------|-----------|
| Default  | `logo`    | `logoDark`|
| Inverse  | `logoDark`| `logo`    |
| Muted    | `logo`    | `logo`    |
| Accent   | `logo`    | `logo`    |

Because `logo` is correct in every case except Default+dark and
Inverse+light, the CSS baseline is "`logo` visible, `logoDark` hidden," and
the header's own `data-surface` rule only needs **2** override rules. The
transparent/unscrolled section-adoption block, however, must write out all
**4** cases explicitly — unlike the header's own single-valued
`data-surface`, that block's selector can be competing against the
header's own already-applied 2-rule override, so a "3 cases already
correct, skip them" shortcut isn't safe there (mirrors why the existing
`--header-fg` adoption block already writes all 4 cases instead of 3).

## The fix

**`src/globals/Header/Component/Logo.tsx`** — accept both `logo` and
`logoDark` props. Resolve `logoDark` with a fallback to `logo` when empty
or not a real doc (so a header never renders with a missing image — the
field is optional). Render two real `<img>` elements (not `next/image`:
`next.config.ts`'s `images` block has no `dangerouslyAllowSVG`, so Next's
built-in optimizer would reject the SVG logos already in `media/`; plain
`<img>` also doesn't require guessed fallback dimensions the way
`next/image` does) inside a renamed wrapper `.ui-logo` span (replacing
`.ui-logo-mark`, which no longer describes a mask). Suppress the resulting
`@next/next/no-img-element` warning with a scoped disable comment
explaining why. Both images are always in the DOM; CSS decides which is
visible.

**`src/app/(frontend)/styles/elements/_logo.css`** — replace the mask rule
with layout-only rules for `.ui-logo` / `.ui-logo__img`, plus the baseline
`.ui-logo__img--logo-dark { display: none; }`. Drop the `--logo-src`/
`--logo-ratio` custom properties entirely — a real `<img>` with `width`/
`height` attributes gets its correct aspect ratio natively.

**`src/globals/Header/Component/_header.css`** — add two small blocks:
1. Right after the existing `data-surface` → `--header-bg`/`--header-fg`
   block: 2 rules, each wrapped in `@media (prefers-color-scheme: dark)` /
   `(...: light)`, toggling `.ui-logo__img--logo` / `--logo-dark` for
   `[data-surface='default']` and `[data-surface='inverse']` respectively.
2. Right after the existing 4-case `body:has(...)` `--header-fg` adoption
   block: the mirrored 4-case version for the logo images (2 cases inside
   `prefers-color-scheme` media blocks for default/inverse-underneath, 2
   scheme-independent rules for muted/accent-underneath).

`--header-fg` itself is untouched — it still drives nav-link text color;
only the logo's own visibility is taken over by these new rules. Also fix
the stale `.ui-logo-mark` reference in this file's "Sizing lives on
.ui-logo-mark" comment to `.ui-logo`.

**`src/globals/Header/Component/HeaderClient.tsx`** — destructure
`logoDark` alongside `logo` from the `header` global (~line 24) and pass
it through: `<Logo logo={logo} logoDark={logoDark} className="header__logo" />` (~line 107).

**`src/globals/Header/config.ts`** — update `logoDark`'s admin
`description` (currently "Shown when the visitor prefers a dark colour
scheme," which is backwards for Inverse and irrelevant for Muted/Accent)
to describe the real surface-dependent behavior, so editors aren't
confused seeing it appear in light mode when Inverse is selected.

Accepted trade-off: both images are always fetched by the browser (plain
sibling `<img>`s can't do native `<picture><source media>` matching
against `data-surface`/`:has()`/`.header--scrolled`), unlike a single
masked asset. For small logo-sized files this is negligible.

Must not break: `--header-fg`-driven nav-link text color; the header's
other appearance axes (position, height, transparency/scroll behavior);
the favicon's separate, already-correct `icon`/`iconDark` OS-driven
switching in `layout.tsx` (untouched).

## Build steps

- [x] 1. **Update `Logo.tsx` and `HeaderClient.tsx`.** Add the `logoDark`
  prop with fallback-to-`logo` resolution, render two real `<img>`
  elements in a renamed `.ui-logo` wrapper (suppressing the
  `no-img-element` lint rule with a scoped, explained disable), and thread
  `logoDark` through from `HeaderClient.tsx`. **Done when:** `npm run
  build` and `npm run lint` pass (only the expected scoped disable, no new
  warnings).
- [x] 2. **Replace the mask CSS in `_logo.css`.** Layout-only `.ui-logo`/
  `.ui-logo__img` rules plus the `.ui-logo__img--logo-dark { display:
  none; }` baseline; drop `--logo-src`/`--logo-ratio`; rewrite the file's
  doc comment to describe the two-asset approach. **Done when:** `npm run
  build` passes with no unresolved class/property references.
- [x] 3. **Add the two override blocks to `_header.css`** (header's own
  surface: 2 rules; transparent/unscrolled section-adoption: 4 cases) and
  fix the stale `.ui-logo-mark` comment reference. **Done when:** `npm run
  build` passes, and in the browser, across both OS light/dark scheme and
  all four surface values (plus the transparent/floating-over-a-section
  case before and after scroll), the correct image shows per the table
  above (see Verify).
- [x] 4. **Update `logoDark`'s admin description** in
  `src/globals/Header/config.ts` to reflect the real surface-dependent
  behavior. **Done when:** the field's admin-facing copy no longer implies
  a pure OS-only trigger.

## Verify

`npm run dev`, then in `/admin` set the Header's Logo (dark mode) field to
a visibly different asset than the main Logo, and check in the browser
across OS light/dark scheme (toggle it in system settings or devtools
rendering emulation):

- Header set to Default: `logo` in light mode, `logoDark` in dark mode.
- Header set to Inverse: `logoDark` in light mode, `logo` in dark mode.
- Header set to Muted or Accent: always `logo`, either scheme.
- A transparent, unscrolled header floating over a first section set to
  each of the four surfaces shows the image matching *that section*, in
  both OS schemes, then reverts to the header's own configured surface
  once scrolled.
- Clear the Logo (dark mode) field entirely: the header still renders
  `logo` correctly in every case (no broken/missing image).

## Post-verification note

Confirmed with the user: after building, they initially saw the Inverse
surface show the "wrong" logo color. Root cause was content, not code —
the light-ink and dark-ink asset files had been uploaded to the opposite
fields in `/admin` (dark-ink asset in "Logo (dark mode)", light-ink asset
in "Logo"). No code change was needed; swapping which file sits in which
field resolved it. Confirms the CSS logic table above is correct as built.
