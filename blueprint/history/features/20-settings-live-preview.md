# Current Feature

**Status:** verified

**Branch:** feature/settings-live-preview

## Goal

Extend live preview (feature 15, extended in 16/17/19) to the `Settings`
global. Settings has two fields that actually render somewhere visible on the
frontend: `siteName` (Footer's copyright line, a static passthrough since
feature 17 explicitly deferred this) and `imageRadius` (the `data-image-radius`
attribute on `<html>` driving the `--radius-image` token across every image
site-wide, feature 13). This feature makes both reactive during a Settings
live-preview session. `siteDescription`, `gtmCode`, and the site icons
(`icon`/`iconDark`) only ever render into `<head>`/browser chrome, never into
the visible page body, so they stay non-reactive - the same rule already
applied to `meta` on Pages/Posts/blog (feature 19).

## In scope

- `admin.livePreview.globals` (`src/payload.config.ts`) gains `'settings'`.
  No resolver change needed - `livePreviewPath({ type: 'global' })` already
  returns `'/'` for any global slug.
- `siteName` becomes reactive in Footer's copyright line via a second
  `useScopedLivePreview` instance in `FooterClient`, alongside its existing
  `footer`-scoped one.
- `imageRadius` becomes reactive site-wide via a new, always-mounted,
  render-nothing client component that syncs the `data-image-radius`
  attribute on `<html>` when a live-preview message arrives, following the
  same `document.documentElement.setAttribute` technique `ThemeToggle`
  already uses for `data-theme`.

## Out of scope

- **`logo` in Footer.** Stays a static snapshot from Header, unchanged - this
  feature only adds a second hook for Settings' own fields, it doesn't touch
  Footer's existing Header-sourced prop.
- **`siteDescription`, `gtmCode`, `icon`, `iconDark`.** Never rendered in the
  visible page body (meta description, GTM `<script>`, and favicon
  respectively) - matches the established rule that head-only/chrome-only
  fields never get live-preview reactivity.
- **Any change to `livePreviewPath.ts`, `useScopedLivePreview.ts`, `HeaderClient`,
  `PageClient`, or `PostClient`.** All already correct and generic enough to
  support a third global without modification.
- **Payload drafts/versions/autosave.** Same rejection reasoning as features
  15-17/19.
- **Automated browser/e2e coverage.** Same testing-scope reasoning as
  features 15-17/19 - the admin live-preview iframe/`postMessage` handshake
  is verified manually (see Testing).

## Build loop

Per `blueprint/config.json`: `stepReview` is `feature` (one combined review
after all steps below) and `checkpointCommits` is `disabled` (no intermediate
commits; `/complete` makes the one feature commit).

## Build steps

- [x] 1. **Payload config: enable Settings in admin.livePreview**
  - In `src/payload.config.ts`, add `'settings'` to the existing
    `admin.livePreview.globals` array (`['header', 'footer', 'settings']`).
    No other change to the `livePreview` block.
  - Done when: `npm run build` passes; manual (dev server): opening the
    `Settings` global's edit view in `/admin` shows a Live Preview button
    pointing at the homepage.

- [x] 2. **Footer: make siteName reactive**
  - In `src/globals/Footer/Component/index.tsx`, pass the whole `settings`
    object to `FooterClient` as `initialSettings={settings}`, replacing the
    current `siteName={settings.siteName}` prop.
  - In `src/globals/Footer/Component/FooterClient.tsx`, replace the
    `siteName: string` prop with `initialSettings: Setting` (type from
    `@/payload-types`). Add a second hook call: `useScopedLivePreview<Setting>({
    target: { type: 'global', globalSlug: 'settings' }, initialData:
    initialSettings, serverURL: getServerSideURL(), depth: 2 })`, and
    destructure `siteName` from its result for the copyright paragraph in
    place of the old prop. Update the component's header comment - it
    currently says both `logo` and `siteName` are one-time snapshots; after
    this step only `logo` still is.
  - Done when: `npm run lint` and `npm run build` pass. Manual (dev server):
    editing Settings' Site Name field with the homepage Live Preview open
    updates Footer's copyright text without saving; Footer's logo is
    unaffected by that same edit.

