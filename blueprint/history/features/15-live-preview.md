# Current Feature

**Branch:** feature/live-preview
**Status:** verified

## Goal

Give editors a live-updating preview pane for build plan item 15: editing a
Page or Post in the admin panel renders unsaved changes instantly, via
Payload's client-side `useLivePreview` (`@payloadcms/live-preview-react`),
with no save and no drafts/versions required.

## In scope

- `@payloadcms/live-preview-react` as a new dependency.
- Root-level `admin.livePreview` config in `src/payload.config.ts`:
  `collections: ['pages', 'posts']`, three breakpoints, and a `url` resolver.
- A pure `livePreviewPath()` utility mapping a document to its frontend path
  (or `undefined` to disable the button), unit-tested.
- Client-wrapped rendering for `Pages` (`[slug]/page.tsx`) and the
  post-owned portion of `Posts` (`blog/[slug]/page.tsx`), each using
  `useLivePreview` to merge unsaved edits into the existing render tree.
- The Pages document with slug `'blog'` gets its Live Preview button
  disabled (see Out of scope - its actual route uses a different template).
- No visible or behavioral change for real site visitors outside the
  admin's live-preview iframe.

## Out of scope

- **Header/Footer/Settings live preview.** Deliberate fast-follow (recorded
  in `project-plan.md`'s UI/UX section), not this pass. Reason: all three
  globals would share the homepage as their only preview URL, meaning three
  `useLivePreview` hooks would coexist on one page. Confirmed by reading
  `node_modules/@payloadcms/live-preview/dist/handleMessage.js` after
  installing the package: `handleMessage` merges using whatever
  `collectionSlug`/`globalSlug` the *incoming postMessage* carries, with no
  check that it matches the *receiving* hook's own document - editing
  Settings while Header/Footer hooks are also mounted on the same page would
  overwrite their data with Settings' shape. This is a confirmed bug risk,
  not a hypothetical one; the globals fast-follow will need a custom filter
  layered under `subscribe`/`isLivePreviewEvent` rather than the bare
  `useLivePreview` hook, or a way to ensure only one live-previewable
  document is ever mounted per page.
- **Payload drafts/versions/autosave and the server-side `RefreshRouteOnSave`
  pattern.** Neither `Pages` nor `Posts` has `versions` configured today.
  The server-side pattern only reflects saved/draft state, so without
  drafts it would just refresh to the last save, not real typing - a
  materially different, bigger capability (adds `_status`, changes public
  read access control) that wasn't requested.
- **The `/blog` listing page's own Appearance settings**
  (`heroAppearance`/`listAppearance` on the `blog`-slug Pages document).
  That route is rendered by the separate `blog/page.tsx` template, not the
  `[slug]` catch-all this feature wires up. Its Live Preview button is
  disabled (`livePreviewPath` returns `undefined`) rather than left pointing
  at a page that silently won't reflect the edits.
- **Any change to real-visitor data fetching or caching.** The existing
  `unstable_cache`-wrapped queries in both page templates are untouched;
  this feature only adds a client-side rendering path that is a no-op
  outside the admin's iframe.
- **New env vars.** Reuses the existing
  `process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'` fallback
  already used in `layout.tsx`'s `generateMetadata`.
- **Automated browser/e2e coverage.** The core behavior (admin iframe
  `postMessage` merging into a live document) is real-browser,
  real-admin-panel integration behavior whose exact message shape/timing
  isn't something this spec can verify from documentation alone. Per the
  project's testing scope rule, integration-level surfaces like this are
  verified with the build and manual browser evidence, not a test that
  would have to guess at Payload's internal protocol. Manual verification
  is required instead (see Testing).

## Build loop

Per `blueprint/config.json`: `stepReview` is `feature` (one combined review
after all steps below) and `checkpointCommits` is `disabled` (no
intermediate commits; `/complete` makes the one feature commit).

## Build steps

- [x] 1. **Dependency, pure resolver, and Payload config**
  - `npm install @payloadcms/live-preview-react`.
  - Add `src/utilities/livePreviewPath.ts`:
    ```ts
    export function livePreviewPath(
      input:
        | { type: 'collection'; collectionSlug: string; docSlug?: string | null }
        | { type: 'global' },
    ): string | undefined {
      if (input.type === 'global') return '/'
      const { collectionSlug, docSlug } = input
      if (collectionSlug === 'posts') {
        return docSlug ? `/blog/${docSlug}` : undefined
      }
      if (collectionSlug === 'pages') {
        if (!docSlug || docSlug === 'blog') return undefined
        return docSlug === 'home' ? '/' : `/${docSlug}`
      }
      return undefined
    }
    ```
  - Add `tests/int/livePreviewPath.int.spec.ts` covering: pages/`home` ->
    `'/'`, pages/`blog` -> `undefined`, pages/`about` -> `'/about'`,
    pages/no-slug -> `undefined`, posts/`my-post` -> `'/blog/my-post'`,
    posts/no-slug -> `undefined`, `{ type: 'global' }` -> `'/'`.
  - In `src/payload.config.ts`, add root-level `admin.livePreview`:
    `collections: ['pages', 'posts']`, breakpoints (Mobile 375x667, Tablet
    768x1024, Desktop 1440x900), and a `url` function that calls
    `livePreviewPath({ type: 'collection', collectionSlug:
    collectionConfig?.slug ?? '', docSlug: data?.slug })` and prefixes the
    result with `process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'`
    (returning `undefined` unchanged when the resolver does).
  - Done when: `npm run test:int` passes with the new tests, and
    `npm run generate:types`, `npm run lint`, and `npm run build` all pass
    (confirms the config loads without error).

- [x] 2. **Pages: client-wrapped live preview**
  - Add `src/app/(frontend)/[slug]/PageClient.tsx` (`'use client'`):
    calls `useLivePreview<PageType>({ initialData, serverURL:
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000', depth: 2
    })` and renders `<div><Blocks blocks={data.blocks} /></div>` (same
    markup `[slug]/page.tsx` renders today).
  - Update `[slug]/page.tsx`'s default export to render
    `<PageClient initialData={page} />` in place of the inline
    `<div><Blocks .../></div>`. The existing cached fetch
    (`queryPageBySlug`) is unchanged.
  - Done when: `npm run lint` and `npm run build` pass. Manual (needs the
    dev server - ask the user to run it or verify directly): editing a
    Page's blocks in `/admin` and opening Live Preview shows the change
    appear as you type, with no save; a normal browser tab loading the same
    URL outside admin is unaffected.

- [x] 3. **Posts: client-wrapped live preview for the post's own fields**
  - Add `src/app/(frontend)/blog/[slug]/PostClient.tsx` (`'use client'`):
    calls `useLivePreview<Post>({ initialData, serverURL, depth: 2 })` and
    renders the two `Section`s that depend on the post's own fields - the
    header (`Heading` + `PostPreview`, keyed off `title`/`headerAppearance`)
    and the body (`RichText`, keyed off `body`/`bodyAppearance`) - reading
    from the hook's `data` instead of the original `post`.
  - Update `blog/[slug]/page.tsx` to render
    `<PostClient initialData={post} />` in place of those two `Section`
    blocks, leaving `Breadcrumbs`, `PostNavigation`, and the related-posts
    `Section` exactly as they render today (server-rendered, using the
    original `post`/`relatedPosts`/`nextPost`/`prevPost` - they're derived
    from other documents fetched at page load, not the currently-edited
    post, so there's nothing on them to live-update).
  - Done when: `npm run lint` and `npm run build` pass. Manual (dev server):
    editing a Post's title or body in `/admin` and opening Live Preview
    shows those fields update live, while breadcrumbs/navigation/related
    posts stay as originally loaded.

## Files / areas

- `package.json` / lockfile - add `@payloadcms/live-preview-react`
- `src/payload.config.ts` - `admin.livePreview` config
- `src/utilities/livePreviewPath.ts` (new)
- `tests/int/livePreviewPath.int.spec.ts` (new)
- `src/app/(frontend)/[slug]/page.tsx`
- `src/app/(frontend)/[slug]/PageClient.tsx` (new)
- `src/app/(frontend)/blog/[slug]/page.tsx`
- `src/app/(frontend)/blog/[slug]/PostClient.tsx` (new)

## Data / contracts

- `livePreviewPath()` is the single source of truth for every URL Live
  Preview can point at: `{ type: 'global' }` -> `'/'`; `pages`/`home` or no
  slug/`'blog'` slug -> `'/'`/`undefined`/`undefined` respectively; any
  other `pages` slug -> `'/<slug>'`; `posts` with a slug -> `'/blog/<slug>'`,
  without one -> `undefined`. Returning `undefined` disables that
  document's Live Preview button - a documented Payload capability, not an
  error state.
- No Payload schema, collection, or global field changes.
- Security/correctness property that must not regress: the live merge
  happens entirely inside the browser tab the admin's own iframe controls,
  via `window.postMessage`. A normal page load never establishes that
  channel, so there is no path for an unsaved or unpublished edit to reach
  a real visitor.
- `useLivePreview`'s `depth: 2` must match or exceed whatever relationship
  population each page's server fetch already uses, so relationships
  (`featuredImage`, block-embedded media, a post's `author`/`category`)
  don't disappear from the preview after an edit.

## Testing

- Unit (Vitest, `npm run test:int`): `tests/int/livePreviewPath.int.spec.ts`
  covers every branch of `livePreviewPath()`. This is the only pure logic
  the feature introduces.
- No browser/e2e test - see Out of scope for why, and the manual
  verification required in each build step's Done when instead.

## Notes for the AI

- Do not add Payload drafts/versions or `RefreshRouteOnSave` to make this
  "more live" - the server-side pattern was deliberately rejected because it
  needs drafts to reflect unsaved edits, which this repository doesn't have.
  `useLivePreview` (client-side) is the locked mechanism for this feature.
- Do not extend `admin.livePreview.collections`/`globals` to include
  `header`/`footer`/`settings` in this pass - that is an intentional,
  separately-specced fast-follow, not an oversight to "complete."
- Keep the exact `process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'`
  fallback already established in `layout.tsx` - don't introduce a new env
  var for this.
- The `'blog'`-slug Pages document's Live Preview must stay disabled; don't
  "fix" this by pointing its `url` at `/blog` - that route's template isn't
  wired for live preview in this pass.
