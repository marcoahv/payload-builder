# Current Feature

**Status:** verified

**Branch:** feature/blog-page-live-preview

## Goal

Extend the client-side live preview shipped in feature 15 (Pages/Posts) and
extended in features 16-17 (Header/Footer) to the `/blog` listing page's own
`Pages` document (`slug: 'blog'`). Today `src/utilities/livePreviewPath.ts`
deliberately disables the Live Preview button for that document because
`/blog` is rendered by a separate template (`src/app/(frontend)/blog/page.tsx`)
that was never wired into `useScopedLivePreview`. This feature turns the
button on and makes that page's own editable fields (`blocks`, `blogBlocks`)
merge live edits the same way `[slug]` and post pages already do.

## In scope

- Enable the Live Preview URL for the `pages` collection when `docSlug ===
  'blog'`, pointing at `/blog`.
- Make `/blog`'s rendering of `page.blocks` (the shared page-builder blocks)
  and `page.blogBlocks` (Featured Post / Blog Listing) reactive to unsaved
  admin edits, via the existing `useScopedLivePreview` hook.

## Out of scope

- Reactivity for the Post/Category data those blocks render (`heroPost`,
  `featuredBlog`, `categories`, the paginated `blogs` list, pagination and
  category-filter state). These come from separate `posts`/`categories`
  queries computed at page load, not from the `blog` Pages document's own
  fields, so there is nothing in the live-preview `postMessage` payload to
  merge them from - the same deliberate limit as Post's related-posts/
  breadcrumbs (feature 15) and Footer's borrowed logo/site-name (feature 17).
- Any change to `[slug]/page.tsx`'s `generateStaticParams` exclusion of
  `slug: 'blog'` - that guard prevents a routing collision between `/[slug]`
  and `/blog` and is unrelated to live preview.
- Live preview for `Settings`, or any change to Header/Footer live preview.
- Reactivity for the blog page's SEO/`meta` fields - `[slug]`'s `PageClient`
  doesn't make `meta` reactive either, so `/blog` stays consistent with that
  existing scope limit.

## Build loop

Two small steps below, each leaving the app working. Per
`blueprint/config.json` (`workflow.stepReview: "feature"`,
`workflow.checkpointCommits: "disabled"`), implement both steps in sequence
without pausing for per-step approval or creating checkpoint commits; stop
for one review after both are done.

## Build steps

- [x] 1. Enable the `/blog` live-preview URL and update its test.
  - In `src/utilities/livePreviewPath.ts`, in the `pages` branch, return
    `/blog` when `docSlug === 'blog'` instead of `undefined`. Update the
    function's doc comment (it currently documents the exclusion this step
    removes).
  - In `tests/int/livePreviewPath.int.spec.ts`, change the "disables the
    blog-slug page (separate template)" case to assert
    `livePreviewPath({ type: 'collection', collectionSlug: 'pages', docSlug:
    'blog' })` now resolves to `/blog`, and rename it to match.
  - Done when: `npm run test:int` passes with the updated assertion.

- [x] 2. Wire `/blog`'s own fields into `useScopedLivePreview`.
  - Add `src/app/(frontend)/blog/BlogPageClient.tsx`: a `'use client'`
    component mirroring the `useScopedLivePreview` usage in
    `src/app/(frontend)/[slug]/PageClient.tsx` and
    `src/app/(frontend)/blog/[slug]/PostClient.tsx` (`target: { type:
    'collection', collectionSlug: 'pages' }`, `depth: 2`, `serverURL:
    getServerSideURL()`). It takes `initialData: PageType` plus the page's
    server-computed collaborators as separate, non-reactive props
    (`categories`, `heroPost`, `featuredBlog`, `blogs`, `currentPage`,
    `categoryParam`, `searchParams`), and renders exactly what
    `blog/page.tsx` renders today: `<Blocks blocks={data.blocks} />` followed
    by `data.blogBlocks?.map(...)` dispatching `featuredPost`/`blogListing`
    entries to the existing `FeaturedPost`/`BlogListing` components with
    those collaborator props spread in.
  - In `src/app/(frontend)/blog/page.tsx`, replace the inline `<Blocks
    blocks={page.blocks} />` + `page.blogBlocks?.map(...)` JSX in the default
    export with `<BlogPageClient initialData={page} categories={categories}
    heroPost={heroPost} featuredBlog={featuredBlog} blogs={blogs}
    currentPage={currentPage} categoryParam={categoryParam}
    searchParams={currentSearchParams} />`. Leave every query/caching
    function (`queryBlogPage`, `queryAllCategories`, `queryFeaturedBlog`,
    `queryBlogs`) and `generateMetadata` untouched.
  - Done when: `npm run lint` and `npm run build` pass, and manually opening
    the Payload admin's Live Preview panel on the Pages document with slug
    `blog` shows the `/blog` route rendering (not disabled), where editing a
    block's appearance or the Blog Listing block's `heading` field updates
    the preview without saving.

