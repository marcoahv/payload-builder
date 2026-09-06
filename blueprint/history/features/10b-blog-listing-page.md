# Current Feature

**From build-plan:** feature 10b
**Status:** verified
**Branch:** `feature/blog-listing-page`

## Goal

Build the `/blog` listing page (build-plan item 10b): a featured/latest post
banner, a category filter, a paginated grid of the rest, all driven by the
`Posts`/`Categories` collections that already exist and work. The route
itself is new; most of the rendering logic already exists, quarantined in
`src/_legacy/`, and ports over largely intact — the real work is the missing
`CardContainer` grid wrapper (deleted, never rebuilt — `src/_legacy/README.md`
itself flags `Card` as having "imported the deleted `CardContainer`"), fixing
one real bug in `CategoryFilter`, and correcting the caching so the page
actually invalidates when its data changes.

**Caching, verified against the current hooks, not assumed:**
- `Posts`' existing `afterChange`/`afterDelete` hooks
  (`src/collections/Posts/hooks/revalidatePost.ts`) already call
  `revalidateTag('blog', 'max')` — tagging this page's post-driven queries
  `blog` needs no hook changes.
- The page's own title/SEO come from a `Pages` document with slug `blog`
  (same pattern the legacy code used, and `src/app/(frontend)/[slug]/page.tsx`
  already reserves this slug for it via
  `where: { slug: { not_equals: 'blog' } }` in its own
  `generateStaticParams`). Tagging that lookup `page_blog` needs no hook
  changes either — `Pages`' existing hook already calls
  `revalidateTag(`page_${doc.slug}`)` for every page, `blog` included.
- `Categories` has **no hooks at all** right now, and the legacy category
  query had no cache tag to begin with — editing a category would never
  invalidate this page. Step 4 fixes that by adding the same
  `revalidateTag('blog', 'max')` call `Posts` already uses, since categories
  only feed this one cached view today.

## In scope

- `CardContainer` (new) — the missing grid wrapper. Only the `'default'`
  variant is defined now; the legacy code also has a `'compact'` variant,
  but nothing in 10b uses it — 10c adds it to the `CardVariant` union
  (a one-line change) when the detail page actually needs it, rather than
  this feature carrying scope only a later one requires.
- `Card`, `PostPreview`, `Pagination`, `CategoryFilter` — ported from
  `src/_legacy/components/`, updated for the current primitives and one real
  bug fixed in `CategoryFilter` (see Step 3).
- A `revalidateCategories` hook on the `Categories` collection.
- `src/app/(frontend)/blog/page.tsx` — the listing route itself, with
  correctly tagged caching (see Goal).
- CSS for all of the above on the existing token system.
- The first Vitest test in the project, for `Pagination`'s pure `buildHref`
  logic (see Step 3 and Testing).

## Out of scope

- The blog post detail page (`/blog/[slug]`) and its components
  (`Breadcrumbs`, `PostNavigation`) — that's 10c, which depends on this
  landing first.
- Deleting `src/_legacy/` — happens once 10c lands.
- Any change to `Posts`' or `Pages`' existing hooks — both already tag
  correctly for this page; only `Categories` needs a new hook.
- Any new Payload field, global, or collection beyond the `Categories` hook
  addition above.
- Creating the `blog`-slug `Pages` document itself — that's admin content
  entry, not code (see Notes for the AI).

## Build loop

Per `blueprint/config.json`: `workflow.stepReview` is `"feature"` and
`workflow.checkpointCommits` is `"disabled"` — implement all steps below,
then present one review packet with the full diff and done-when evidence.
No per-step approval pause or checkpoint commit.

## Build steps

- [x] **Step 1 — `CardContainer` + `Card`**
  Create `src/components/CardContainer.tsx`: exports `CardVariant =
  'default'` (a union of one today — 10c extends it) and a component
  rendering `children` in a responsive grid (`className="card-container
  card-container--{variant}"`, default `variant = 'default'`). Create
  `src/components/Card.tsx`, ported
  from `src/_legacy/components/Card/index.tsx`: same `Pick<Post, 'id' |
  'slug' | 'featuredImage' | 'title' | 'populatedAuthor' | 'date' |
  'date_tz' | 'category'>` props plus `variant?: CardVariant` and
  `className?`, same category-badge-only-on-default-variant and
  author/date-meta logic, `MediaImage` for the image (`size="card"`). Replace
  the legacy `Header as={'h3'} align={'left'}` (the old generic-heading
  component, now `Heading`) with `<Heading level={3}>` from
  `@/components/primitives` — `Heading` has no `align` prop, and none is
  needed here (default block flow is already left-aligned).
  **Done when:** `npm run build` succeeds. (Nothing renders these yet —
  wired in Step 5.)

