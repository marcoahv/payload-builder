# Current Feature

**From build-plan:** feature 10c
**Status:** verified
**Branch:** feature/blog-post-detail-page

## Goal

Add the blog post detail page (`/blog/[slug]`) so a published post is
reachable and readable on the frontend, porting `Breadcrumbs` and
`PostNavigation` off `src/_legacy/` onto the current primitives/Tailwind
system, then retiring `src/_legacy/` for good.

## In scope

- `Breadcrumbs` component, ported to Tailwind semantic tokens.
- `PostNavigation` component (prev/next post links), ported to Tailwind.
- `src/app/(frontend)/blog/[slug]/page.tsx`: static params, metadata, and the
  post detail view (breadcrumbs, header, body, prev/next nav, related posts).
- Deleting `src/_legacy/` once the route and both ported components are in
  place.

## Out of scope

- Feature 11 (portable branding token system).
- Comments, reactions, reading time, or any post-detail feature not already
  implied by the legacy page.
- Changing the `Posts`/`Categories` schema or their existing revalidation
  hooks (`src/collections/Posts/hooks/revalidatePost.ts`,
  `src/collections/Categories/hooks/revalidateCategories.ts` already tag
  `'blog'` and revalidate `/blog/[slug]`; no new hook is needed).
- A new `CardContainer` variant. The legacy page rendered related posts with a
  `variant={'compact'}` that no longer exists on the current `CardContainer`
  (`src/components/CardContainer.tsx`, only `'default'` is defined) - reuse
  `'default'` rather than inventing a new preset.

## Build loop

One review packet after all steps below (`workflow.stepReview: "feature"`),
no per-step checkpoint commits (`workflow.checkpointCommits: "disabled"`).
Implement steps 1-4 in order, keeping the project buildable after each, then
stop for review before `/complete`.

## Build steps

- [x] 1. **Port `Breadcrumbs`** - add `src/components/Breadcrumbs.tsx` (flat
  file, matching `Card.tsx`/`PostPreview.tsx`), keeping the legacy contract
  (`items: { label: string; href?: string }[]`, BreadcrumbList JSON-LD via
  `getServerSideURL()`, `nav[aria-label="Breadcrumb"]`, current item marked
  `aria-current="page"`) but rendering through the `Container` primitive and
  Tailwind semantic classes instead of the CSS module. Add
  `src/app/(frontend)/styles/components/_breadcrumbs.css`
  (`@layer components`, BEM classes `breadcrumbs`/`breadcrumbs__list`/
  `breadcrumbs__item`/`breadcrumbs__link`/`breadcrumbs__current`/
  `breadcrumbs__separator`, semantic tokens only) and import it in
  `src/app/(frontend)/styles/index.css` next to the other `components/`
  imports.
  **Done when:** `npm run build` typechecks with the new file, unused
  nowhere yet.

- [x] 2. **Port `PostNavigation`** - add `src/components/PostNavigation.tsx`
  keeping the legacy contract (`prevPost`/`nextPost`: `{ slug: string; title:
  string } | null`, renders `null` when both are absent, `lucide-react`
  `ChevronLeft`/`ChevronRight` icons, `aria-label` per link). Add
  `src/app/(frontend)/styles/components/_post-navigation.css` and import it
  in `index.css`.
  **Done when:** `npm run build` typechecks.

- [x] 3. **Build the blog post detail route** -
  `src/app/(frontend)/blog/[slug]/page.tsx`:
  - `generateStaticParams`: all `posts` slugs (mirror
    `src/app/(frontend)/[slug]/page.tsx`'s pattern, `@/payload.config` +
    `getPayload`).
  - `generateMetadata`: look up the post by slug, `{ title: 'Post not
    found' }` when missing, otherwise `generateArticleMeta({ post, settings
    })` (`src/utilities/generateArticleMeta.ts`, unchanged) using
    `getCachedGlobal('settings')()`.
  - Cached data functions, each `unstable_cache`-wrapped and tagged
    `['blog']` (mirrors `src/app/(frontend)/blog/page.tsx`'s
    `queryFeaturedBlog`/`queryBlogs`, populate `categories: { name, slug }`
    and `media: { sizes: { fullSize/card }, height, width, blurDataUrl, url,
    filename }`, `select: { createdAt: false, updatedAt: false,
    generateSlug: false }`):
    - `queryPost({ slug })` -> `Post | null`.
    - `queryRelatedPosts({ post })` -> up to 4 posts sharing `post.category`,
      excluding the current post by slug.
    - `queryPreviousPost` / `queryNextPost` -> nearest post by `date`, tying
      on `createdAt` (port the legacy `or`/`and` comparison exactly), sorted
      opposite directions, `select: { slug: true, title: true }`.
    - When building the `category` equality filter for related/prev/next
      lookups, resolve the id first (`isDoc<Category>(post.category) ?
      post.category.id : post.category`) rather than passing the populated
      object straight into `where.category.equals` - the legacy version did
      the latter, which does not match a relationship id.
  - Page body: `notFound()` when `queryPost` returns null; otherwise
    `Breadcrumbs` (`Home` -> `/`, `Blog` -> `/blog`, post title, no href) ->
    `Section`+`Container` with `Heading level={1}` (post title) and
    `PostPreview` (`variant="header"`, `showLink={false}`,
    `imageSize="fullSize"`) -> `Section`+`Container width="narrow"` wrapping
    `<div className="ui-prose"><RichText data={post.body} /></div>` (mirrors
    `src/blocks/RichTextBlock/Component.tsx`) -> `PostNavigation` -> when
    `relatedPosts.docs.length > 0`, a `Section` with `Heading` "Related
    Posts" and `CardContainer` of `Card` (default variant).
  **Done when:** visiting `/blog/<an-existing-post-slug>` on the dev server
  renders breadcrumbs, the post header/body, prev/next links when
  applicable, and related posts when same-category posts exist; `npm run
  build` succeeds.

