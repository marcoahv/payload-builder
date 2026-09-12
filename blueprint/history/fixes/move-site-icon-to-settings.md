# Current Feature

**Title:** Move Site Icon fields from Header to Settings, then to the sidebar
**Type:** Fix
**Status:** verified
**Branch:** fix/move-site-icon-to-settings

## The problem

`icon`/`iconDark` (the browser-tab favicon uploads) lived on the `Header`
global, but nothing about Header rendered them — the only reader was the
root layout's `generateMetadata()`. Step 1 (below, already built) moved them
to `Settings`, where the other site-identity fields (`siteName`,
`siteDescription`, `gtmCode`) already live. Those three are all
`admin.position: 'sidebar'` fields; `icon`/`iconDark` were added as
main-column fields to match how they sat on Header. The user asked to move
them to the right side too — i.e. into that same sidebar, alongside the
other identity fields.

## The fix

**Step 1 (already implemented this session):**
1. `src/globals/Settings/config.ts` — added `icon` (upload, required) and
   `iconDark` (upload, optional), same shape Header had, with `icon`'s
   description reworded to drop the Header-specific "distinct from the logo
   above".
2. `src/globals/Header/config.ts` — removed `icon`/`iconDark`.
3. `src/app/(frontend)/layout.tsx` — `generateMetadata()` now reads
   `settings.icon`/`settings.iconDark` (dropped the separate `header` fetch,
   bumped `settings`'s fetch to `depth: 1`).
4. Regenerated `payload-types.ts`.

**Step 2 (this fix):**
5. `src/globals/Settings/config.ts` — add `admin: { position: 'sidebar' }`
   to both `icon` and `iconDark` (merging into their existing `admin`
   objects, which currently hold only `description`), so they render in the
   sidebar alongside `siteName`/`siteDescription`/`gtmCode` instead of the
   main column.

**Must not break:** field behavior, validation (`icon` stays required), and
descriptions — this only changes where in the form the two fields render,
not their type, requiredness, or relation.

**Data note (unchanged from step 1):** still not a migration — re-select the
Site Icon / Site Icon (dark mode) once in `/admin` → Settings after this
ships, since Header's previously-stored value doesn't carry over
automatically.

## Build steps

- [x] 1. **Move the fields from Header to Settings and update the reader**
  - Add `icon`/`iconDark` to `Settings` config; remove them from `Header`
    config; update `layout.tsx`'s `generateMetadata()`; run
    `npm run generate:types`.
  - Done when: `npm run generate:types`, `npm run lint`, and `npm run build`
    all pass, and `payload-types.ts`'s `Setting` interface gains
    `icon`/`iconDark` while `Header` loses them. (Done — verified this
    session.)

- [x] 2. **Move Site Icon fields into the Settings sidebar**
  - In `src/globals/Settings/config.ts`, add `position: 'sidebar'` to the
    `admin` object on both the `icon` and `iconDark` fields.
  - Done when: `npm run lint` and `npm run build` pass; manual (dev server):
    in `/admin` → Settings, "Site Icon" and "Site Icon (dark mode)" render
    in the sidebar column, not the main column.

## Verify

- `npm run build` succeeds.
- In `/admin` → Settings, "Site Icon" and "Site Icon (dark mode)" appear in
  the sidebar (right side), grouped with the other site-identity fields, and
  Header's edit view no longer shows them.
- After re-selecting a Site Icon in Settings, the site's browser tab favicon
  reflects it; with a dark-mode icon also set, a browser using a dark colour
  scheme shows that one instead (dev server needed to see this live — ask
  the user to run `npm run dev`).
