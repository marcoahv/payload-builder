# Current Feature

**Branch:** `feature/image-border-radius-control`
**Status:** verified

## Goal

Give editors a site-wide setting for how rounded image corners are across
the whole site (None / Small / Medium / Large), and add a real
`--radius-none` token — today "none" is faked as an empty string on
`MediaImage`, not an actual token.

Not a build-plan item: this is a small, self-contained editor control on
an existing global (`Settings`), not a product-direction change, so it's
spec'd directly per `/feature`'s "new feature not in the plan" rule rather
than added to `project-plan.md`.

## In scope

- **New tokens** — `src/app/(frontend)/styles/base/_base-tokens.css`'s
  existing Radius block gets `--radius-none: 0;` alongside sm/md/lg/pill.
- **New semantic token** in
  `src/app/(frontend)/styles/base/_alias-tokens.css` (built from other
  tokens, so belongs there, not `_base-tokens.css`):
  ```css
  :root {
    --radius-image: var(--radius-md);
  }

  html[data-image-radius='none'] { --radius-image: var(--radius-none); }
  html[data-image-radius='sm']   { --radius-image: var(--radius-sm); }
  html[data-image-radius='md']   { --radius-image: var(--radius-md); }
  html[data-image-radius='lg']   { --radius-image: var(--radius-lg); }
  ```
  Rooted at `<html>` (not a specific component) so the custom property
  cascades to every image regardless of nesting depth — mirrors the
  existing `data-surface`/CSS-attribute-selector pattern used by
  `Header`/`Footer`/`Section`, just scoped to the whole page instead of
  one component's root element.
- **`src/components/MediaImage.tsx`** — rework the `RADIUS` map so the
  no-explicit-opinion case means "follow the site setting" instead of a
  hardcoded literal. Rename the default option from `'md'` to `'site'`
  (clearer than overloading `'md'` to secretly mean something else), and
  give `'none'` a real token instead of an empty string:
  ```ts
  radius?: 'none' | 'sm' | 'site' | 'lg'   // default: 'site'

  const RADIUS = {
    none: 'rounded-[var(--radius-none)]',
    sm: 'rounded-[var(--radius-sm)]',
    site: 'rounded-[var(--radius-image)]',
    lg: 'rounded-[var(--radius-lg)]',
  } as const
  ```
  `sm`/`lg`/`none` stay as explicit per-call overrides for a component
  that deliberately wants to diverge from the site setting; only the
  default case tracks the editor's choice.
