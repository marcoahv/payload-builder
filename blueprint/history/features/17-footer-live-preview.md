# Current Feature

**Branch:** feature/footer-live-preview
**Status:** verified

## Goal

Extend build plan item 17: give editors a live-updating preview pane for the
`Footer` global's own fields (`navLinks`, appearance), reusing feature 16's
`useScopedLivePreview` hook (`src/utilities/useScopedLivePreview.ts`) and its
`admin.livePreview.globals` wiring pattern (`src/payload.config.ts`), the
same way feature 16 did for `Header`.

Footer currently has no client component at all — it is a plain server
component (`src/globals/Footer/Component/index.tsx`) that fetches `header`,
`footer`, and `settings` in parallel and renders everything server-side. It
reuses `header.logo` for its logo (no logo field of its own) and
`settings.siteName` for its copyright line. Editing Footer's own admin view
resolves to the same `'/'` Live Preview URL every global uses
(`livePreviewPath({ type: 'global' })`, unchanged from feature 16), which is
the homepage — meaning the homepage's own `Page` document (via
`PageClient`'s `useScopedLivePreview` targeting `collectionSlug: 'pages'`)
and `Header`'s hook (`globalSlug: 'header'`) are *already* mounted on that
same page from feature 16. Adding Footer's hook (`globalSlug: 'footer'`)
makes three independently-scoped hooks coexist on one page. Each hook already
ignores any message that doesn't match its own exact target, which is the
property that made Header+Page safe in feature 16 — this feature must
confirm that property still holds with a third hook mounted, not assume it
from the pairwise case.

## In scope

- `admin.livePreview.globals` in `src/payload.config.ts` gains `'footer'`
  (`['header', 'footer']`). No resolver change needed — the existing
  `url` resolver already branches generically on `globalConfig` for any
  global, and `livePreviewPath({ type: 'global' })` already returns `'/'`
  for any global slug.
- A new `src/globals/Footer/Component/FooterClient.tsx` (`'use client'`):
  takes `initialFooter: Footer` plus two static, non-reactive passthrough
  props — `logo` (from `header.logo`) and `siteName` (from
  `settings.siteName`) — calls `useScopedLivePreview<Footer>({ target: {
  type: 'global', globalSlug: 'footer' }, initialData: initialFooter,
  serverURL: getServerSideURL(), depth: 2 })`, and renders the exact markup
  `Footer/Component/index.tsx` renders today: reading `navLinks`/`surface`/
  `spacing`/`width` from the hook's live data, and `logo`/`siteName` from the
  static props.
- `src/globals/Footer/Component/index.tsx` keeps its existing parallel fetch
  of `header`/`footer`/`settings` and its `if (!header) return null` guard,
  but delegates all rendering to
  `<FooterClient initialFooter={footer} logo={header.logo} siteName={settings.siteName} />`.
  (`footer` from `getCachedGlobal('footer', 2)()` is a full `Footer` object,
  never `null` — Payload globals always resolve to a real document — so the
  existing `footer?.navLinks`/`footer ?? {}` defensive style in the current
  code was unnecessary caution, not a real null case; `FooterClient` can
  destructure `navLinks`/`surface`/`spacing`/`width` directly, matching how
  `HeaderClient` already treats its guaranteed-present `header` prop.)
- No visible or behavioral change for real site visitors outside the
  admin's live-preview iframe.
