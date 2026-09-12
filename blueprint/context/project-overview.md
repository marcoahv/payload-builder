# Site Builder - Project Overview

<!-- blueprint:source-hash 50d9b5c5f83fdee5a38e8cfde4d8d73895902ab40d3bcb0f4c0969284e937c7c -->

> A reusable Payload CMS + Next.js template, kept as a template repository and
> cloned fresh for each new site, rather than shipped as one specific product.

## Problem

Building a new site with Payload CMS means re-wiring the same plumbing every
time: a block-based page builder, blog engine, media pipeline, and SEO. This
project packages that plumbing once, plus a brand-swappable design token
system, so a new site starts from working infrastructure instead of an empty
Payload install.

## Users

- **The template maintainer** - clones this repo per new site and extends it.
- **A given site's content editors** - use the Payload admin to manage pages,
  posts, and site-wide settings.
- **A given site's visitors** - the public frontend.

Not an end-user-facing product on its own; "users" of any one deployment are
the two roles above.

## Features

1. **Page builder core** (shipped, headline feature) - `Pages` collection
   (Information/Layout/SEO tabs) with a block-based layout field, backed by a
   single block registry so a new block type is added once and becomes
   available everywhere.
2. **Blocks** (shipped) - `Hero`, `FeatureGrid`, `CallToAction`, `RichText`,
   each with shared editor-controlled appearance (surface, spacing, width).
3. **Blog engine** (shipped) - `Posts` collection with author/category
   relationships, one-featured-post validation, and a rich text body that can
   itself embed the same registered blocks.
4. **Categories** (shipped) - `Categories` collection with a reverse
   relationship back to its posts.
5. **Media pipeline** (shipped) - `Media` collection with auto blur-placeholder
   generation, responsive webp image sizes, and optional S3-compatible
   storage.
6. **Site navigation & branding** (shipped) - `Header` and `Settings` globals
   for logo, nav, social links, CTAs, and site identity.
7. **SEO** (shipped) - per-document SEO fields, canonical URL generation,
   sitemap control, `robots.ts`/`sitemap.ts` routes.
8. **Cache-tagged rendering** (shipped) - page/global reads cached and
   revalidated on change so admin edits appear without a stale cache.
9. **Admin auth** (shipped) - `Users` collection gates write access.
10. **Phase 7 legacy port** (shipped) - migrated the CSS-Modules components and
    blog routes quarantined in `src/_legacy/` (`Footer`, blog listing/detail
    pages, `Pagination`, `PostPreview`, `Breadcrumbs`, `PostNavigation`,
    `Card`, `CategoryFilter`) onto the primitive components and semantic token
    system.
11. **Portable branding token system** (shipped) - consolidated design tokens
    (colors, typography, spacing, shadows, border-radius) into a single
    portable `branding.css` usable across different project stacks, plus a
    personality-selection guide based on the Website-Personalities-Framework
    (`theory-lectures.pdf` §26: 7 personalities - Serious/Elegant,
    Minimalist/Simple, Plain/Neutral, Bold/Confident, Calm/Peaceful,
    Startup/Upbeat, Playful/Fun - each applied across 7 design ingredients,
    with a trait-injection technique for blending neighboring personalities).
12. **Button color variants** (shipped) - added a Ghost button (no fill/border,
    background on hover) alongside Primary/Outline.
13. **Site-wide image border radius control** (shipped) - editor-controlled
    Settings field (None/Small/Medium/Large/Extra Large) driving a
    `--radius-image` token across every image.
14. **Dark mode toggle** (shipped) - a visitor-facing manual light/dark
    override (toggle control in the header) that persists the chosen mode
    across visits and takes precedence over the OS `prefers-color-scheme`
    default; an editor-controlled `Header.showThemeToggle` switch can hide
    the control per site.
15. **Live preview** (next) - client-side live preview (via
    `@payloadcms/live-preview-react`) for Pages and Posts, so unsaved editor
    changes render instantly in an admin preview pane with no save or
    drafts/versions required. Header/Footer/Settings live preview is a
    deliberate later addition.

## Data model

### Pages (`pages`)

- `slug` (text, unique, auto-generated)
- `title` (text, required)
- `featuredImage` (upload -> Media, required)
- `blocks` (blocks field: any registered block, see Blocks below)
- `meta` (group) - SEO title/description/image/canonicalUrl, `addToSitemap`
  (checkbox, default true)

### Posts (`posts`)

- `slug` (text, unique, auto-generated)
- `title` (text, required)
- `summary` (textarea)
- `featured` (checkbox) - only one post may be `true` at a time (validated)
- `author` (relationship -> Users, required)
- `category` (relationship -> Categories)
- `date` (date, timezone-aware)
- `populatedAuthor` (virtual group, hidden) - denormalized `{ id, name }` cache
- `featuredImage` (upload -> Media, required)
- `body` (rich text, required) - can embed any registered block
- `meta` (group) - same SEO shape as Pages

