# Current Feature

**Branch:** feature/dark-mode-toggle
**Status:** verified

## Goal

Give visitors a manual light/dark override control (build plan item 14) that
takes precedence over the OS `prefers-color-scheme` default and persists
across visits, without regressing the project's existing zero-flash,
zero-flash-JS `light-dark()` theming or its cache-tagged static rendering.

## In scope

- A visitor-facing toggle control in the header that flips the whole site
  between light and dark instantly, with no page reload.
- The chosen mode persists across visits (same browser) and is applied before
  first paint on later loads, so there is no flash of the wrong theme.
- Until a visitor toggles at least once, the site keeps following the OS
  `prefers-color-scheme` default exactly as it does today.
- The header's own dark/light-conditional rules (logo swap, and the
  transparent-header "adopt the surface underneath" logic) stay in sync with
  the manual override, not just the OS setting.
- A small pure validator for the stored preference value, unit-tested.
- One focused browser test for the toggle-and-persist behavior.
- Bringing the styling docs and coding standards up to date now that "no JS
  toggle" is no longer true.

## Out of scope

- The browser-tab favicon. `generateMetadata`'s dark favicon entry
  (`src/app/(frontend)/layout.tsx`) is switched by the browser's own
  `media="(prefers-color-scheme: dark)"` evaluation on a `<link>` tag, which
  cannot be forced from script reliably across browsers. It keeps following
  the OS setting only; this is a known, accepted gap, not an oversight.
- A third "system/auto" option to reset back to OS-driven behavior once a
  visitor has made an explicit choice. The approved build-plan item describes
  a binary toggle; a reset control is a separate future feature if wanted.
- Any new Payload field beyond the single `Header.showThemeToggle` on/off
  switch added in step 5. The visitor's chosen theme itself is still a pure
  client-side preference, not editor-controlled content - only whether the
  control appears at all is editor-controlled.
- Very old browsers that lack native `light-dark()` support. Lightning CSS's
  automatic `prefers-color-scheme` downlevel fallback for those browsers will
  not respect the manual override; this matches the project's existing
  browser-support baseline for `light-dark()` itself.

## Build loop

Per `blueprint/config.json`: `stepReview` is `feature` (one combined review
after all steps below, not a pause after each one) and `checkpointCommits` is
`disabled` (no intermediate commits; `/complete` makes the one feature
commit).

## Build steps

- [x] 1. **No-flash theme foundation (utility + init script + CSS hook)**
  - Add `src/utilities/theme.ts` exporting: a `Theme = 'light' | 'dark'`
    type, a `THEME_STORAGE_KEY = 'theme'` constant, a pure `isTheme(value:
    unknown): value is Theme` validator, and a `themeInitScript()` function
    that returns the exact inline-script source (see Data / contracts).
  - In `src/app/(frontend)/layout.tsx`, render that script via `next/script`
    with `strategy="beforeInteractive"` and `dangerouslySetInnerHTML`, as the
    first child of `<body>`. Do **not** read the preference with
    `cookies()`/`headers()` or any other server-side request API in this
    layout: this route tree is currently statically cacheable (feature 8,
    cache-tagged rendering), and any `next/headers` call in a layout with no
    Partial Prerendering configured (`next.config.mjs` has no
    `experimental.ppr`) forces the entire frontend to render dynamically on
    every request. The whole point of the inline `beforeInteractive` script
    is to read `localStorage` in the browser, before paint, so the server
    side stays fully static.
  - In `src/app/(frontend)/styles/base/_reset.css`, add
    `html[data-theme='light'] { color-scheme: light; }` and
    `html[data-theme='dark'] { color-scheme: dark; }` inside the existing
    `@layer base` block, right after the current `:root { color-scheme: light
    dark; }` rule. This one addition is sufficient to flip every
    `light-dark()` token in `_alias-tokens.css` site-wide; that file needs no
    changes.
  - Add `tests/int/theme.int.spec.ts` covering `isTheme`: accepts `'light'`
    and `'dark'`, rejects `undefined`, `null`, empty string, and an arbitrary
    string.
  - Done when: `npm run test:int` passes with the new test, and manually
    running `localStorage.setItem('theme', 'dark')` then reloading any page
    shows `<html data-theme="dark">` and every `light-dark()`-driven color
    flipped, confirmed with a dev-server screenshot; with no stored value the
    site is pixel-identical to current OS-driven behavior.