- [x] 3. **Site-wide: make imageRadius reactive**
  - Add `src/globals/Settings/Component/SettingsLivePreviewSync.tsx`: a
    `'use client'` component taking `{ initialSettings: Setting }`, calling
    `useScopedLivePreview<Setting>({ target: { type: 'global', globalSlug:
    'settings' }, initialData: initialSettings, serverURL:
    getServerSideURL(), depth: 2 })`, and in a `useEffect` keyed on the
    hook's `imageRadius` value, calling
    `document.documentElement.setAttribute('data-image-radius', imageRadius ?? 'md')`
    (mirroring `ThemeToggle.tsx`'s use of `document.documentElement.setAttribute`
    for `data-theme`). Renders `null`.
  - In `src/app/(frontend)/layout.tsx`, render
    `<SettingsLivePreviewSync initialSettings={settings} />` once inside
    `RootLayout`, reusing the `settings` object the layout already fetches
    via `getCachedGlobal('settings', 1)()` - do not add a second fetch.
  - Done when: `npm run lint` and `npm run build` pass. Manual (dev server):
    editing Settings' Image Corner Radius field with the homepage Live
    Preview open visibly changes image corner rounding (e.g. on the Hero or
    a Card) without saving; reloading a normal (non-preview) page still
    shows the server-rendered default from the saved value.

## Files / areas

- `src/payload.config.ts` - enable Settings in `admin.livePreview.globals`
- `src/globals/Footer/Component/index.tsx` - pass full `settings` through
- `src/globals/Footer/Component/FooterClient.tsx` - second hook for `siteName`
- `src/globals/Settings/Component/SettingsLivePreviewSync.tsx` - new
- `src/app/(frontend)/layout.tsx` - mount the new sync component

## Data / contracts

- `admin.livePreview.globals` gains `'settings'`. No change to
  `livePreviewPath`'s `{ type: 'global' }` branch, which already returns
  `'/'` for any global slug.
- `FooterClient` prop change: `siteName: string` -> `initialSettings: Setting`.
  The caller now passes the whole global instead of one field.
- `SettingsLivePreviewSync` props: `{ initialSettings: Setting }`. No return
  value beyond `null` - its only effect is the `data-image-radius` DOM
  attribute side effect.
- Reactive via live preview: `siteName` (Footer copyright) and `imageRadius`
  (`data-image-radius` on `<html>`, feeding the existing `--radius-image`
  CSS attribute selectors in `_alias-tokens.css` - those selectors are
  unchanged).
- Not reactive: Footer's `logo`; Settings' `siteDescription`, `gtmCode`,
  `icon`, `iconDark`.
- No Payload schema, collection, or global field changes.
- Two independent `useScopedLivePreview` instances will target the same
  `globalSlug: 'settings'` (FooterClient's and SettingsLivePreviewSync's).
  This is a simpler case than the cross-target coexistence feature 17 had to
  verify (Header/Footer/Page hooks with *different* targets on one page) -
  same-target instances each keep their own local merge cache and simply
  react to the same messages independently; no new guarding needed.

## Testing

- No new pure logic - `useScopedLivePreview` and `livePreviewPath` are
  unchanged and already unit-tested (`tests/int/livePreviewPath.int.spec.ts`).
- No browser/e2e test - see Out of scope. Manual verification in steps 2 and
  3's Done when instead, since that's what actually exercises the
  `postMessage` merge and the DOM attribute side effect.

## Notes for the AI

- Reuse `useScopedLivePreview` exactly as-is; do not modify it for this
  feature.
- Keep using `getServerSideURL()` for `serverURL` in both new hook calls -
  don't introduce a new env var or inline fallback.
- `SettingsLivePreviewSync` must render `null` and touch only
  `data-image-radius` - never `data-theme` (that stays `ThemeToggle`'s and
  the beforeInteractive init script's territory) and never any other `<html>`
  attribute.
- Don't add a second `getCachedGlobal('settings', ...)` fetch in
  `layout.tsx`; it already fetches `settings` at depth 1 for
  `generateMetadata` and the existing `data-image-radius` attribute - reuse
  that same value as `SettingsLivePreviewSync`'s `initialSettings`.
- Don't touch `Footer/Component/index.tsx`'s depth-0 `getCachedGlobal('settings')()`
  call - `siteName` is a scalar field, so the default depth is fine for it.
