# Current Feature

**Branch:** feature/blog-listing-content-blocks
**Status:** verified

## Goal

Extend build plan item 18: replace `/blog`'s hardcoded hero/listing template
(`src/app/(frontend)/blog/page.tsx`) with two dedicated, blog-only block
types — **Featured Post** and **Blog Listing** — so an editor can add,
reorder, or omit them on the existing `blog`-slug Pages document, the same
way blocks work on every other page, instead of the current fixed structure
that only exposes `heroAppearance`/`listAppearance` (visual styling knobs,
not content).

**Why not the shared `blocks` field/registry:** `Pages.blocks` is the same
field every regular page uses, and every regular page has Live Preview
(features 16/17's `useScopedLivePreview`) — editing any field re-renders
that page's entire `<Blocks>` tree client-side. Every existing registered
block (Hero, FeatureGrid, CallToAction, RichTextBlock, Table) is a plain,
synchronous, prop-driven component with no data-fetching, which is what
makes that client-side re-render safe. A Blog Listing block needs
`/blog`'s own page-level pagination and category-filter results. Putting it
in the shared registry would (a) make it uselessly embeddable inside a
Post's rich-text body and any other page (`Posts.body`'s `BlocksFeature`
and every Page's `blocks` field both derive from the same
`src/blocks/registry.ts` slugs), and (b) require it to fetch client-side
instead, meaning the post listing — arguably the blog's most important
content — would no longer be in the initial server-rendered HTML (a loading
flicker for visitors, nothing for search engines or no-JS clients). This was
confirmed against the actual registry (`src/blocks/registry.ts`,
`src/blocks/index.tsx`'s `Blocks` dispatcher, and `Posts/config.ts`'s
`BlocksFeature({ blocks: blockSlugs })`) and against `PageClient.tsx`'s live
re-render, not assumed.

The resolved design avoids all of that: the two new blocks live on a
**separate, inline-configured** `blogBlocks` field (not registered in
`src/blocks/registry.ts`, not touched by `Posts`' rich text, not reachable
from any other page), and — matching how every other registered block
already works — they are **prop-driven, not self-fetching**: `blog/page.tsx`
keeps its existing query functions exactly as they are today and passes the
results down as props. This sidesteps the async/self-fetch-vs-client-render
conflict entirely rather than working around it, and it's simpler.

## In scope

- `src/collections/Pages/config.ts`: a new `blogBlocks` field (`type:
  'blocks'`, inline `blocks: [FeaturedPost, BlogListing]`, no
  `blockReferences`) inside the existing conditional tab currently labeled
  "Appearance" (`condition: (data) => data?.slug === 'blog'`), which is
  relabeled **"Blog Content"** since it no longer holds only appearance
  fields. The existing `heroAppearance`/`listAppearance` group fields are
  removed from that tab — their surface/spacing/width controls now live on
  each new block's own `appearanceField()`, matching every other registered
  block.
- Two new block configs + components, colocated the same way the shared
  registry already does (`config.ts` + `Component.tsx` per block), under
  `src/collections/Pages/blogBlocks/`:
  - **`FeaturedPost`** (slug `featuredPost`) — fields: only
    `appearanceField()`. No other editor-configurable fields: the
    "Featured post"/"Latest post" label and which post it shows stay exactly
    as today (see Data/contracts) — not a product ask to make configurable.
  - **`BlogListing`** (slug `blogListing`) — fields: `appearanceField()` plus
    an optional `heading` text field, `defaultValue: 'More Posts'` (matching
    the same optional-heading pattern `FeatureGrid`/`CallToAction` already
    use).
- `src/app/(frontend)/blog/page.tsx`: `queryBlogPage()`'s `select` swaps
  `heroAppearance`/`listAppearance` for `blogBlocks`. The hardcoded hero
  `Section` and listing `Section` JSX is replaced with a small inline loop
  over `page.blogBlocks` dispatching by `blockType` to the two new
  components, passing each the exact same data the current JSX already
  computes (`heroPost`, `featuredBlog`, `categories`, `blogs`, `currentPage`,
  `categoryParam`, `currentSearchParams`) — no query logic changes.
