# Current Feature

**Branch:** feature/header-live-preview
**Status:** verified

## Goal

Extend build plan item 16: give editors a live-updating preview pane for the
`Header` global, the same way feature 15 already did for Pages and Posts —
editing Header in the admin panel renders unsaved changes instantly, with no
save and no drafts/versions required.

Header renders on every page via the root layout, so it now sits inside the
same iframe as whichever Page's or Post's own live-preview hook (from
feature 15) is already mounted there. Payload's own live-preview merge
mechanism (`@payloadcms/live-preview`'s `handleMessage`/`subscribe`) has no
concept of "which document this hook instance is watching" and keeps its
merge cache as a module-level singleton, so two `useLivePreview` instances
mounted at once corrupt each other's data and stomp each other's cache. This
was confirmed by reading `node_modules/@payloadcms/live-preview/dist/{handleMessage,subscribe,isLivePreviewEvent}.js`
directly, and then confirmed live: editing Header while a Page's own Live
Preview was open replaced the Page's `data` with the raw Header document
(no `blocks` field), so `<Blocks blocks={data.blocks}/>` rendered nothing —
Header and Footer still rendered because Header's own hook matched
correctly and Footer isn't wired to any hook. **The fix has to be
symmetric**: both the new Header hook and the *existing* `PageClient`/
`PostClient` hooks (from feature 15) need slug filtering, not just the new
one — the vulnerability lives in whichever hook is naively reacting to a
message meant for someone else, and that was true of the old hooks too the
moment a second hook (Header's) got mounted alongside them.

## In scope

- A new `src/utilities/useScopedLivePreview.ts` hook: filters incoming
  `postMessage` events to only the ones matching a specific
  `{ type: 'global'; globalSlug }` or `{ type: 'collection'; collectionSlug }`
  target (mirroring `livePreviewPath`'s existing discriminated-union style),
  and keeps its merge cache in a component-local `useRef` instead of the
  package's shared singleton.
- `admin.livePreview.globals: ['header']` in `src/payload.config.ts`, and
  extending the existing `url` resolver to branch on `globalConfig` (routing
  to the already-tested `livePreviewPath({ type: 'global' })`, which already
  returns `'/'`) alongside its current `collectionConfig` branch for
  Pages/Posts.
- Wiring `src/globals/Header/Component/HeaderClient.tsx` to call the new
  hook (`target: { type: 'global', globalSlug: 'header' }`) and render from
  its returned data instead of its raw `header` prop (renamed
  `initialHeader`), and updating `src/globals/Header/Component/index.tsx`'s
  one call site to match.
- **Migrating `PageClient.tsx` and `PostClient.tsx` (feature 15) off the
  stock `useLivePreview` and onto the same `useScopedLivePreview` hook**,
  scoped to `{ type: 'collection', collectionSlug: 'pages' }` /
  `'posts'` respectively. Required, not optional: without this, Header's
  hook working correctly is not enough — the Page/Post hooks remain
  unscoped and still corrupt themselves on a Header edit message, which is
  the exact regression observed above.
- Removing `@payloadcms/live-preview-react` (its only usages, the stock
  `useLivePreview` calls, are gone) and adding `@payloadcms/live-preview`
  (already an installed transitive dependency at `3.89.0`) as a direct
  dependency, since `useScopedLivePreview` imports from it directly.
- No visible or behavioral change for real site visitors outside the
  admin's live-preview iframe.

## Out of scope

- **Footer and Settings live preview.** Still a deliberately separate future
  addition (recorded in `project-plan.md`'s UI/UX section and this build
  plan). Each would reuse `useScopedLivePreview` the same way Header does
  here; Footer additionally reads `header.logo`/`settings.siteName` from
  other documents, which is a separate design question this feature doesn't
  need to answer.
- **Changing `admin.livePreview.collections`.** Still just `['pages',
  'posts']` — this feature adds `globals: ['header']` alongside it, not a
  change to which collections are live-previewable.
- **Payload drafts/versions/autosave and the server-side `RefreshRouteOnSave`
  pattern.** Same rejection reasoning as feature 15: `Header` isn't
  versioned, and the server-side pattern only reflects saved state.
- **New env vars.** Reuses the existing `getServerSideURL()` utility
  (`src/utilities/getUrl.ts`, wrapping
  `process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'`), already
  used client-side by `PageClient.tsx`.
- **Any change to real-visitor data fetching or caching.** `getCachedGlobal`'s
  `unstable_cache` wrapper and the `global_header` revalidation tag are
  untouched; this feature only adds/changes client-side rendering paths that
  are a no-op outside the admin's iframe.
- **Automated browser/e2e coverage.** The core behavior (admin iframe
  `postMessage` merging into a live document, and multiple such hooks
  coexisting safely) is real-browser, real-admin-panel integration behavior
  that can't be verified from documentation alone, per the same
  testing-scope reasoning feature 15 used. Manual verification is required
  instead (see Testing).

## Build loop

Per `blueprint/config.json`: `stepReview` is `feature` (one combined review
after all steps below) and `checkpointCommits` is `disabled` (no
intermediate commits; `/complete` makes the one feature commit).

## Build steps

- [x] 1. **Scoped live-preview hook utility**
  - Add `src/utilities/useScopedLivePreview.ts`, accepting a
    `target: { type: 'global'; globalSlug: string } | { type: 'collection';
    collectionSlug: string }` (mirroring `livePreviewPath`'s existing input
    shape) instead of a `globalSlug`-only param, built from
    `isLivePreviewEvent`, `mergeData`, and `ready` (the package's only
    stateless exports), with a per-instance `useRef` cache.
  - Done when: `npm run lint` and `npm run build` pass.

- [x] 2. **Payload config: enable Header in admin.livePreview**
  - In `src/payload.config.ts`, add `globals: ['header']` to the existing
    `admin.livePreview` block.
  - Update the `url` resolver to accept `globalConfig` and branch:
    `globalConfig ? livePreviewPath({ type: 'global' }) : livePreviewPath({ type: 'collection', collectionSlug: collectionConfig?.slug ?? '', docSlug: data?.slug })`,
    prefixed with `getServerSideURL()` as today.
  - Done when: `npm run lint` and `npm run build` pass; manual (dev server):
    opening the `Header` global's edit view in `/admin` shows a Live Preview
    button pointing at the homepage.

- [x] 3. **Header: wire the scoped hook into HeaderClient**
  - In `src/globals/Header/Component/HeaderClient.tsx`, rename the prop to
    `initialHeader: Header`, call `useScopedLivePreview<Header>({ target: {
    type: 'global', globalSlug: 'header' }, initialData: initialHeader,
    serverURL: getServerSideURL(), depth: 2 })`, and destructure the fields
    it already renders from the hook's returned data instead of the raw
    prop.
  - Update `src/globals/Header/Component/index.tsx`'s one call site to pass
    `initialHeader={header}` instead of `header={header}`.
  - Done when: `npm run lint` and `npm run build` pass.

- [x] 4. **Fix: migrate Page/Post's own hooks to the scoped hook (regression
  found by manual testing)**
  - Manual testing of step 3 surfaced the predicted regression: with
    Header's hook mounted, opening a Page's Live Preview and editing Header
    wiped the page's rendered blocks, because `PageClient`/`PostClient`
    still used the stock `useLivePreview`, which has no slug filter and
    merged Header's message into the page's own `data`.
  - In `src/app/(frontend)/[slug]/PageClient.tsx`, replace `useLivePreview`
    (from `@payloadcms/live-preview-react`) with `useScopedLivePreview<PageType>({
    target: { type: 'collection', collectionSlug: 'pages' }, initialData,
    serverURL: getServerSideURL(), depth: 2 })`.
  - In `src/app/(frontend)/blog/[slug]/PostClient.tsx`, same change with
    `target: { type: 'collection', collectionSlug: 'posts' }`.
  - Remove the now-unused `@payloadcms/live-preview-react` dependency; add
    `@payloadcms/live-preview` (matching the already-installed `3.89.0`) as
    a direct dependency.
  - Done when: `npm run lint`, `npm run test:int`, and `npm run build` all
    pass. Manual (dev server): editing Header's fields while a Page's or
    Post's own Live Preview is open updates Header live and leaves the
    Page's/Post's own rendered content untouched, and vice versa — the two
    hooks no longer cross-contaminate in either direction.

## Files / areas

- `src/utilities/useScopedLivePreview.ts` (new; supersedes the
  `useScopedGlobalLivePreview.ts` from step 1/3, generalized in step 4)
- `src/payload.config.ts`
- `src/globals/Header/Component/HeaderClient.tsx`
- `src/globals/Header/Component/index.tsx`
- `src/app/(frontend)/[slug]/PageClient.tsx`
- `src/app/(frontend)/blog/[slug]/PostClient.tsx`
- `package.json` / lockfile — swap `@payloadcms/live-preview-react` for a
  direct `@payloadcms/live-preview` dependency

## Data / contracts

- `useScopedLivePreview<T>({ target, initialData, serverURL, depth })`
  returns `T`: either the most recently merged live data for that exact
  `target`, or `initialData` if no matching message has arrived yet. It
  ignores every `postMessage` whose slug doesn't match the target —
  `globalSlug` for `{ type: 'global' }`, `collectionSlug` for
  `{ type: 'collection' }` — so a Header edit and a Page/Post edit never
  cross-contaminate each other's mounted hook.
- Each hook instance keeps its own merge cache (a local `useRef`), not the
  `@payloadcms/live-preview` package's module-level singleton — required,
  not stylistic: mounting two `useLivePreview` (stock) instances on one page
  corrupts both, confirmed live in step 4.
- No Payload schema, collection, or global field changes.
- `depth: 2` is used for every call site (Header, Pages, Posts), matching
  each one's existing server-fetch depth, so relationships (a navLink's
  related page, a social link's icon, a post's author/category) don't
  disappear from the preview after a merge.
- Security/correctness property that must not regress (carried over from
  feature 15): the live merge happens entirely inside the browser tab the
  admin's own iframe controls, via `window.postMessage`. A normal page load
  never establishes that channel, so there is no path for an unsaved edit to
  reach a real visitor.

## Testing

- No new pure logic beyond what `livePreviewPath` already covers (its
  `type: 'global'` branch was already unit-tested in feature 15's
  `tests/int/livePreviewPath.int.spec.ts`, still passing unchanged).
- `useScopedLivePreview` is a stateful hook wired to real `window` message
  events and a real admin-iframe protocol — same category as `useLivePreview`
  itself, which feature 15 also left to manual verification rather than a
  unit test, per this project's testing-scope rule for integration-level
  surfaces.
- No browser/e2e test — see Out of scope; manual verification in step 4's
  Done when instead, which is the one that actually exercises both hooks
  coexisting.

## Notes for the AI

- Do not use `useLivePreview` from `@payloadcms/live-preview-react` anywhere
  in this app. It shares a module-level merge-cache singleton across every
  mounted instance and has no per-instance slug filter — confirmed unsafe by
  live reproduction, not just by reading source. `useScopedLivePreview` is
  the one hook every live-preview call site (Header, Pages, Posts) should
  use; don't "simplify" any of them back to the stock hook.
- Do not extend `admin.livePreview.globals` to include `footer` or
  `settings` in this pass — that is an intentional, separately-specced
  fast-follow, not an oversight to "complete."
- Keep using `getServerSideURL()` (`src/utilities/getUrl.ts`) for every
  `serverURL` — don't introduce a new env var or inline the fallback
  expression again.
- `mergeData`, `isLivePreviewEvent`, and `ready` are the only
  `@payloadcms/live-preview` exports this feature imports; `handleMessage`,
  `subscribe`, and `unsubscribe` are the unsafe-for-multi-instance ones this
  feature deliberately avoids.
- If a future fast-follow adds Footer or Settings live preview, it must use
  `useScopedLivePreview` too — mounting a fourth/fifth unscoped hook would
  reintroduce exactly this feature's regression.