- Manually verifying that all three hooks now mounted on the homepage
  (Footer's, Header's, and the homepage Page's own) continue to ignore
  messages meant for each other in every direction — this is the property
  feature 16 discovered was not automatic and had to fix after the fact.

## Out of scope

- **Making Footer's `logo`/`siteName` live-reactive to Header/Settings
  edits.** They stay static passthrough props sourced from the server fetch
  at load time, matching how Post's breadcrumbs/related-posts stayed
  non-reactive in feature 15 (derived from other documents, not the one
  being edited). Approved explicitly for this pass; making them reactive
  would require mounting additional hooks (`header`, `settings`) during a
  Footer-focused preview session, which is a separate, bigger design
  question this feature doesn't answer.
- **Settings live preview.** Still a separate future addition, unaffected by
  this feature.
- **Changing `admin.livePreview.collections`, `livePreviewPath`,
  `useScopedLivePreview`, `HeaderClient`, or `PageClient`/`PostClient`.**
  All already correct from feature 16; this feature only adds Footer as a
  new caller of the existing, unmodified hook.
- **Payload drafts/versions/autosave and `RefreshRouteOnSave`.** Same
  rejection reasoning as features 15/16.
- **New env vars.** Reuses `getServerSideURL()` (`src/utilities/getUrl.ts`).
- **Any change to real-visitor data fetching or caching.** `getCachedGlobal`'s
  `unstable_cache` wrapper and the `global_footer`/`global_header`/
  `global_settings` revalidation tags are untouched.
- **Automated browser/e2e coverage.** Same testing-scope reasoning as
  features 15/16 — real admin-iframe `postMessage` behavior, verified
  manually instead (see Testing).

## Build loop

Per `blueprint/config.json`: `stepReview` is `feature` (one combined review
after all steps below) and `checkpointCommits` is `disabled` (no
intermediate commits; `/complete` makes the one feature commit).

## Build steps

- [x] 1. **Payload config: enable Footer in admin.livePreview**
  - In `src/payload.config.ts`, add `'footer'` to the existing
    `admin.livePreview.globals` array (`['header', 'footer']`). No other
    change to the `livePreview` block.
  - Done when: `npm run lint` and `npm run build` pass; manual (dev server):
    opening the `Footer` global's edit view in `/admin` shows a Live Preview
    button pointing at the homepage.

- [x] 2. **Footer: split into FooterClient and wire the scoped hook**
  - Add `src/globals/Footer/Component/FooterClient.tsx`, moving the JSX
    (the `<footer>`, `Container`, `Logo`, nav/links list, and copyright
    paragraph) out of `index.tsx` verbatim, reading `navLinks`/`surface`/
    `spacing`/`width` from `useScopedLivePreview<Footer>({ target: { type:
    'global', globalSlug: 'footer' }, initialData: initialFooter, serverURL:
    getServerSideURL(), depth: 2 })`'s return value, and `logo`/`siteName`
    from its own props (not the hook).
  - Update `src/globals/Footer/Component/index.tsx` to import and render
    `<FooterClient initialFooter={footer} logo={header.logo}
    siteName={settings.siteName} />` in place of its current inline JSX,
    keeping its existing parallel `getCachedGlobal` fetch and `if (!header)
    return null` guard unchanged.
  - Done when: `npm run lint`, `npm run test:int`, and `npm run build` all
    pass. Manual (dev server):
    - Editing Footer's nav links or appearance in `/admin` and opening Live
      Preview shows the change appear as you type, with no save.
    - Footer's logo and site-name stay exactly as originally loaded during
      that same session (confirms the deliberate non-reactive boundary).
    - With Footer's Live Preview open, Header's own rendering and the
      homepage Page's own blocks are unaffected by the Footer edit message.
    - With Header's Live Preview open (from feature 16) or the homepage
      Page's own Live Preview open, editing that document does not affect
      Footer's rendering, and Footer's own hook does not react to those
      messages either — confirms all three hooks now on the homepage ignore
      each other correctly in every direction.

## Files / areas

- `src/payload.config.ts`
- `src/globals/Footer/Component/FooterClient.tsx` (new)
- `src/globals/Footer/Component/index.tsx`

## Data / contracts

- No changes to `useScopedLivePreview`, `livePreviewPath`, or the
  `admin.livePreview.url` resolver — all already generic enough to support
  a second global without modification.
- `FooterClient`'s `logo`/`siteName` props are a one-time snapshot from the
  server fetch, not wired to any live-preview hook — they will not update
  during a Footer live-preview session even if Header or Settings is edited
  concurrently in another tab. This is a deliberate, recorded contract, not
  an oversight.
- No Payload schema, collection, or global field changes.
- `depth: 2` matches the existing `getCachedGlobal('footer', 2)` fetch depth
  so `navLinks`' related-page relationships don't disappear from the preview
  after a merge.
- Security/correctness property that must not regress (carried over from
  features 15/16): the live merge happens entirely inside the browser tab
  the admin's own iframe controls, via `window.postMessage`. A normal page
  load never establishes that channel.
- Regression property specific to this feature: adding a third
  `useScopedLivePreview` instance (Footer's) to the homepage must not change
  the behavior of the existing Header or Page hooks from feature 16, and
  vice versa — verified manually in step 2's Done when.

## Testing

- No new pure logic — `useScopedLivePreview` and `livePreviewPath` are
  unchanged and already unit-tested (`tests/int/livePreviewPath.int.spec.ts`).
- No browser/e2e test — see Out of scope; manual verification in step 2's
  Done when instead, which is the one that actually exercises three hooks
  coexisting.

## Notes for the AI

- Reuse `useScopedLivePreview` exactly as-is; do not modify it for this
  feature. It already supports an arbitrary `globalSlug`/`collectionSlug`
  target.
- Do not make `logo`/`siteName` live-reactive in this pass — that requires
  mounting additional hooks and is explicitly deferred (see Out of scope).
- Keep using `getServerSideURL()` for `serverURL` — don't introduce a new
  env var or inline fallback expression.
- The `footer?.navLinks`/`footer ?? {}` style in the current
  `Footer/Component/index.tsx` can be simplified away once `FooterClient`
  destructures `initialFooter` directly — `footer` is never actually `null`
  (Payload globals always resolve to a real document); don't reintroduce
  unnecessary optional chaining there.
- Before marking this feature verified, actually perform the three-way
  manual check in step 2's Done when — do not assume it passes by analogy to
  feature 16's two-hook case. Feature 16 shipped with exactly that
  assumption once already and it was wrong.