- [x] **Step 2 — `PostPreview`**
  Create `src/components/PostPreview.tsx`, ported from
  `src/_legacy/components/PostPreview/index.tsx` unchanged in behavior:
  `variant?: 'featured' | 'header'`, `showLink?`, `imageSize?`, same
  `Heading` swap as Step 1 for the `variant === 'featured'` case (the
  `'header'` variant renders no heading of its own either way).
  **Done when:** `npm run build` succeeds.

- [x] **Step 3 — `Pagination` + `CategoryFilter`**
  Create `src/components/Pagination.tsx`, ported from
  `src/_legacy/components/Pagination/index.tsx` near-verbatim (no schema
  dependency) — **export `buildHref`** (currently private) so it's directly
  testable. Create `src/components/CategoryFilter.tsx`, ported from
  `src/_legacy/components/CategoryFilter/index.tsx`, **dropping the stray
  `import { router } from 'next/client'`** — a dead import that collides
  with the `const router = useRouter()` destructure right below it (flagged
  by `npm run lint` today as an unused-var warning on the legacy file; the
  component already works from the `useRouter()` result alone).
  Add `tests/int/pagination.int.spec.ts` (Vitest — this is the project's
  first test file, per the test gate in `coding-standards.md`: a test
  command is declared in `AGENTS.md`, so this logic-bearing step needs one).
  Cover `buildHref`: page `1` omits the `page` query param, page `>1`
  includes it, other `searchParams` entries are preserved, an incoming
  `page` entry in `searchParams` is not duplicated, and an empty
  `searchParams` still produces a valid href.
  **Done when:** `npm run test:int` passes; `npm run build` succeeds.

- [x] **Step 4 — `Categories` cache invalidation**
  Create `src/collections/Categories/hooks/revalidateCategories.ts`,
  mirroring `src/collections/Posts/hooks/revalidatePost.ts`'s shape: an
  `afterChange` and an `afterDelete` hook, each calling
  `revalidateTag('blog', 'max')` (categories only feed the `/blog` listing
  right now, so no `revalidatePath` is needed here — unlike Posts, no
  category gets its own route). Wire both into `Categories`' `hooks` in
  `src/collections/Categories/config.ts`.
  **Done when:** `npm run build` succeeds; a code-level check confirms both
  hooks are registered and call `revalidateTag('blog', 'max')`.

- [x] **Step 5 — `/blog` listing route**
  Create `src/app/(frontend)/blog/page.tsx`, ported from
  `src/_legacy/routes/blog/page.tsx`: `generateMetadata` reading the `Pages`
  doc with slug `blog` (via `getPayloadClient`, cached with
  `unstable_cache(..., ['blog-page'], { tags: ['page_blog'] })` — the
  legacy version had no tag at all, a real gap this closes); the page body
  querying that same cached `blog` page doc plus three `blog`-tagged
  queries (all-categories, the featured/first post, the paginated rest,
  filtered by `?category=` when present). Render with `Section`/`Container`/
  `Heading` (`@/components/primitives`) in place of the removed
  `Section`/`Container`/`Header`-typography imports — map the legacy
  `<Section backgroundColor={'secondary'}>` to `<Section surface="muted">`
  (the closest current equivalent: a visually distinct, non-default band).
  Compose `PostPreview` (featured/latest), `CategoryFilter`, `CardContainer`
  + `Card` (the rest, paginated), `Pagination`. The legacy code already
  guards the "More Posts" section on `blogs.docs.length > 0` but not the
  featured/latest banner itself — apply the same guard there (skip
  rendering the "Featured post"/"Latest post" heading when there is no
  featured post *and* no first post to fall back to) so a brand-new blog
  with zero posts doesn't show a heading over nothing.
  **Done when:** with a `Pages` document of slug `blog` created in the
  admin, `npm run dev` and visiting `/blog` shows the featured/latest post,
  the category filter, a grid of the remaining posts, and pagination when
  there are more than 8. `npm run build` succeeds.

