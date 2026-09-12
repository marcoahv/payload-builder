# Current Feature

**Title:** Editable breadcrumbs (show/hide + appearance)

**Type:** Fix

**Status:** verified - user decision recorded in step 6e: accept the
stale-text-color-on-live-edit bug as a known limitation, and track the
duplicate-header hydration bug (confirmed unrelated to this fix - see 6e) as
a separate, future `/fix` rather than continue investigating it here.

**Branch:** fix/editable-breadcrumbs-show-hide-appearance

## The problem

Breadcrumbs on the blog post detail page (`/blog/[slug]`) are 100% hardcoded
with zero editor control:

- The trail itself is a literal array in
  `src/app/(frontend)/blog/[slug]/page.tsx`: `[{ label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' }, { label: post.title }]`.
- `src/components/Breadcrumbs.tsx` is a pure presentational component with no
  Payload awareness - it just renders whatever `items` it's given.
- `src/components/_breadcrumbs.css`'s `.breadcrumbs` rule hardcodes
  `margin-top`, `padding-block`, `background-color`, and `color` directly,
  not through this project's shared surface/spacing token system.

There is no way for a content editor to hide breadcrumbs on a specific post,
or to change how they look. The user wants both.

## The fix

Give `Posts` a new `breadcrumbs` field group (Appearance tab) with a "Show
breadcrumbs" toggle plus surface/spacing/width - the same
appearance-as-editor-choice pattern every block and Header/Footer already
use - and thread it through `Breadcrumbs.tsx`.

Two things this must not break, both surfaced during planning:

1. **Header-clearance coupling.** `_header.css`'s fixed-header offset targets
   `.ui-section:first-child` inside `<main>`. `Breadcrumbs.tsx` currently
   returns `<script>` before its content div, so this page never engages
   that mechanism today (the existing `margin-top: 7.6rem` is a hand-tuned
   workaround). Once `Breadcrumbs` renders through `<Section>`, its fragment
   must return `<Section>` **before** the JSON-LD `<script>`, or breadcrumbs
   render flush under a fixed header the moment the hardcoded margin is
   removed.
2. **Existing-post visual regression.** Old `Post` documents have no stored
   `breadcrumbs` field - Payload's `defaultValue` only applies to new
   documents/the admin form, not existing rows. `Section`/`Container`'s own
   generic defaults (`surface: 'default'`, `spacing: 'normal'`) don't match
   breadcrumbs' current look (`muted` background, ~1.6rem padding), so every
   already-published post would silently jump to a default-surface band with
   ~16rem of top padding. Fix: `Breadcrumbs.tsx` gets its own **local**
   defaults (`surface: 'muted'`, `spacing: 'tight'` - the closest available
   spacing token to 1.6rem, since raw pixel values aren't allowed by this
   project's semantic-tokens-only rule), mirrored as the field
   `defaultValue`s so a new post's admin form matches what old posts already
   render.

**Revised after user feedback (post-implementation, pre-`/complete`):** the
first pass deliberately kept breadcrumbs non-reactive during live preview -
save-and-refresh was required to see a toggle or appearance change. The user
tried the controls and expected them to update live like every other Post
appearance field already does (`headerAppearance`/`bodyAppearance` in
`PostClient.tsx`). That's a real expectation gap, not a data/save bug (the
values do persist correctly - confirmed by reloading the admin form). Step 6
below closes it: move `Breadcrumbs` rendering into `PostClient`, reading from
its existing `useScopedLivePreview<Post>()` data instead of the server-fetched
`post`. Once it's there, the trail's post-title segment becomes reactive too
(via `data.title`) - leaving it non-reactive while show/appearance react
would be an inconsistent halfway state for no reason once the mechanism is in
place.

**Revised again (regression found during manual testing, before `/complete`):**
step 6 below was checked off on the belief that moving `Breadcrumbs` into
`PostClient` made all of `show`/`surface`/`spacing`/`width` reactive in Live
Preview. Manual testing shows that's only half true: toggling "Show
breadcrumbs" reacts instantly, but changing the trail's **surface** (which is
also its text color - the field's options are literally labelled "Primary
color"/"Secondary color" etc in `SURFACE_OPTIONS`) does not visibly update
until the Live Preview iframe is manually reloaded. After a reload the newly
saved surface renders correctly, so this is not a persistence bug - the saved
value and `_section.css`'s `data-surface` rules are both provably correct
(every surface has a matching `background-color`/`color` pair, no
transitions). The break is specifically in the "unsaved edit updates the
iframe live" path.