- [x] 2. **Keep the header's dark/light-conditional rules in sync**
  - In `src/globals/Header/Component/_header.css`, the four
    `@media (prefers-color-scheme: dark|light)` blocks (logo swap around line
    48, and the four "adopt the surface underneath" transparent-header
    blocks around lines 217-263) only react to the real OS setting, not
    `data-theme`. Add matching `html[data-theme='dark'] ...` /
    `html[data-theme='light'] ...` attribute-selector rules alongside each
    one, mirroring the same selectors and declarations. (These naturally
    take precedence over the plain OS-media rules because the added `html[data-theme=...]`
    prefix gives them higher specificity, regardless of source order, so a
    manual override always wins over a conflicting OS default.)
  - Done when: with `localStorage` forced to `'dark'` while the OS is set to
    light (or vice versa), the header logo and the transparent-header
    foreground color both match the manual choice, not the OS setting,
    confirmed with a dev-server screenshot.

- [x] 3. **Visitor-facing toggle control**
  - Add `src/globals/Header/Component/ThemeToggle.tsx`, a client component
    (alongside `Logo.tsx` in the same folder): renders a fixed-size icon
    button (Sun/Moon from `lucide-react`, matching the Menu/X pattern already
    in `HeaderClient.tsx`). Render nothing visually distinguishable (an
    empty placeholder of the same size, no icon) until mounted, to avoid a
    hydration mismatch, since the server cannot know the stored preference.
  - On mount, read `document.documentElement.dataset.theme`; if unset, fall
    back to `window.matchMedia('(prefers-color-scheme: dark)').matches` for
    the icon's initial visual state only (this never writes the attribute or
    storage; the site keeps following the OS default until the visitor
    clicks).
  - On click: compute the opposite of the current effective theme, then
    `document.documentElement.setAttribute('data-theme', next)` and
    `localStorage.setItem(THEME_STORAGE_KEY, next)`, wrapped in try/catch
    (Safari private browsing and similar contexts can throw on storage
    access; the DOM attribute update must still happen even if persistence
    fails). Update local state so the icon and `aria-label` flip immediately.
  - Wire it into `src/globals/Header/Component/HeaderClient.tsx`, visible in
    `.header__bar` at every breakpoint (not hidden above/below `atMedium`
    like the hamburger), with an `aria-label` of "Switch to dark mode" /
    "Switch to light mode" matching the existing hamburger's aria-label
    pattern.
  - Add `tests/e2e/theme-toggle.spec.ts` (first Playwright spec in the
    project; create `tests/e2e/`): load a page, click the toggle, assert
    `html[data-theme]` flips, reload, and assert the theme persisted.
  - Done when: `npm run test:e2e` passes with the new spec, `npm run lint`
    and `npm run build` both pass, and manual verification on the running
    dev server shows the toggle switching the whole page instantly with no
    reload and no flash on a subsequent hard reload.

- [x] 4. **Bring the docs in line with reality**
  - `src/app/(frontend)/styles/README.md`'s "Dark mode" section currently
    says "No `.dark` class, no JavaScript, no flash." Update it to describe
    the `data-theme` attribute, the `beforeInteractive` init script, and that
    `light-dark()`/`color-scheme` mechanics are otherwise unchanged.
  - `blueprint/context/coding-standards.md`'s Styling section currently says
    "Theming is `light-dark()`-based (no `.dark` class, no JS toggle)."
    Update this line to match.
  - `src/app/(frontend)/styles/base/_alias-tokens.css`'s top comment ("No
    .dark class, no JS, no flash") gets the same correction.
  - Done when: the three files no longer contradict the shipped behavior;
    `npm run lint` still passes (doc-only diff otherwise).