- `npm run generate:types` for the schema change.
- The Data note below (a required manual admin step, not a migration).

## Out of scope

- **Registering these blocks in `src/blocks/registry.ts`.** Deliberately
  not part of the shared `blockConfigs`/`blockComponents`/`blockSlugs`
  "hard lock" — see Goal. Nothing about the shared registry, `Blocks`
  dispatcher, `HeaderClient`/`PageClient`/`PostClient`, or
  `useScopedLivePreview` changes in this feature.
- **Live Preview for `/blog`.** Still disabled (`livePreviewPath` already
  returns `undefined` for the `blog`-slug Page, unchanged) — unaffected by
  this feature either way.
- **Making the featured/latest-post selection or the non-featured exclusion
  configurable, or "fixing" the existing latest-post fallback's coupling to
  the active category filter.** All preserved exactly as today — see
  Data/contracts.
- **A data migration or auto-seeding of the new blocks onto the existing
  `blog` Page document.** This project has no migration tooling (same call
  made for the Site Icon fix). See the Data note.
- **Any change to `Card`, `CardContainer`, `PostPreview`, `CategoryFilter`,
  or `Pagination`.** Their JSX/props move into the new block components
  unchanged.
- **Automated browser/e2e coverage.** Same testing-scope reasoning as every
  other feature in this project — manual verification instead (see
  Testing).

## Build loop

Per `blueprint/config.json`: `stepReview` is `feature` (one combined review
after all steps below) and `checkpointCommits` is `disabled` (no
intermediate commits; `/complete` makes the one feature commit).

## Build steps

- [x] 1. **Add `blogBlocks` and the two new block configs (additive)**
  - In `src/collections/Pages/config.ts`, add
    `src/collections/Pages/blogBlocks/FeaturedPost/config.ts` (slug
    `featuredPost`, fields: `...appearanceField()`) and
    `.../BlogListing/config.ts` (slug `blogListing`, fields:
    `...appearanceField()` + `{ name: 'heading', type: 'text', defaultValue:
    'More Posts' }`). Add the `blogBlocks` field (`type: 'blocks'`, `blocks:
    [FeaturedPost, BlogListing]`) to the existing conditional tab. Do **not**
    remove `heroAppearance`/`listAppearance` yet — this step is additive
    only, so the app keeps working unchanged.
  - Run `npm run generate:types`.
  - Done when: `npm run lint` and `npm run build` pass; manual (dev
    server): opening the `blog` Page in `/admin` shows "Featured Post" and
    "Blog Listing" as addable block options in that tab.