- **Consumers that must switch to `--radius-image`:**
  - `src/blocks/Hero/Component.tsx` and
    `src/blocks/FeatureGrid/Component.tsx` — both currently pass
    `radius="md"` explicitly; remove that prop so they fall back to the
    new `'site'` default. (Renaming the type's `'md'` key away also makes
    any stale `radius="md"` a build error, so nothing can be silently
    missed.)
  - `src/app/(frontend)/styles/elements/_prose.css`'s rich-text `img` rule
    (currently `border-radius: var(--radius-md);`) — a bare element
    selector for Lexical output, not a `MediaImage` className, so it needs
    the token swapped directly.
  - `src/components/_card.css`'s `.card` rule (currently `border-radius:
    var(--radius-md); overflow: hidden;`) — `.card` wraps both the image
    and the text content, and its `overflow: hidden` is what visually
    clips the image's top corners. Confirmed with the user: switch
    `.card`'s `border-radius` to `var(--radius-image)` too, so "None"
    genuinely means square corners on blog cards instead of leaving a
    clipped rounded edge from the outer wrapper.
- **New Settings field** — `src/globals/Settings/config.ts`:
  ```ts
  {
    name: 'imageRadius',
    type: 'select',
    label: 'Image Corner Radius',
    defaultValue: 'md',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ],
    admin: {
      description: 'Controls how rounded image corners are across the site.',
    },
  },
  ```
- **`src/app/(frontend)/layout.tsx`** — set the attribute on `<html>`
  alongside the existing `className`:
  `<html lang="en" className={...} data-image-radius={settings.imageRadius ?? 'md'}>`.
- Run `npm run generate:types` after the Settings field addition.

## Out of scope

- `.card__category-badge` — a pill-shaped tag chip overlay, an unrelated
  shape convention (`--radius-pill`), not touched.
- `PostPreview.tsx` and `uploadConverter.tsx` — both call `MediaImage`
  without an explicit `radius`, so they inherit the new `'site'` default
  for free; no code change needed there.
- `Logo.tsx`'s two raw `<img>` marks (used by both Header and Footer) —
  a brand mark/wordmark, not part of the `MediaImage`/radius system today,
  and not what "images in the site" means here.
- `HeaderClient.tsx`'s small social-platform icon.

## Build loop

Per `blueprint/config.json`: `workflow.stepReview` is `"feature"` (one
review packet after all steps, not per-step) and
`workflow.checkpointCommits` is `"disabled"` (no intermediate commits).
Build both steps below in one pass, then stop for review; `/complete`
makes the single feature commit.

## Build steps

- [x] 1. **Add the `imageRadius` field to `Settings` and regenerate
  types.** **Done when:** `npm run generate:types` runs clean and
  `payload-types.ts` shows the new field on the `Setting` type.
- [x] 2. **Wire the token cascade and switch every consumer.** Add
  `--radius-none` and the `--radius-image` cascade to the token files;
  rework `MediaImage.tsx`'s `radius` prop/map; drop the explicit
  `radius="md"` from `Hero`/`FeatureGrid`; switch `_prose.css`'s and
  `_card.css`'s hardcoded `--radius-md` references to `--radius-image`;
  set `data-image-radius` on `<html>` in `layout.tsx`. **Done when:** `npm
  run build` and `npm run lint` pass, and in the browser, changing
  Settings → Image Corner Radius between None/Small/Medium/Large updates
  the Hero image, a FeatureGrid image, a blog Card (including its outer
  corner, not just the photo), a PostPreview banner, and an inline
  rich-text image — all together, with no leftover rounded corner on
  "None" (see Testing).
- [x] 3. **Add an Extra Large level.** The user added `--radius-xl: 2.4rem;`
  to `_base-tokens.css`'s Radius block directly. Add `{ label: 'Extra
  Large', value: 'xl' }` to `Settings.imageRadius`'s options in
  `src/globals/Settings/config.ts`, and add the matching cascade rule to
  `_alias-tokens.css`: `html[data-image-radius='xl'] { --radius-image:
  var(--radius-xl); }`. Regenerate types. **Done when:** `npm run
  generate:types` runs clean, `payload-types.ts`'s `imageRadius` union
  includes `'xl'`, `npm run build` and `npm run lint` pass, and in the
  browser, setting Settings → Image Corner Radius to Extra Large renders
  the larger radius on the same set of images verified in step 2.

## Files / areas

- `src/globals/Settings/config.ts`, `src/payload-types.ts` (regenerated,
  not hand-edited)
- `src/app/(frontend)/styles/base/_base-tokens.css`
- `src/app/(frontend)/styles/base/_alias-tokens.css`
- `src/components/MediaImage.tsx`
- `src/components/_card.css`
- `src/app/(frontend)/styles/elements/_prose.css`
- `src/blocks/Hero/Component.tsx`, `src/blocks/FeatureGrid/Component.tsx`
- `src/app/(frontend)/layout.tsx`

No new files.

## Data / contracts

`Settings.imageRadius`: new optional select field, values
`'none' | 'sm' | 'md' | 'lg' | 'xl'`, `defaultValue: 'md'`. Existing
Settings documents have no stored value yet; Payload applies the default
on read, so no migration is needed and no existing site behavior changes
until an editor explicitly picks something other than Medium (which
matches today's de facto hardcoded behavior).

`MediaImage`'s `radius` prop changes shape: `'md'` is removed from the
type (replaced by `'site'` as the default). This is an internal prop with
exactly five call sites, all in this repo and all covered by this spec's
build steps — the renamed type deliberately turns any missed `radius="md"`
into a build error rather than a silent behavior change.

## Testing

No test runner covers CSS/visual output for this project. Verify manually
with `npm run dev`: in `/admin`, set Settings → Image Corner Radius to
each of None, Small, Medium, Large, and Extra Large in turn, and on the
frontend confirm all of the following update together on each change:

- The Hero block's image.
- A FeatureGrid item's image.
- A blog listing Card — both the photo and the card's own outer corner
  (on "None", the card must show a genuinely square edge, not a residual
  rounded clip from the outer wrapper).
- A PostPreview banner/inline image.
- An inline image inside a rich-text (Lexical) body.

Also confirm `npm run build`, `npm run lint`, and `npm run generate:types`
all pass.

## Notes for the AI

`MediaImage`'s `'sm'`/`'lg'`/`'none'` radius options are explicit
developer-chosen overrides for a specific call site that wants to diverge
from the site setting — do not repoint those three at `--radius-image` too;
only the new `'site'` default should track the editor's choice. Keep
`.card__category-badge`'s `--radius-pill` untouched — it's a distinct
"pill chip" shape convention, unrelated to image corner rounding.
