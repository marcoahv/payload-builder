# Current Feature

**Title:** Header position: remove Sticky option
**Type:** Fix
**Status:** verified
**Branch:** fix/header-position-remove-sticky-option

## The problem

The `Header` global's Appearance controls (`headerAppearanceField()` in
`src/fields/appearance.ts`) offer a `position` select with three options -
Fixed, Sticky, Static. The user wants Sticky dropped, leaving only Fixed and
Static.

Step 1 below also reworded the two remaining option labels to spell out their
behavior (`'Fixed (floats over the page)'` / `'Static (scrolls with the
page)'`). The user decided that was redundant alongside the field's own
`admin.description` sentence, which already says the same thing - step 2
reverts the labels to plain `'Fixed'` / `'Static'`, keeping only the
description as the explanation.

## The fix

- `src/fields/appearance.ts` - on the `position` select (currently lines
  127-140): remove the `{ label: 'Sticky', value: 'sticky' }` option, and
  reword the two remaining labels to state their behavior directly (Payload
  selects have no per-option description, so the label is the only text
  shown next to each choice):
  ```ts
  options: [
    { label: 'Fixed (floats over the page)', value: 'fixed' },
    { label: 'Static (scrolls with the page)', value: 'static' },
  ],
  ```
  Trim the field's shared `admin.description` (currently "Fixed floats over
  the page. Sticky scrolls away then returns. Static scrolls off.") to drop
  the Sticky clause, without just repeating the labels verbatim:
  `'Fixed stays in view while the page scrolls. Static scrolls away with the rest of the page.'`
- `src/globals/Header/Component/_header.css` - remove the now-dead
  `.header[data-position='sticky'] { position: sticky; top: 0; }` rule
  (currently lines 94-97). Two nearby comments name "sticky" and need the
  same trim:
  - Line 111: "'Transparent at top' only makes visual sense over a fixed or
    sticky header" -> "...over a fixed header".
  - Line 171: "Sticky and static headers sit in the document flow already
    and are deliberately excluded." -> "Static headers sit in the document
    flow already and are deliberately excluded." (comment-only correction -
    the `:has()` fixed-header-offset rule below it only ever keyed off
    `data-position='fixed'`, so no logic changes).
- `src/app/(frontend)/layout.tsx` (~line 84) - the comment "...so a fixed
  header always gets the right padding and a sticky/static one correctly
  gets none" -> "...and a static one correctly gets none."
- Regenerate `src/payload-types.ts` with `npm run generate:types`
  (`Header.position` narrows from `'fixed' | 'sticky' | 'static'` to
  `'fixed' | 'static'`). Generated file, never hand-edited.
- `HeaderClient.tsx` reads `position` straight from the `Header` doc and
  passes it through as `data-position` - no hardcoded `'sticky'` reference
  there, so nothing to change.
- Must not break: if the live `Header` document currently has
  `position: 'sticky'` saved, this fix doesn't touch that stored value -
  Payload doesn't retroactively validate existing documents against a
  changed options list. The admin dropdown would show it unselected until
  an editor picks Fixed or Static again, and until then the header renders
  with no explicit CSS `position` (browser default, effectively static)
  since the dead rule is gone. Check the current value as part of Verify
  below and re-save it if it's `sticky`.

## Build steps

- [x] 1. Make the four edits above (`appearance.ts`, `_header.css`,
  `layout.tsx`, regenerate `payload-types.ts`).
  - Done when: `npm run generate:types`, `npm run lint`, and `npm run build`
    all pass, and grepping the repo for `sticky` (case-insensitive) turns up
    nothing outside this fix's own commit history.

- [x] 2. Revert the option labels to plain `'Fixed'` / `'Static'` in
  `src/fields/appearance.ts`, keeping the `admin.description` sentence from
  step 1 as the only explanation of behavior (redundant otherwise).
  - Done when: `npm run lint` and `npm run build` pass.

- [x] 3. Add an `admin.description` to the neighboring `height` select
  (same row, `src/fields/appearance.ts`) - it had no explanation at all,
  unlike `position`/`surface`/`width`: `'How tall the header bar is.'`,
  matching `width`'s equally short "How wide the bar contents run." style
  rather than spelling out the rem values.
  - Done when: `npm run lint` and `npm run build` pass.

## Verify

- In `/admin` -> Header -> Appearance, the Position field shows exactly two
  plain-labeled options (Fixed, Static), with the description sentence below
  explaining what each does.
- Before saving anything, check the Header document's current Position
  value. If it's Sticky, re-save it as Fixed or Static (your call) so the
  live site isn't left with an unselected/blank position.
- On the frontend, confirm the header still renders correctly (floats over
  the page for Fixed, scrolls away for Static) with no console errors.
- The Height field now shows its own description sentence below it too.