Already ruled out (so `/implement` doesn't re-tread this):

- Payload's `findByID` REST populate-merge route passes the browser's posted
  (unsaved) `data` straight through as the base result
  (`result = args.data ?? docFromDB` in `payload/dist/collections/operations/findByID.js`),
  so scalar field values like `breadcrumbs.surface` aren't discarded
  server-side during the live-preview merge round trip.
- Payload's `Select` field commits `setValue` synchronously on `onChange`
  (`@payloadcms/ui/dist/fields/Select/index.js`) - same as the checkbox
  `show` uses. No field-type-specific debounce that would explain a select
  lagging behind a checkbox.
- `breadcrumbsField()`'s field tree (`group -> collapsible -> row -> select`)
  is structurally identical to `headerAppearanceField()`/`appearanceField()`'s
  own surface control, which this same `PostClient` already renders the same
  way for `headerAppearance`/`bodyAppearance`. There's no schema-shape
  asymmetry that would explain a breadcrumbs-only bug.

**Resolved (see step 6a/6b/6c) - real bug, found via screenshots, not the
DevTools self-report.** Live testing first seemed to clear the code: a
console log of the merged data, the DOM `data-surface` attribute, and
`getComputedStyle` on the section all reported the correct new value on every
edit. Verbally that reads as "everything updates." Screenshots of the actual
Live Preview iframe told a different story: on an unsaved surface change, the
section's **background** color visibly updated instantly, but its **text**
color did not - "Home"/"Blog"/the current-page segment stayed the old color
until the doc was saved and the editor reloaded. The self-reported computed
style check was answered for both properties at once and didn't catch that
only one of them was actually stale on screen - the screenshots were the only
evidence that surfaced the real bug once one was requested.

Root cause: `background-color` is a local, non-inherited property set
directly by `.ui-section[data-surface='...']` - it repaints immediately off
the attribute alone. `color` is inherited: "Home"/"Blog"/the current segment
get it via `color: inherit` / `color-mix(in srgb, currentColor ...)` chained
up through `<Container>`/`<nav>`/`<ol>`/`<li>` to the section. Toggling "Show
breadcrumbs" fully unmounts/remounts `<Breadcrumbs>`, which forces a fresh
style computation (like a page reload) - which is why *that* control looked
reactive while surface, changed on an already-mounted section, didn't:
in-place attribute changes don't reliably re-propagate an inherited `color`
through that subtree during Live Preview.

Fix attempted (step 6c, since reverted - see below): key each
live-surface-driven `<Section>` on its own `surface` value, so React fully
remounts that subtree whenever `surface` changes. Applied to breadcrumbs and,
since the mechanism is generic to any `<Section>` receiving a live
`data.*.surface` prop, also to `headerAppearance`/`bodyAppearance`. The user
confirmed this fixed the original symptom for a single change: background and
text color updated together, live, no save needed.

**Second bug, found by the user immediately while testing 6c further:**
making several changes across sections in quick succession, with no save in
between, made the header section appear to render more than once in the
iframe - not a color glitch, literal duplicated content with two different
surface colors simultaneously visible. First hypothesis (step 6d): the same
async-race hazard flagged earlier and set aside too quickly -
`useScopedLivePreview`'s `onMessage` does a real network round trip
(`mergeData`) per edit with no sequencing, so back-to-back edits could
resolve out of order and rewind `data`, and step 6c's remount-on-key-change
would turn an invisible rewind into a visible duplicate-look render. Fixed in
`useScopedLivePreview.ts` by stamping each dispatched message with an
incrementing request id and discarding any response that isn't the latest.
This fix is real and was kept, but retesting showed it was **not sufficient**
- the duplication still reproduced.

Ruled out dev-tooling next: a hard reload during this testing did separately
resolve one earlier "renders twice" report, confirmed as a Next.js Fast
Refresh artifact from code edits landing while the tab was open - a red
herring, not this bug. To rule out React StrictMode/Fast Refresh entirely,
the fix was retested against a full production build (`npm run build && npm
run start`, no dev-mode tooling at all) - the duplication still reproduced
there too.

The user then captured the actual DOM (`outerHTML`) around the duplicate:
two `<section data-surface="...">` elements with different surface values,
both showing the exact same header content, separated by an empty
`<!--$--><!--/$-->` pair - React's own SSR/hydration boundary marker syntax.
This points to a hydration-related duplication specific to combining
key-forced remounts with this page's static generation
(`generateStaticParams`) under Live Preview, not the async race 6d addressed
(6d is likely still worth keeping as a real, independent fix, just not the
cause of this symptom).

**Given a `key`-based remount demonstrably causes a worse defect (duplicated,
stale content visible on screen) than the bug it fixed (a wrong but singular
text color), step 6c has been reverted** (see step 6e). The original
stale-text-color-on-unsaved-live-edit bug is back - background updates
correctly, text color doesn't, until save + reload. This does not affect the
saved/reloaded page, only the Live Preview editing experience. Root-causing
and safely fixing the hydration duplication is a larger investigation than
this fix's scope anticipated; see step 6e for the decision point.

**Out of scope:**

- Adding breadcrumbs to any other route (Pages/`[slug]`, blog listing).
- Editing the trail's actual labels/hrefs (overriding "Blog" or the
  post-title segment) - the user's clarified ask was show/hide + appearance
  only.

