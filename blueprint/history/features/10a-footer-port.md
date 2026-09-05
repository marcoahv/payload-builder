# Current Feature

**From build-plan:** feature 10a
**Status:** verified
**Branch:** `feature/footer-port`

## Goal

Restore the site footer (build-plan item 10a), ported against the *current*
schema instead of the pre-migration one it was quarantined under. The
`src/_legacy/components/Footer` version reads a `Nav` global and
`Setting.logoColor`/`logoWhite` fields that no longer exist — that data moved
to the `Header` global (`logo`, `logoDark`) and current `Settings` has no logo
fields at all. This is a rewrite against real data, not a CSS-only port.

`src/app/(frontend)/layout.tsx` already had the exact slot reserved:

```tsx
<main>{children}</main>
{/* TODO(phase 7): restore Footer from src/_legacy/. */}
```

Scope grew twice after Step 1 was already implemented: first the user asked
to reorganize Header/Footer/Settings so each lives under `src/globals/<Name>/`
with its `config.ts` and rendering component co-located (Step 3), which since
Footer needed a real global to co-locate a `config.ts` with, also meant
giving Footer its own `navLinks` field rather than continuing to borrow
`header.navLinks`. Then the user asked for editable appearance options on
the footer (Step 4). Both were implemented and verified in the same branch
before this spec's final write.

Design choices (not left open, since none block safe, reversible
implementation):

- **Footer has its own `navLinks` field** on the new `footer` global, same
  shape as `Header.navLinks` (`link` relationship -> Pages, required;
  `newTab` checkbox) but independent — no `minRows`, since an empty footer
  nav is valid (unlike the header's, which requires at least one link). Lets
  the two navs diverge later without a migration.
- **Footer logo still reuses `header.logo`** and the existing `Logo`
  component (`src/globals/Header/Component/Logo.tsx`) — no separate footer
  logo field. `Logo` is already a surface-aware CSS mask that recolors via
  `currentColor`, so the old `logoColor`/`logoWhite` two-asset split is
  obsolete, not just relocated.
- **Copyright line uses `settings.siteName`** instead of the legacy
  component's hardcoded "Nick Vogel" (a leftover from the original site
  owner, inappropriate for a reusable template). No dedicated copyright-text
  field.
- **Footer appearance reuses the shared `appearanceField()`** (`surface`,
  `spacing`, `width` — the same one every block uses), not Header's own
  `headerAppearanceField()`, since Footer has no position/scroll behavior to
  configure. This was a fixed muted band with no editable field until the
  user asked for appearance options (Step 4); reusing the generic factory
  changed the *default* look from muted/tight to the factory's own stock
  defaults (`default` surface / `normal` spacing) — worth a quick check in
  the admin if the previous muted/tight look was wanted, since it's now one
  field edit away rather than the fixed default.
- **Settings keeps just `config.ts`** under `src/globals/Settings/` — it has
  no dedicated rendering component to co-locate (its fields are consumed
  ad hoc: metadata in `layout.tsx`, the copyright line in `Footer`), so there
  is no `Settings/Component/` folder.

## In scope

- A `Footer` server component that fetches its own data (matching `Header`'s
  self-fetching pattern) and renders: logo, nav links, copyright line.
- Wiring it into `layout.tsx` in the reserved slot.
- Footer-specific CSS on the existing token system (muted surface, responsive
  layout).
- A new `footer` Payload global (slug `footer`) with its own `navLinks`
  field, registered in `payload.config.ts`.
- Directory reorg: `Header`'s and `Footer`'s rendering components move under
  `src/globals/<Name>/Component/`, co-located with each global's `config.ts`.
- Editable appearance options on the `footer` global (`surface`, `spacing`,
  `width`, via the shared `appearanceField()`), applied by the `Footer`
  component and `_footer.css`.

## Out of scope