- [x] 4. **Retire `src/_legacy/`** - delete the directory now that
  `Breadcrumbs`, `PostNavigation`, and `/blog/[slug]` all have live
  replacements (joining `Card`, `CardContainer`, `Pagination`,
  `PostPreview`, `CategoryFilter`, `Footer`, and `/blog` from 10a/10b).
  **Done when:** `src/_legacy/` no longer exists and `npm run build`
  succeeds without it.

## Files / areas

- `src/components/Breadcrumbs.tsx` (new)
- `src/components/PostNavigation.tsx` (new)
- `src/app/(frontend)/styles/components/_breadcrumbs.css` (new)
- `src/app/(frontend)/styles/components/_post-navigation.css` (new)
- `src/app/(frontend)/styles/index.css` (two new `@import` lines)
- `src/app/(frontend)/blog/[slug]/page.tsx` (new)
- `src/_legacy/` (deleted in step 4)

Reused unchanged: `src/components/{Card,CardContainer,PostPreview,MediaImage,RichText}`,
`src/components/primitives/{Section,Container,Heading}`,
`src/utilities/{isDoc,getPayloadClient,getGlobals,generateArticleMeta,getUrl}`,
`src/collections/Posts/hooks/revalidatePost.ts`,
`src/collections/Categories/hooks/revalidateCategories.ts`.

## Data / contracts

- `Breadcrumbs` props: `{ items: { label: string; href?: string }[] }`. Last
  item with no `href` renders as the current page (`aria-current="page"`,
  no link).
- `PostNavigation` props: `{ prevPost: { slug: string; title: string } |
  null; nextPost: same | null }`. Renders `null` when both are `null`.
- Route `/blog/[slug]`: static-generated for every `posts` slug, revalidated
  by the existing `blog` cache tag (no new tag or hook).
- `queryRelatedPosts`/`queryNextPost`/`queryPreviousPost` all key off the
  post's resolved category id, not the populated category object.

## Testing

No new pure/deterministic logic is introduced - the cached query functions
are data-fetching wrappers around `payload.find`, the same category this
codebase already treats as integration-level and leaves untested (`blog/
page.tsx`'s `queryFeaturedBlog`/`queryBlogs` have no unit tests either).
`Breadcrumbs` and `PostNavigation` are presentational. The existing suite
(`npm run test:int`) must stay green; no new test file is added by this
spec. Verify manually: load `/blog/<slug>` for a post that has a category
match (to see related posts) and one that doesn't (to confirm the section is
omitted), and a post at each end of the `date` ordering (to confirm
prev/next links appear/disappear correctly), plus `generateMetadata`'s
title/OG output via view-source or the Next.js metadata debug output.

## Notes for the AI

- Match `src/app/(frontend)/[slug]/page.tsx`'s import style
  (`import config from '@/payload.config'` + `getPayload`) for
  `generateStaticParams`, and `getPayloadClient()` everywhere else, exactly
  as `blog/page.tsx` already does.
- `_post-preview.css`'s existing comment already anticipates the `header`
  variant being used "on the post detail page's own header block" - no CSS
  changes needed there.
- Don't touch `blog/page.tsx`'s own `populate: { categories: ... }` calls;
  they're correct as-is (Payload's `populate` keys are by target collection
  slug, `categories`, not by the local field name `category`) - just reuse
  the same shape in the new file.
- No `overrideAccess`/`user` concerns: every read here is an unauthenticated
  public frontend fetch, matching `blog/page.tsx` and `[slug]/page.tsx`.