## Files / areas

- `src/utilities/livePreviewPath.ts` - enable the `/blog` URL
- `tests/int/livePreviewPath.int.spec.ts` - update the now-stale assertion
- `src/app/(frontend)/blog/BlogPageClient.tsx` - new, the reactive client half
- `src/app/(frontend)/blog/page.tsx` - delegate rendering to `BlogPageClient`

## Data / contracts

- `livePreviewPath({ type: 'collection', collectionSlug: 'pages', docSlug:
  'blog' })` changes from `undefined` to `'/blog'`. No other input/output
  pairs change.
- `BlogPageClient` props: `initialData: PageType`, `categories:
  PaginatedDocs<Category>`, `heroPost: Post | null | undefined`,
  `featuredBlog: Post | null`, `blogs: PaginatedDocs<Post>`, `currentPage:
  number`, `categoryParam?: string`, `searchParams: SearchParamsProps` (same
  shapes `blog/page.tsx` already computes and passes to `FeaturedPost`/
  `BlogListing` today - this step only moves where they're consumed).
- Reactive via live preview: `data.blocks` (shared page-builder blocks) and
  `data.blogBlocks` (Featured Post/Blog Listing appearance fields plus Blog
  Listing's `heading`).
- Not reactive (server-computed props, unchanged by the live-preview merge):
  `categories`, `heroPost`, `featuredBlog`, `blogs`, `currentPage`,
  `categoryParam`, `searchParams`.

## Testing

- Update the existing Vitest case in `tests/int/livePreviewPath.int.spec.ts`
  per step 1 - run via `npm run test:int`.
- No new browser-test coverage: the one existing Playwright spec
  (`tests/e2e/theme-toggle.spec.ts`) doesn't touch live preview, and driving
  the admin's live-preview iframe/`postMessage` handshake from Playwright
  would be disproportionate for this change - features 15-17 didn't add
  browser coverage for live preview either. Verify the reactive behavior
  manually (`/check` or `/try`) against the running admin panel.

## Notes for the AI

- Follow `PageClient.tsx`/`PostClient.tsx` exactly for the `useScopedLivePreview`
  call shape (same `depth: 2`, same `getServerSideURL()` serverURL) - don't
  introduce a different depth or a new merge strategy.
- `FeaturedPost` and `BlogListing` (in
  `src/collections/Pages/blogBlocks/*/Component.tsx`) are already
  prop-driven, not self-fetching (see their own header comments) - reuse them
  unchanged, just move the call site into `BlogPageClient`.
- Header's own live-preview hook (global `header`) already coexists with a
  page-level hook on every route via the root layout (that's the whole reason
  `useScopedLivePreview` filters by slug) - `/blog` mounting a `pages`-scoped
  hook alongside Header's `header`-scoped hook needs no new guarding, same as
  `[slug]` and post pages today.
- Don't touch `[slug]/page.tsx`'s `generateStaticParams` `not_equals: 'blog'`
  filter - removing it would make `/[slug]` and `/blog` both try to own the
  same route.
