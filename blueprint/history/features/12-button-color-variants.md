# Current Feature

**Branch:** `feature/button-color-variants`
**Status:** verified

## Goal

Add a Ghost button variant, make Solid/Outline consistently driven by
`--color-primary` instead of the `--color-action` semantic tokens, and let
editors choose Primary or Secondary as the button's color independently of
its shape (Solid/Outline/Ghost). Also: Solid's hover text turns a fixed
white, distinct from the dark `--color-on-surface-muted` used everywhere
else.

## In scope

- `src/app/(frontend)/styles/elements/_button.css`:
  - Base `.ui-btn` (Solid — renamed from "Primary" to match the
    style-descriptor naming of Outline/Ghost): background `--color-primary`,
    hover `--color-primary-dark`, no border.
  - `.ui-btn-outline`: transparent by default with a `--color-primary-dark`
    border and `--color-primary-dark` text; on hover, fills
    `--color-primary` (same fill/text as Ghost's hover) — corrected from an
    earlier reading that had Outline sharing Solid's filled look.
  - `.ui-btn-ghost` (new): transparent, no border, `--color-primary-dark`
    text; on hover, fills `--color-primary` (same as Outline's hover).
  - Remove the now-redundant `.ui-btn-cta` modifier (its fill/hover moved to
    the base).
  - `.ui-btn`'s hover text becomes a new fixed `--color-on-surface-muted-hover`
    token (white) instead of staying `--color-on-surface-muted` (dark).
    Outline/Ghost hover text is unchanged.
- Rename the `primary` variant option to `solid` (label and value) in all
  three `variant` selects — `{ label: 'Solid', value: 'solid' }`,
  `defaultValue: 'solid'` — and add `{ label: 'Ghost', value: 'ghost' }`.
  Option arrays that currently offer only Primary/Outline:
  - `src/blocks/CallToAction/config.ts`
  - `src/blocks/Hero/config.ts`
  - `src/globals/Header/config.ts` (`ctaButtons`)
- Update the three matching className lookups to a 3-way variant → class
  mapping (`outline` / `ghost` / default), dropping the `ui-btn-cta` class
  reference now that it's gone:
  - `src/blocks/CallToAction/Component.tsx`
  - `src/blocks/Hero/Component.tsx`
  - `src/globals/Header/Component/HeaderClient.tsx`
- Refactor `_button.css` so shape (Solid/Outline/Ghost) and color
  (Primary/Secondary) are independent: introduce local custom properties
  `--btn-tone` (defaults to `--color-primary`) and `--btn-tone-dark`
  (defaults to `--color-primary-dark`) on `.ui-btn`, have the three shape
  utilities reference those instead of the primary tokens directly, and add
  a `.ui-btn-secondary` color modifier that overrides both to the secondary
  equivalents. `--color-on-surface-muted` stays the fixed hover/fill text
  color for both — already contrast-checked against both primary (~9.4:1)
  and secondary (~7.1:1) earlier this session.
- Add a second `color` select field (`{ label: 'Primary', value: 'primary'
  }`, `{ label: 'Secondary', value: 'secondary' }`, `defaultValue:
  'primary'`) alongside `variant` in the same three locations.
- Update the three components to also apply `ui-btn-secondary` when
  `color === 'secondary'`, combined with the existing shape class via
  `.filter(Boolean).join(' ')` (the pattern `Stack`/`Section` already use).
- Run `npm run generate:types` after the config changes so `payload-types.ts`
  reflects the new `'ghost'` option and the new `color` field.

## Out of scope

- Any field structure changes to `CallToAction`/`Hero`/`ctaButtons` beyond
  adding the one option.
- Any other button-like element not built on `.ui-btn` (e.g. Pagination's
  controls, if they're styled independently).
- Reworking or removing the now-unused `--color-action` /
  `--color-on-action` / `--color-action-hover` tokens in
  `_alias-tokens.css` — they stay defined (this project's `@theme static`
  tokens are emitted whether referenced or not) in case a future component
  wants that primary→secondary hover pairing.

## Build loop

Per `blueprint/config.json`: `workflow.stepReview` is `"feature"` (one review
packet after all steps, not per-step) and `workflow.checkpointCommits` is
`"disabled"` (no intermediate commits). Build all steps below in one pass,
then stop for review; `/complete` makes the single feature commit.

## Build steps

- [x] 1. **Restyle `_button.css`.** Base `.ui-btn` (Solid): fill
   `--color-primary`, hover `--color-primary-dark`, no border.
   `.ui-btn-outline`: transparent, `--color-primary-dark` border and text;
   hover fills `--color-primary` with `--color-on-surface-muted` text (the
   existing dark-text-on-primary pairing, reused rather than a new token).
   `.ui-btn-ghost` (new): same transparent/hover treatment as outline, minus
   the border. `.ui-btn-cta` removed. **Done when:** `npm run build` passes
   with no unresolved token references.
- [x] 2. **Rename the `primary` option to `solid` and add Ghost** in the three
   config files, then regenerate types. **Done when:** `npm run
   generate:types` runs clean and `payload-types.ts` shows `('solid' |
   'outline' | 'ghost')` in each of the three variant unions.
- [x] 3. **Update the three components' class lookups** to a 3-way mapping (drop
   `ui-btn-cta`, add the `ghost` branch). **Done when:** `npm run lint` and
   `npm run build` both pass, and in the browser each of a Header CTA
   button, a Hero link, and a CallToAction link renders the correct classes
   for all three variant values (see Testing).
- [x] 4. **Add the Primary/Secondary color field.** Refactor `_button.css` to
   the `--btn-tone`/`--btn-tone-dark` custom-property pattern, add
   `.ui-btn-secondary`, add the `color` select to the three config files,
   update the three components to append `ui-btn-secondary` when
   applicable, and regenerate types. **Done when:** `npm run generate:types`
   runs clean, `payload-types.ts` shows the new `color` field in all three
   locations, `npm run lint` and `npm run build` pass, and in the browser
   all six shape×color combinations render correctly (see Testing).
- [x] 5. **Add `--color-on-surface-muted-hover` and apply it to Solid's hover
   text.** In `src/app/(frontend)/styles/base/_alias-tokens.css`, add
   `--color-on-surface-muted-hover: var(--color-neutral-0);` right after
   `--color-on-surface-muted` (a fixed white, not `light-dark()`, matching
   the fixed nature of `--color-surface-muted`/`--btn-tone-dark`). In
   `_button.css`, add `color: var(--color-on-surface-muted-hover);` to
   `.ui-btn`'s `&:hover` block. **Done when:** `npm run build` passes, and in
   the browser a Solid button (Primary and Secondary color) shows white
   hover text in both light and dark mode, with Outline/Ghost hover text
   unchanged.

## Files / areas

- `src/app/(frontend)/styles/elements/_button.css`
- `src/app/(frontend)/styles/base/_alias-tokens.css`
- `src/blocks/CallToAction/config.ts`, `src/blocks/CallToAction/Component.tsx`
- `src/blocks/Hero/config.ts`, `src/blocks/Hero/Component.tsx`
- `src/globals/Header/config.ts`, `src/globals/Header/Component/HeaderClient.tsx`
- `src/payload-types.ts` (regenerated, not hand-edited)

No new files.

## Data / contracts

The `variant` select field (identical shape in all three locations) renames
its `'primary'` value to `'solid'` and gains a third allowed value,
`'ghost'`, alongside the existing `'outline'`. Existing stored documents
using `'primary'` fall through the component's variant→class lookup to the
same default (Solid) class either way, so nothing renders incorrectly, but
the admin dropdown won't recognize the old raw value until the document is
resaved with the new `'solid'` option — no data migration is run for this.

A new `color` select field (`'primary'` | `'secondary'`, default `'primary'`)
is added alongside `variant` in the same three locations. It's optional/new,
so no existing document has a value yet; a missing value renders as Primary
(the field's `defaultValue`, and the CSS default when `.ui-btn-secondary`
isn't applied) — no migration needed.

## Testing

No test runner covers CSS/visual output for this project. Verify manually
with `npm run dev`: set a Header CTA button, a Hero link, and a CallToAction
link each to Solid, Outline, and Ghost in `/admin`, then confirm in the
browser, in both light and dark mode:

- **Solid:** background `--color-primary`, hover background
  `--color-primary-dark` with white hover text, no border.
- **Outline:** transparent background with a `--color-primary-dark` border
  and text by default; on hover, background becomes `--color-primary` with
  readable dark text.
- **Ghost:** same as Outline but with no border at any point.
- **Secondary color** (any shape): substitute `--color-secondary` for
  `--color-primary` and `--color-secondary-dark` for `--color-primary-dark`
  in the rules above — e.g. Secondary Solid fills `--color-secondary`,
  hovers `--color-secondary-dark`.

## Notes for the AI

Reuse `--color-on-surface-muted` for "text on a `--color-primary`
background" rather than inventing a new token — it already encodes the
correct contrast pairing (computed earlier this session at roughly 9.4:1).

The one exception is Solid's hover state (step 5): the darker
`--btn-tone-dark` fill gets a dedicated `--color-on-surface-muted-hover`
(fixed white) token instead, since the user explicitly wants white text
there — don't reuse `--color-on-surface-muted` for that state.