- [x] 5. **Editor on/off switch for the toggle**
  - Since this is a template repository cloned per site, not every site
    should be forced to carry a visitor-facing dark mode control. Add
    `showThemeToggle` (checkbox, `defaultValue: true`) to
    `headerAppearanceField()` in `src/fields/appearance.ts`, alongside
    `transparentAtTop` - same collapsible "Appearance" section on the
    `Header` global.
  - Add `isThemeToggleEnabled(value: unknown): boolean` to
    `src/utilities/theme.ts` (`value !== false`, so `undefined` - existing
    documents that predate this field - is treated as enabled, same
    convention `HeaderClient.tsx` already uses for `transparentAtTop`).
  - In `HeaderClient.tsx`, destructure `showThemeToggle` from `header` and
    wrap the existing `<ThemeToggle />` with
    `{isThemeToggleEnabled(showThemeToggle) && <ThemeToggle />}`.
  - Regenerate `src/payload-types.ts` with `npm run generate:types`
    (generated file, not hand-edited).
  - Add unit test cases to `tests/int/theme.int.spec.ts` for
    `isThemeToggleEnabled`: `true` stays enabled, `false` disables it,
    `undefined`/`null` are treated as enabled.
  - Done when: `npm run test:int`, `npm run lint`, and `npm run build` all
    pass; manually toggling `showThemeToggle` off in `/admin` -> Header ->
    Appearance removes the sun/moon button from the rendered header.

## Files / areas

- `src/utilities/theme.ts` (new)
- `tests/int/theme.int.spec.ts` (new)
- `tests/e2e/theme-toggle.spec.ts` (new, first file under `tests/e2e/`)
- `src/app/(frontend)/layout.tsx`
- `src/app/(frontend)/styles/base/_reset.css`
- `src/globals/Header/Component/_header.css`
- `src/globals/Header/Component/ThemeToggle.tsx` (new)
- `src/globals/Header/Component/HeaderClient.tsx`
- `src/app/(frontend)/styles/README.md`
- `blueprint/context/coding-standards.md`
- `src/app/(frontend)/styles/base/_alias-tokens.css` (comment only)
- `src/fields/appearance.ts` (new `showThemeToggle` field)
- `src/payload-types.ts` (regenerated)

## Data / contracts

- `localStorage` key `theme` (constant `THEME_STORAGE_KEY`), value exactly
  `'light'` or `'dark'`. Any other value (missing, malformed, from an older
  or future version) is treated as "no preference" and ignored by
  `isTheme()` - never thrown, never partially applied.
- `data-theme` attribute on `<html>`: `'light'` | `'dark'` | absent. Absent
  means "follow the OS `prefers-color-scheme` default", exactly today's
  behavior. This attribute is the single signal every CSS rule in this
  feature keys off; no other flag or class is introduced.
- The `beforeInteractive` init script is a static string with no interpolated
  request data, CMS content, or user input. `themeInitScript()` only
  interpolates the internal `THEME_STORAGE_KEY` constant - never template
  anything else into it, since it is injected as raw HTML.
- `Header.showThemeToggle` (checkbox, `defaultValue: true`): `false` hides
  the toggle control entirely; `true`, `undefined`, or `null` all show it.
  This is the only Payload schema change in this feature - the visitor's
  chosen theme itself is still never persisted server-side.

## Testing

- Unit (Vitest, `npm run test:int`): `tests/int/theme.int.spec.ts` covers
  `isTheme()`'s and `isThemeToggleEnabled()`'s accept/reject cases. This is
  the only pure logic the feature introduces.
- Browser (Playwright, `npm run test:e2e`): `tests/e2e/theme-toggle.spec.ts`
  covers the click-to-flip and persists-after-reload behavior, which cannot
  be verified by a unit test.
- Everything else (CSS specificity/parity, no-flash on load, favicon
  unaffected) is verified manually against the running dev server with
  screenshots, per step done-whens above.

## Notes for the AI

- Do not switch the persistence or initial-paint mechanism to
  `cookies()`/`next/headers` "to make it simpler." That was deliberately
  rejected because it would force the entire `(frontend)` route tree to
  render dynamically (no Partial Prerendering is configured), regressing the
  shipped cache-tagged rendering feature. `localStorage` plus a
  `beforeInteractive` inline script is the locked mechanism for this
  feature.
- The attribute-selector CSS added in step 2 must be additive next to the
  existing `@media (prefers-color-scheme: ...)` blocks, not a replacement of
  them - the OS-driven fallback for visitors who never touch the toggle must
  keep working exactly as it does today.
- Reuse the existing Sun/Moon-style icon-button visual language already
  established by the hamburger button in `HeaderClient.tsx` (same sizing,
  hover, and `aria-label` conventions) rather than inventing a new control
  style.