### Categories (`categories`)

- `name` (text)
- `slug` (text, derived from `name`)
- `relatedPosts` (join -> Posts.category) - reverse relationship, not stored

### Media (`media`)

- `alt` (text, required)
- `blurDataUrl` (text, auto-generated, read-only)
- Upload sizes: `thumbnail` (320x180), `card` (640x360), `fullSize`
  (1280x720), `og` (1920x1080 png) - all webp except `og`
- Storage: local by default; S3-compatible when bucket/credential env vars
  are set

### Users (`users`)

- `name` (text, required)
- Payload auth (email/password) - the only access-control gate in the project

### Header (global, `header`)

- Appearance: `surface`, `width`, `position` (fixed/static), `height`
  (compact/normal/tall), `transparentAtTop` (checkbox), `showThemeToggle`
  (checkbox, default true - hides the dark mode toggle control when off)
- `logo`, `logoDark`, `icon`, `iconDark` (uploads -> Media; dark variants
  optional, fall back to the main asset)
- `navLinks` (array, 1-6) - `link` (relationship -> Pages, required),
  `newTab` (checkbox)
- `socialLinks` (array, up to 6) - `platform` (select), `url`, `icon` (upload)
- `ctaButtons` (array, up to 2) - `label`, `url`, `variant` (primary/outline)

### Settings (global, `settings`)

- `gtmCode` (text) - Google Tag Manager
- `siteName` (text, required, default "Site Builder")
- `siteDescription` (textarea)

### Blocks (embedded in `Pages.blocks` and `Posts.body`)

Every block shares an `appearanceField()` (surface, spacing, width) plus:

- **Hero** (`hero`) - `heading` (required), `subheading`, `image`, `layout`
  (imageRight/imageLeft/textOnly), `links` (array, up to 2: label/url/variant)
- **FeatureGrid** (`featureGrid`) - `heading`, `intro`, `columns` (2/3/4),
  `features` (array, 1-12, required: title/body/image)
- **CallToAction** (`callToAction`) - `heading` (required), `body`, `align`
  (center/left), `links` (array, 1-2, required: label/url/variant)
- **RichTextBlock** (`richText`) - `content` (rich text, required)

> Lock: the block registry pattern (`src/blocks/registry.ts`) is a hard
> contract - a new block must add its config + component there and nowhere
> else. Later features should extend this list, not bypass it.

## Tech stack

- **Next.js 16** - App Router; `(frontend)` route group for the public site,
  `(payload)` for the admin panel and Payload's own API/GraphQL routes
- **Payload CMS 3.82** - collections, globals, blocks, admin panel
- **MongoDB** (`@payloadcms/db-mongodb`) - the only datastore
- **Lexical** - rich text editor, with `BlocksFeature` so blocks embed inside
  post bodies
- **Tailwind CSS v4** - CSS-first `@theme` tokens; two-tier system (palette +
  semantic roles); `light-dark()` theming as the OS-driven default, with a
  manual override (`.dark`/`.light` class or `data-theme` attribute plus a
  persisted visitor preference) taking precedence when set
- **`@payloadcms/plugin-seo`** - per-document SEO fields
- **S3-compatible storage** (optional, env-gated) - falls back to local
  storage when unset
- **Resend** (optional, env-gated) - transactional email
- **Vitest** + **Playwright** - configured, no test files written yet
- **`@payloadcms/live-preview-react`** - client-side live preview for Pages
  and Posts; merges unsaved editor changes into the rendered page via
  `postMessage`, no drafts/versions required

## Monetization

Not applicable. This is an internal starter template only - not intended to
be distributed or sold; it exists to bootstrap the author's own future sites.

## UI/UX

Design intent encoded in the tokens: brand-swappable (components reference
only semantic roles, never raw palette values), light/dark via `light-dark()`
as the OS-driven default, and editor-controlled appearance so content editors
pick semantic roles rather than colors or pixel values.

The Phase 7 legacy port, the portable branding token system, and the manual
dark mode toggle (features 10-14 above) have all shipped. Next up (feature
15): a live-updating preview pane for editors on Pages and Posts.

- `/` and `/[slug]` - block-rendered pages (frontend)
- `/blog` and `/blog/[slug]` - blog listing and detail pages
- `/admin` - Payload admin panel

## Deployment

Not decided / per-project - this is a template repository cloned per site, so
the deploy target is chosen when a given site is built from it. The
originating course used Railway, but that is not a commitment for this
template.

Env vars: `DATABASE_URL`, `PAYLOAD_SECRET` (required); `SITE_NAME` (optional
identity); `S3_API`/`S3_BUCKET`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/
`S3_PUBLIC_URL` (optional storage); `RESEND_API_KEY`/`EMAIL_FROM_ADDRESS`/
`EMAIL_FROM_NAME` (optional email).

> TODO: deploy target, build/start commands for that target, health check
> path, and domain notes all depend on the target chosen per site.
</content>
