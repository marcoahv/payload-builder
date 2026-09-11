# Current Feature

**Title:** Two-column Settings admin layout
**Type:** Fix
**Status:** verified
**Branch:** `fix/two-column-settings-layout`

## The problem

`src/globals/Settings/config.ts`'s four fields (`gtmCode`, `siteName`,
`siteDescription`, `imageRadius`) all render in the admin edit view's
single main column today. The user wants `Site Name`, `Site Description`,
and `Google Tag Manager` grouped together in the right-hand sidebar
column, with `Image Corner Radius` alone in the main (left) column.

## The fix

Payload's admin edit view already splits into two columns based on each
field's `admin.position`: fields with no `position` (or `position:
undefined`) render in the main column; fields with `admin: { position:
'sidebar' }` render in the right sidebar column. No custom layout
component is needed — set `admin.position: 'sidebar'` on `gtmCode`,
`siteName`, and `siteDescription`, and leave `imageRadius` as-is (already
positionless, so it stays in the main column).

Must not break: field order within each column (sidebar shows
gtmCode/siteName/siteDescription in whatever order they're declared;
keep them declared in that same relative order so the sidebar reads
top-to-bottom as Site Name, Site Description, Google Tag Manager per the
user's requested order — reorder the array to `siteName`,
`siteDescription`, `gtmCode` to match), each field's existing
`required`/`defaultValue`/`admin.description` behavior, and the
`imageRadius` field added in the previous feature.

## Build steps

- [x] 1. **Add `admin.position: 'sidebar'` to `siteName`, `siteDescription`,
  and `gtmCode`** in `src/globals/Settings/config.ts`, reordering the
  array to `siteName`, `siteDescription`, `gtmCode`, `imageRadius` so the
  sidebar lists in the requested order. **Done when:** `npm run build`
  passes, and in `/admin`'s Settings edit view, Site Name/Site
  Description/Google Tag Manager appear in the right sidebar (in that
  order) and Image Corner Radius appears alone in the main column.

## Verify

`npm run dev`, open `/admin` → Settings: confirm the edit view shows two
columns — Image Corner Radius on the left, and Site Name, Site
Description, Google Tag Manager (top to bottom) in the right sidebar —
and that saving the document still works normally.