- [x] 2. **New block components (not yet wired into the page)**
  - Add `src/collections/Pages/blogBlocks/FeaturedPost/Component.tsx`:
    props = its own `FeaturedPostBlock` fields (from regenerated types) plus
    `heroPost: Post | null | undefined` and `featuredBlog: Post | null`.
    Renders the current hero sub-block exactly (`Heading` "Featured post"/
    "Latest post" + `PostPreview`), wrapped in `Section`/`Container` using
    its own `surface`/`spacing`/`width`; returns `null` when there's no
    `heroPost` (mirrors today's `isDoc<Post>(heroPost) &&` guard).
  - Add `src/collections/Pages/blogBlocks/BlogListing/Component.tsx`: props
    = its own `BlogListingBlock` fields plus `categories:
    PaginatedDocs<Category>`, `blogs: PaginatedDocs<Post>`, `currentPage:
    number`, `categoryParam: string | undefined`, `searchParams:
    SearchParamsProps`. Renders the current listing JSX exactly (`heading`
    field instead of the hardcoded "More Posts" string,
    `CategoryFilter`, `CardContainer`/`Card` over `blogs.docs.filter((post)
    => !post.featured)`, `Pagination`), wrapped in its own
    `Section`/`Container`; returns `null` when `blogs.docs.length === 0`
    (the *unfiltered* count — mirrors today's exact gate).
  - Done when: `npm run lint` and `npm run build` pass (components compile;
    not yet referenced by `blog/page.tsx`).

- [x] 3. **Wire `blog/page.tsx` to render `blogBlocks`**
  - Update `queryBlogPage()`'s `select` to include `blogBlocks` instead of
    `heroAppearance`/`listAppearance`.
  - Replace the two hardcoded `Section`s with:
    ```tsx
    {page.blogBlocks?.map((block) => {
      if (block.blockType === 'featuredPost') {
        return <FeaturedPost key={block.id} {...block} heroPost={heroPost} featuredBlog={featuredBlog} />
      }
      if (block.blockType === 'blogListing') {
        return (
          <BlogListing
            key={block.id}
            {...block}
            categories={categories}
            blogs={blogs}
            currentPage={currentPage}
            categoryParam={categoryParam}
            searchParams={currentSearchParams}
          />
        )
      }
      return null
    })}
    ```
    Keep every existing query call and the `heroPost = featuredBlog ??
    blogs.docs[0]` computation exactly as-is. Remove the now-unused
    `Section`/`Container`/`Heading`/`Stack`/`CategoryFilter`/`Pagination`/
    `Card`/`CardContainer`/`PostPreview` imports from `blog/page.tsx` (they
    move to the block components); `generateMetadata()` is unaffected.
  - Done when: `npm run lint`, `npm run test:int`, and `npm run build` all
    pass. Manual (dev server, after completing the Data note below):
    `/blog` renders identically to before — featured/latest post, category
    filter, paginated grid, pagination controls all present and working,
    including with a `?category=` and `?page=` URL param.

- [x] 4. **Remove the old appearance fields and relabel the tab**
  - In `src/collections/Pages/config.ts`, delete the `heroAppearance` and
    `listAppearance` fields; relabel that tab from "Appearance" to "Blog
    Content" (condition unchanged).
  - Run `npm run generate:types`.
  - Done when: `npm run lint` and `npm run build` pass; manual: the `blog`
    Page's edit view no longer shows the old appearance fields, and the tab
    reads "Blog Content".

- [x] 5. **Fix: also render the generic Layout `blocks` field on `/blog`
  (gap found by manual testing)**
  - Manual testing found that `/blog` never rendered the shared `blocks`
    field (Layout tab) at all — not a regression this feature introduced
    (it never rendered there before either, which is the exact "why isn't
    /blog editable" gap that motivated this feature), but this feature's
    own `blogBlocks` admin description ("Add a Hero block (Layout tab)
    above them for a heading") and the Data/contracts section both promised
    it would now work, and step 3 never actually wired it up.
  - In `blog/page.tsx`'s `queryBlogPage()`, add `blocks: true` to the
    `select` alongside `title`/`meta`/`featuredImage`/`blogBlocks`.
  - Import `Blocks` from `@/blocks` (the same shared dispatcher
    `PageClient.tsx` already uses) and render `<Blocks blocks={page.blocks}
    />` immediately before the `page.blogBlocks?.map(...)` loop, so a Hero
    (or any other generic block) sits above Featured Post/Blog Listing.
    `/blog` is never wrapped in a client component, so this shared,
    synchronous dispatcher is safe here with no Live Preview interaction.
  - Done when: `npm run lint`, `npm run test:int`, and `npm run build` all
    pass. Manual (dev server): adding a Hero block to the `blog` Page's
    existing Layout tab now renders it on `/blog`, above the Featured
    Post/Blog Listing content.

- [x] 6. **Fix: Hero block's image doesn't render on `/blog` (gap found by
  manual testing)**
  - Manual testing of step 5 found the Hero block's headline/subheading
    render but its image doesn't. Cause: `queryBlogPage()`'s `populate.media`
    only requests `sizes: { og: true }` — written before step 5 needed it
    for anything beyond the Page's own `featuredImage` (social-share meta).
    Without `url`/`width`/`height`/etc. populated, `Hero`'s `isDoc<Media>(image)
    && image.url` check fails silently; `heading`/`subheading` are plain
    text on the block itself, unaffected by populate.
  - In `blog/page.tsx`'s `queryBlogPage()`, expand `populate.media` to match
    `[slug]/page.tsx`'s proven-working shape exactly: `{ filename: true,
    width: true, height: true, url: true, alt: true, blurDataUrl: true,
    sizes: { fullSize: true, card: true, og: true } }`. This is the general
    shape needed for any block's image (Hero, FeatureGrid), not
    Hero-specific, since `/blog`'s Layout tab can hold any registered block.
  - Done when: `npm run lint`, `npm run test:int`, and `npm run build` all
    pass. Manual (dev server): a Hero block's image renders on `/blog`.

## Files / areas

- `src/collections/Pages/config.ts`
- `src/collections/Pages/blogBlocks/FeaturedPost/config.ts` (new)
- `src/collections/Pages/blogBlocks/FeaturedPost/Component.tsx` (new)
- `src/collections/Pages/blogBlocks/BlogListing/config.ts` (new)
- `src/collections/Pages/blogBlocks/BlogListing/Component.tsx` (new)
- `src/app/(frontend)/blog/page.tsx`
- `src/payload-types.ts` (regenerated)

## Data / contracts

- `blogBlocks` is inline-configured on `Pages` only — never added to
  `src/blocks/registry.ts`'s `blockConfigs`, so it never reaches
  `Posts.body`'s `BlocksFeature` or any other page's `blocks` field.
- `FeaturedPost`/`BlogListing` are prop-driven, matching every shared
  block's pattern — no Local API calls or `unstable_cache` wrapping inside
  the components themselves; `blog/page.tsx`'s existing `queryBlogPage`,
  `queryAllCategories`, `queryFeaturedBlog`, `queryBlogs` functions and
  their `'blog'`/`'blog-page'`/`'blog-categories'` cache tags are unchanged.
- Preserved behavior, unchanged by this feature:
  - "Latest post" fallback (`featuredBlog ?? blogs.docs[0]`) stays coupled
    to the currently active category filter, exactly as today — not
    decoupled as a side effect of this refactor.
  - The listing section's visibility is gated on the *unfiltered*
    `blogs.docs.length`, not the count after excluding `featured: true`
    posts — exactly as today.
  - `featured: true` posts are always excluded from the Blog Listing grid,
    independent of whether a Featured Post block is present on the page.
  - SEO/meta generation (`generateMeta({ doc: page, settings })`) is
    unaffected — `title`/`meta`/`featuredImage` fields are untouched.
- Changed contract: `/blog`'s visible H1 (`page.title`) is no longer
  automatically rendered — this matches how every other Page already
  behaves (`PageClient` never auto-renders `title` either; it's purely
  block content). An editor who wants a heading adds a Hero block from the
  existing "Layout" tab, same as any other page.

**Data note (not a migration, but required before `/blog` looks right
again):** the existing `blog`-slug Pages document has no `blogBlocks` set —
it's a new field, defaults to empty. After this ships, `/blog` renders
**blank** until an editor adds a Featured Post block and a Blog Listing
block (and, if a heading is wanted, a Hero block) to that document in
`/admin`, and reconfigures their appearance — the old
`heroAppearance`/`listAppearance` values do not carry over, matching the
same "no migration tooling in this project" reasoning as the Site Icon fix,
but with a more visible consequence (a blank page, not a missing favicon)
until that manual step happens.

## Testing

- No new pure logic: the query functions and their `where`/`sort`/`select`
  clauses are unchanged, just fed into new components instead of inline
  JSX. Neither new block component has logic beyond what `FeatureGrid`/
  `CallToAction` already have untested (no unit-test precedent for that
  category of component in this project).
- No browser/e2e test — manual verification in step 3's Done when instead.

## Notes for the AI

- Do not add `FeaturedPost`/`BlogListing` to `src/blocks/registry.ts`. That
  file is described in the project overview as a hard lock precisely
  because every consumer (every Page's `blocks` field, every Post's
  rich-text body) shares it — these two blocks are deliberately local to
  `Pages.blogBlocks` only.
- Do not make `FeaturedPost`/`BlogListing` self-fetching (no `payload.find`/
  Local API calls inside the components). `blog/page.tsx` already computes
  everything they need; keep them as plain prop-driven components.
- Do not "fix" the latest-post fallback's coupling to the active category
  filter, or change the unfiltered-count visibility gate — both are
  existing behavior this feature must preserve, not correct.
- Remind the user (in the final handoff, not silently) that `/blog` will
  render blank until the manual admin step in the Data note is done.