- A footer-specific copyright/legal-text override field, or social links in
  the footer (`header.socialLinks` already exists and isn't part of this).
- Header-style position/scroll appearance controls for the footer (fixed,
  sticky, transparent-at-top) — a footer at the end of the document flow has
  no scroll behavior to configure, unlike the header.
- The blog listing/detail pages and their components (10b, 10c) — this
  feature does not touch `src/_legacy/routes/` or the other quarantined
  components.
- Deleting `src/_legacy/` (that happens once 10c lands and everything in the
  quarantine table is ported).
- Moving `src/globals/hooks/revalidateGlobal.ts` — it's shared by all three
  globals and stays where it is.

## Build loop

Per `blueprint/config.json`: `workflow.stepReview` is `"feature"` and
`workflow.checkpointCommits` is `"disabled"` — implement all steps below,
then present one review packet with the full diff and done-when evidence.
No per-step approval pause or checkpoint commit.

## Build steps

- [x] **Step 1 — Footer component + wiring**
  Create an async server component with no props, fetching
  `getCachedGlobal('header', 2)()` and `getCachedGlobal('settings')()`
  directly (same self-fetching pattern as `Header`, including its
  `if (!header) return null` guard). Structure it like `Header` +
  `HeaderClient`: an outer `<footer className="footer" data-surface="muted">`,
  a `<Container>` (`@/components/primitives`) inside it, containing the logo,
  a nav list, and a copyright line. Replace the
  `{/* TODO(phase 7): ... */}` comment in `layout.tsx` with `<Footer />`.
  **Done when:** `npm run dev`, visit any frontend page and see a footer
  below the main content showing the logo, nav links, and copyright line.
  `npm run build` succeeds.

- [x] **Step 2 — Footer styling**
  Add `src/app/(frontend)/styles/sections/_footer.css` (new `@layer
  components` block, following `_header.css`'s structure) and import it in
  `styles/index.css` after `_header.css`. Reuse the section-rhythm spacing
  tokens and the `atMedium` breakpoint variant for a stacked-then-row
  responsive layout. (Originally shipped with a single hardcoded muted
  surface and fixed tight spacing; superseded by Step 4, which generalizes
  both to the full editable range.)
  **Done when:** a browser screenshot at a narrow width (< atMedium) shows
  the stacked layout, and one at a wider width shows the row layout; both
  show the correct surface and token colors in both light and dark.

- [x] **Step 3 — `footer` global + globals/ directory reorg**
  - Create `src/globals/Footer/config.ts`: a `footer` global with one
    `navLinks` array field (`link` relationship -> Pages required, `newTab`
    checkbox, `maxRows: 6`, same `ArrayRowLabel` admin component as Header's),
    no `minRows`. Register it in `payload.config.ts`
    (`globals: [Header, Settings, Footer]`).
  - Move `src/components/Header/{index.tsx,HeaderClient.tsx,Logo.tsx}` to
    `src/globals/Header/Component/` (co-located with the existing
    `src/globals/Header/config.ts`). Move
    `src/components/Footer/index.tsx` to `src/globals/Footer/Component/`.
    Update every importer (`layout.tsx`, and the `Footer` component's own
    `Logo` import) to the new paths.
  - Update `Footer` to fetch the new `footer` global and read
    `footer.navLinks` for its nav (instead of `header.navLinks`); `header` is
    still fetched, now only for `header.logo`.
  - Run `npm run generate:types` (adds the `Footer` interface and registers
    `footer` in `Config['globals']`) and `npm run generate:importmap` (no new
    admin component paths, so it reported nothing to write).
  **Done when:** `npm run build` and `npm run lint` both run clean (same
  pre-existing, unrelated warnings/error as before, nothing new); `grep -rl
  "@/components/Header\|@/components/Footer" src --include="*.tsx"
  --include="*.ts"` outside `_legacy/` returns nothing; `payload-types.ts`
  contains `export interface Footer`.

- [x] **Step 4 — Footer appearance options**
  Add `...appearanceField()` (`@/fields/appearance`) to
  `src/globals/Footer/config.ts`'s fields, ahead of `navLinks` — the same
  factory every block uses (`surface`, `spacing`, `width`), not Header's
  `headerAppearanceField()` (that one adds position/height/transparentAtTop,
  which a footer doesn't need). In the `Footer` component, read
  `footer.surface`/`.spacing`/`.width` and apply them: `data-surface`/
  `data-spacing` on the outer `<footer>`, `width` passed to `<Container>`.
  In `_footer.css`, replace the single hardcoded `data-surface='muted'` rule
  with all four surface branches (mirroring `_header.css`) setting
  `--footer-bg`/`--footer-fg`, and add `data-spacing` branches producing a
  `--footer-space` custom property (mirroring `_section.css`'s
  `--section-space`), replacing the hardcoded `--space-section-tight`
  padding. No new CSS needed for `width` — `<Container>`'s existing
  `data-width` rules already cover it. Run `npm run generate:types`.
  **Done when:** `payload-types.ts`'s `Footer` interface includes `surface`/
  `spacing`/`width`; `npm run build` and `npm run lint` stay clean (same
  pre-existing issues, nothing new); a screenshot after picking a non-default
  surface/spacing/width in the admin shows the footer reflecting the choice.

## Files / areas

- `src/globals/Footer/config.ts` (new — the `footer` global)
- `src/globals/Footer/Component/index.tsx` (new location of the `Footer`
  component; was `src/components/Footer/index.tsx`)
- `src/globals/Header/Component/{index.tsx,HeaderClient.tsx,Logo.tsx}` (new
  location; was `src/components/Header/`)
- `src/payload.config.ts` (edit: import + register the `footer` global)
- `src/payload-types.ts` (generated: adds `Footer`/`FooterSelect`)
- `src/app/(frontend)/layout.tsx` (edit: replace the phase-7 TODO comment,
  updated import paths for `Header`/`Footer`)
- `src/app/(frontend)/styles/sections/_footer.css` (new)
- `src/app/(frontend)/styles/index.css` (edit: add the import)

## Data / contracts

- New global `footer` (slug `footer`):
  - `surface` (select: default/muted/inverse/accent, default `default`),
    `spacing` (select: none/tight/normal/loose, default `normal`), `width`
    (select: narrow/default/wide/full, default `default`) — the shared
    `appearanceField()` shape, identical to every block's.
  - `navLinks` (array, optional, max 6: `link` relationship -> Pages
    required, `newTab` checkbox) — no default population; an unset/empty
    array is valid and renders no nav block.
- Reads (no changes): `Header.logo` (upload -> Media), `Settings.siteName`
  (text, required with a default).
- `generate:types` / `generate:importmap` were run after both the schema
  addition (Step 3) and the appearance fields (Step 4); both are current as
  of this spec.

## Testing

No test command is configured in `AGENTS.md` (`npm run test:int` /
`test:e2e` exist but have zero test files, and the project's testing gate is
opt-in per `coding-standards.md`). This feature has no parser/formatter/
validator-style logic — it's schema + conditional rendering over already-typed
data — so no unit test is warranted under the project's "what to test" scope
rule. Verified with `npm run build` and `npm run lint` (Step 3) and the dev
server / screenshot evidence described in Steps 1-2, per `coding-standards.md`'s
Browser Verification section.

## Notes for the AI

- Do not reintroduce the `Nav` global or `Setting.logoColor`/`logoWhite` —
  they no longer exist in `payload-types.ts`; grep before assuming a field is
  still there.
- `Header` and `Footer` components now live under `src/globals/<Name>/Component/`,
  not `src/components/<Name>/` — that old path no longer exists outside
  `src/_legacy/`.
- Footer renders unconditionally whenever the `Header` global exists (same as
  `Header`'s own `if (!header) return null` pattern) — no on/off toggle
  field. `footer.navLinks` being empty/absent is handled by the existing
  "render nothing" guard, not a separate null check.
- Do not touch `src/_legacy/` in this feature; it's still needed as reference
  for 10b/10c.
- The footer's default look changed from a fixed muted/tight band to the
  shared appearance factory's stock defaults (default surface / normal
  spacing) once appearance became editable — not a regression, just worth
  flagging since nothing in the admin has been set yet.

## Findings

_No findings were raised against this feature._

## Independent review

_No independent review was requested for this feature._