## Build steps

- [x] 1. Add `breadcrumbsField()` to `src/fields/appearance.ts`
  - New export alongside `appearanceField`/`headerAppearanceField`,
    self-contained (doesn't compose `appearanceField()`), following
    `headerAppearanceField()`'s precedent:
    ```ts
    export const breadcrumbsField = (): Field[] => [
      {
        type: 'collapsible',
        label: 'Appearance',
        admin: {
          initCollapsed: true,
          description: 'Whether the breadcrumb trail shows above this post, and how it looks.',
        },
        fields: [
          { name: 'show', type: 'checkbox', defaultValue: true, label: 'Show breadcrumbs' },
          {
            type: 'row',
            fields: [
              { name: 'surface', type: 'select', defaultValue: 'muted', admin: { width: '33%' }, options: SURFACE_OPTIONS },
              { name: 'spacing', type: 'select', defaultValue: 'tight', admin: { width: '33%' }, options: SPACING_OPTIONS },
              { name: 'width', type: 'select', defaultValue: 'default', admin: { width: '33%' }, options: WIDTH_OPTIONS },
            ],
          },
        ],
      },
    ]
    ```
  - Done when: exported correctly, `npm run lint` passes.

- [x] 2. Wire the field into `Posts` and regenerate types
  - In `src/collections/Posts/config.ts`'s "Appearance" tab, add one `group`
    field named `breadcrumbs` (label "Breadcrumbs"), placed *before*
    `headerAppearance` (matches page visual order):
    ```tsx
    {
      type: 'group',
      name: 'breadcrumbs',
      label: 'Breadcrumbs',
      admin: { description: 'The Home / Blog / post-title trail above the post.' },
      fields: breadcrumbsField(),
    },
    ```
  - Run `npm run generate:types`.
  - Done when: `Post['breadcrumbs']` (with `show?/surface?/spacing?/width?`)
    appears in `src/payload-types.ts`; command exits 0.

- [x] 3. Update `Breadcrumbs.tsx` to use `Section`/`Container`
  - Import `Section`, `type Surface`, `type Spacing`, `type Width` from
    `@/components/primitives` alongside the existing `Container` import.
  - Add props `surface?: Surface | null`, `spacing?: Spacing | null`,
    `width?: Width | null` with local defaults `surface = 'muted'`,
    `spacing = 'tight'` (not Section's own generic defaults).
  - Replace `<div className="breadcrumbs"><Container>` with
    `<Section surface={surface} spacing={spacing}><Container width={width}>`.
  - Reorder the returned fragment so `<Section>...</Section>` comes before
    the JSON-LD `<script>` tag.
  - Done when: component renders a `<section class="ui-section"
    data-surface="..." data-spacing="...">` as the first element in its
    fragment, script second; `npm run lint` passes.

- [x] 4. Gate rendering in `blog/[slug]/page.tsx`
  - Replace `<Breadcrumbs items={breadcrumbs} />` with:
    ```tsx
    {post.breadcrumbs?.show !== false && (
      <Breadcrumbs
        items={breadcrumbs}
        surface={post.breadcrumbs?.surface}
        spacing={post.breadcrumbs?.spacing}
        width={post.breadcrumbs?.width}
      />
    )}
    ```
    (same `!== false` convention as `Header`'s `transparentAtTop`/
    `showThemeToggle` - undefined/old posts stay shown.) No query change
    needed; the existing `select` is a deny-list.
  - Done when: `npm run lint` and `npm run build` pass.

- [x] 5. Delete the now-redundant CSS
  - In `src/components/_breadcrumbs.css`, delete the `.breadcrumbs { ... }`
    rule (margin-top/padding-block/background-color/color) - fully
    superseded by `Section`'s own CSS. Leave
    `.breadcrumbs__list/__item/__link/__current/__separator` untouched.
  - Done when: no `.breadcrumbs` selector remains in CSS or TSX; `npm run
    lint` and `npm run build` pass.

- [x] 6. Make breadcrumbs live-preview reactive
  - In `src/app/(frontend)/blog/[slug]/PostClient.tsx`: import
    `Breadcrumbs` from `@/components/Breadcrumbs`. Build the trail from the
    hook's own `data` instead of the server-fetched `post`: `[{ label:
    'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label:
    data.title }]`. Render `{data.breadcrumbs?.show !== false && (<Breadcrumbs
    items={breadcrumbs} surface={data.breadcrumbs?.surface}
    spacing={data.breadcrumbs?.spacing} width={data.breadcrumbs?.width} />)}`
    as the **first** element returned, before the existing header `<Section>`
    - preserves the `.ui-section:first-child` header-clearance ordering from
    step 3, now one level higher in the tree.
  - In `src/app/(frontend)/blog/[slug]/page.tsx`: remove the `breadcrumbs`
    array computation and the `<Breadcrumbs>` conditional block added in step
    4 - `<PostClient initialData={post} />` now owns all of it. Leave
    everything else in `page.tsx` (queries, `PostNavigation`, related posts)
    untouched.
  - Done: `npm run lint` and `npm run build` pass, and `show`/the post title
    are confirmed reactive. **Not actually done:** manual testing found
    `surface` (also spacing/width, unconfirmed) does not update live - see
    the "Revised again" note above and step 6a below.

- [x] 6a. Isolate exactly where the update is lost (no code change)
  - Diagnosed live with the user in the actual Live Preview iframe (dev
    server + DevTools, since browser automation wasn't available in the
    implementing environment): a temporary `console.log` after `mergeData`
    in `useScopedLivePreview.ts` showed `breadcrumbs.surface` merging
    correctly on every edit; the `<section>`'s `data-surface` attribute
    updated correctly in the live DOM; a self-reported `getComputedStyle`
    check said both `background-color` and `color` looked updated.
  - That self-report turned out to be imprecise. Screenshots of the actual
    iframe (requested after the "no defect" conclusion below didn't sit
    right with the user) showed the background changing live while the
    text stayed the old color until save + reload - the two properties
    were never actually checked independently. Screenshots, not more
    DevTools questions, were what surfaced the real signal.
  - The temporary `console.log` has been removed;
    `git diff src/utilities/useScopedLivePreview.ts` is clean.

- [x] 6b. Diagnose the confirmed gap
  - `background-color` is local/non-inherited and repaints immediately from
    the `data-surface` attribute alone. `color` is inherited down through
    `<Container>`/`<nav>`/`<ol>`/`<li>` to the links and current-page
    segment via `color: inherit`/`color-mix(in srgb, currentColor ...)`.
    Toggling "Show breadcrumbs" unmounts/remounts `<Breadcrumbs>` (a fresh
    style computation, like a reload), which is why that control looked
    reactive while an in-place `surface` change on an already-mounted
    section didn't reliably re-propagate the inherited `color`.

- [x] 6c. Attempted fix, reverted: remount the section on a live surface
      change
  - Applied `key={surface}` to breadcrumbs' `<Section>` and
    `key={data.headerAppearance?.surface}` /
    `key={data.bodyAppearance?.surface}` to `PostClient.tsx`'s own
    `<Section>`s, forcing React to fully remount on a surface change.
  - Confirmed by the user: fixed the original symptom for a single change
    (background + text color update together live). Confirmed by the user
    again: further testing (several rapid, unsaved changes across sections)
    produced a worse bug - literal duplicated section content, not just a
    color glitch (see 6d/6e).
  - **Reverted.** `git diff` on `src/components/Breadcrumbs.tsx` and
    `src/app/(frontend)/blog/[slug]/PostClient.tsx` no longer contains any
    `key={...surface...}` - both match their pre-6c state (only the
    pre-existing `key={item.label}` on the breadcrumb list items remains).
    `npm run lint` and `npm run build` pass on the reverted state.

- [x] 6d. Fix: discard out-of-order live-preview merge responses
  - Hypothesis when 6c's duplication was first found: `useScopedLivePreview`
    `onMessage`'s `mergeData` call is a real network round trip with no
    sequencing, so back-to-back edits could resolve out of order and rewind
    `data` to a stale value, which 6c's remount-on-key-change would turn
    visible.
  - In `src/utilities/useScopedLivePreview.ts`: added an incrementing
    `latestRequestId` ref, stamped per dispatched message; a response only
    commits (`setData`/`previousDataRef`) if its id still matches the latest
    dispatched request, so an older, out-of-order response is silently
    discarded instead of rewinding state. `npm run lint` and `npm run build`
    pass.
  - **Kept despite not fixing 6c's symptom** - retesting showed the
    duplication persisted even with this fix in place, so it wasn't the
    (sole) cause. It's still a real, independently-correct fix for a real
    race condition and doesn't reintroduce any regression on its own, so
    there's no reason to revert it.

- [x] 6e. Decision point: how to proceed - resolved by the user
  - After 6c was reverted, the user retested the exact duplicate-header
    reproduction and **the duplicate still showed up** - with none of this
    session's `key` changes present in the code at all. This confirms the
    duplicate-header hydration bug is **not caused by anything in this fix**
    (not 6c, not 6d) - it's a pre-existing defect, most likely dating to the
    original Step 6 of this same branch (moving `Breadcrumbs` into
    `PostClient` for live-preview reactivity), surfaced only now because
    nobody had previously tested rapid alternating edits across sections in
    Live Preview. The DOM evidence still stands as the best lead for
    whoever picks this up: two `<section data-surface="...">` elements with
    an empty `<!--$--><!--/$-->` React SSR/hydration-boundary marker pair
    between them, reproducible in a full production build
    (`npm run build && npm run start`), tied to this page's static
    generation (`generateStaticParams`).
  - User's decision: **(a) accept** the stale-text-color-on-live-edit bug
    (background updates instantly, text color needs save + reload) as a
    known, documented limitation - not fixed by this spec. **(b) track**
    the duplicate-header hydration bug as a separate, future `/fix`, not
    investigated further here - suggested opener: `/fix "breadcrumbs/header
    sections in Live Preview render duplicated content with different
    surface colors after several rapid, unsaved surface changes - see
    blueprint/history/fixes/ for this fix's full diagnosis"`.
  - Net code change kept from this whole investigation: only step 6d
    (`useScopedLivePreview.ts`'s out-of-order-response guard) - a real,
    independent fix, unrelated to either bug above, kept because it's
    correct and safe on its own merits.

## Verify

- `npm run generate:types`, `npm run lint`, `npm run build` all pass (no
  dedicated `Verify` command is configured in this project - this is the
  fallback gate).
- Manual, via the `run` skill or dev server: open an **existing** post and
  confirm breadcrumbs render unchanged (muted bar, compact spacing, correctly
  cleared under the fixed header) with zero admin action taken - this is the
  regression check for point 2 above. Then open a post's Appearance tab,
  toggle "Show breadcrumbs" off and confirm the trail (and its JSON-LD
  script) disappears; toggle it back on, change surface/spacing/width, save,
  and confirm each visibly applies.
- **Known issue, not fixed by this spec, tracked as a future `/fix`** (see
  step 6e): in Live Preview, making several rapid, unsaved surface changes
  across breadcrumbs/header/body sections can render duplicated section
  content. Confirmed present both before this fix's changes and after fully
  reverting them - not caused by anything in this spec. A normal
  (non-preview) reload of the public page is unaffected and always renders
  the actually-saved values correctly.
- **Known, accepted limitation** (see step 6e for the decision): in Live
  Preview, changing a section's surface updates its background instantly but
  its text color stays stale until save + reload. This is the original bug
  this fix was opened to chase; the user chose to accept it rather than risk
  another fix attempt after the first one (step 6c) traded it for the worse
  bug above. It does not affect the saved/reloaded page - only the
  live-editing experience.
