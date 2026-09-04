# Quarantined — pending port to the token system

These files carry logic worth keeping, but their presentation was written against
CSS Modules, which were deleted when the site builder moved to the Tailwind v4
token system.

They are excluded from compilation via `"exclude": ["src/_legacy"]` in
`tsconfig.json`, so they neither build nor type-check. Nothing imports them.

## Port these (Phase 7)

Keep the `.tsx` logic, rewrite presentation using `components/primitives/`
(`Section`, `Container`, `Stack`) and semantic tokens (`--color-surface`,
`--color-on-surface`). Delete each folder once ported.

| Component | Lines of logic | Notes |
| --- | --- | --- |
| `Pagination` | 98 | Page-range logic. |
| `PostPreview` | 83 | |
| `Breadcrumbs` | 71 | Imported the deleted `Container`. |
| `PostNavigation` | 57 | Prev/next resolution. |
| `Card` | 55 | Imported the deleted `CardContainer` and `Header`. |
| `CategoryFilter` | 53 | |
| `Footer` | 38 | Has uncommitted edits from before the migration. Port next — it reuses the nav-link and logo patterns the header established. |

### Already ported — delete these folders

- **`Navigation/`** and **`Navigation/Logo/`** → merged into `src/components/Header/`. Its accessibility work (focus trap, Escape, scroll lock, route-change close) and the `<picture>` logo were kept; the CSS Modules were replaced by `styles/sections/_header.css`. The `nav` global it read was replaced by the `header` global.
- **`MediaImage/`** → `src/components/MediaImage.tsx`.

## Routes

`routes/blog/` — `page.tsx` (266 lines) and `[slug]/page.tsx` (309). They depend
on most of the components above, so port them last.

A full pre-migration snapshot of `src/` also exists outside the repo, but this
directory is the authoritative copy: it preserves the working-tree edits that
were uncommitted at migration time.