- [x] **Step 6 — Styling**
  Add `src/app/(frontend)/styles/components/_card.css`,
  `_post-preview.css`, `_pagination.css`, `_category-filter.css` (new
  `styles/components/` folder — these are reusable content components, not
  full-width page bands like `sections/`, and not single-element primitives
  like `elements/`), each a `@layer components` block using semantic tokens
  (no raw palette values) and existing utilities where they fit (`ui-link`
  for pagination links). Import all four in `styles/index.css` after the
  `sections/` block. No dedicated page-level CSS file — the `/blog` page's
  own spacing comes from `Section`/`Container`/`Stack`, not a bespoke
  stylesheet.
  **Done when:** a browser screenshot of `/blog` at a narrow and a wide
  viewport shows a legible grid (single column narrow, multi-column wide),
  correct token colors in light and dark, and a usable category
  select/pagination control at both widths.

## Files / areas

- `src/components/CardContainer.tsx` (new)
- `src/components/Card.tsx` (new)
- `src/components/PostPreview.tsx` (new)
- `src/components/Pagination.tsx` (new)
- `src/components/CategoryFilter.tsx` (new)
- `src/collections/Categories/hooks/revalidateCategories.ts` (new)
- `src/collections/Categories/config.ts` (edit: add hooks)
- `src/app/(frontend)/blog/page.tsx` (new)
- `src/app/(frontend)/styles/components/_card.css`,
  `_post-preview.css`, `_pagination.css`, `_category-filter.css` (new)
- `src/app/(frontend)/styles/index.css` (edit: add the four imports)
- `tests/int/pagination.int.spec.ts` (new)

## Data / contracts

No collection/global schema changes (the `Categories` hook addition doesn't
change its fields). Reads only:

- `Posts`: `slug`, `title`, `summary`, `featured`, `author`->populated
  `populatedAuthor`, `category`, `date`/`date_tz`, `featuredImage`, all
  already-existing fields.
- `Categories`: `name`, `slug`, `relatedPosts` (join), already existing.
- `Pages`: one document with `slug: 'blog'`, read the same way every other
  page is (`title`, `meta`, `featuredImage`) — must exist for this route to
  render (404s otherwise, same as any other missing page slug).

Cache tags used (all reuse existing revalidation, per Goal, except the new
`Categories` hook in Step 4): `page_blog`, `blog`.

## Testing

`npm run test:int` (Vitest) is a declared command in `AGENTS.md`, so this
logic-bearing step ships with a test per `coding-standards.md`'s testing
gate — this is the project's first test file, creating `tests/int/`.

- **In scope for a test:** `Pagination`'s `buildHref` — a pure URL-query
  formatter with real edge cases (page 1 vs. page >1, existing params
  preserved, no duplicate `page` param).
- **Not tested:** `Card`, `PostPreview`, `CategoryFilter`'s rendering, and
  the `/blog` route itself — these are UI/integration surfaces per the
  project's testing scope rule; verified with the build and the Step 5/6
  browser evidence instead.

## Notes for the AI

- `Heading` (`@/components/primitives`) has `level`/`size`, not `align` —
  every legacy `<Header as={'hN'} align={...}>` call becomes
  `<Heading level={N}>`, dropping `align` (default flow is already left).
  This is the same fix already made for `Footer`/`Header` in feature 10a;
  don't reintroduce the old `align` prop.
- Don't confuse the legacy generic-heading `Header` component with the
  current `Header` (the site nav component, now at
  `src/globals/Header/Component/`) — they are unrelated, same old name.
- `unstable_cache`'s cache key already includes the wrapped function's own
  arguments by default (Next.js resolves it from the call, not just the
  `keyParts` array) — the legacy `queryBlogs(currentPage, categoryParam)`
  correctly used `[]` for `keyParts` for exactly this reason; don't "fix" it
  by adding the arguments to the array again.
- A `Pages` document with slug `blog` must exist in the admin for Step 5's
  done-when to show anything but a 404 — that's a content/setup step for
  whoever tries this, not a code gap.
- Do not touch `src/_legacy/` in this feature; `Breadcrumbs` and
  `PostNavigation` are still needed as reference for 10c.

## Findings

_No findings were raised against this feature._

## Independent review

_No independent review was requested for this feature._
