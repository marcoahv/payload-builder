# Coding Standards

> Your conventions, tuned by `/adopt` to match this project's real stack:
> Next.js + Payload CMS + TypeScript + Tailwind v4 + MongoDB. Update this file
> directly as the conventions evolve.

## TypeScript

- `strict` is currently `false` in `tsconfig.json` (pragmatic default from the
  Payload starter, not aspirational) - don't assume strict-mode guarantees hold
- Avoid `any` where practical; the one existing exception
  (`blockComponents` in `src/blocks/registry.ts`) is deliberate and commented,
  because a block-slug map can't be narrowed per-variant
- Payload's generated types (`src/payload-types.ts`) are the source of truth for
  collection/global shapes - re-run `npm run generate:types` after any schema
  change instead of hand-writing types that duplicate them

## React

- Functional components only (no class components)
- Server Components by default; `'use client'` only for interactivity, hooks,
  or browser APIs
- Custom Payload admin components (field `Field`/`Cell`/`RowLabel` overrides,
  `admin.components`) live under `src/custom/` and are referenced by path +
  named export (see `.claude/rules/components.md`)

## Payload CMS

- One block registry (`src/blocks/registry.ts`) is the single place a block is
  defined, registered, and mapped to its renderer - adding a block means adding
  its `config.ts` + `Component.tsx` and one entry here, nothing else
- Collections/globals live under `src/collections/<Name>/config.ts` and
  `src/globals/<Name>/config.ts`; hooks for that collection/global live in a
  sibling `hooks/` folder
- Follow `.claude/rules/security-critical.md` for every Local API call and
  hook: `overrideAccess: false` whenever a `user` is passed, thread `req`
  through nested operations in hooks, and guard against hook re-trigger loops
  with `context` flags
- Cache page/global reads with `unstable_cache`, tagged per document
  (`page_<slug>`, `global_<slug>`), and pair every tag with a matching
  `revalidateTag()` call in that collection's/global's `afterChange`/
  `afterDelete` hook (see `src/collections/Pages/hooks/revalidatePage.ts` and
  `src/globals/hooks/revalidateGlobal.ts`) - a cache tag with no matching
  revalidation hook is a bug, not an optimization
- Run `npm run generate:importmap` after adding or moving a custom admin
  component path

## File Organization

- Collections: `src/collections/<Name>/config.ts` (+ `hooks/`)
- Globals: `src/globals/<Name>/config.ts` (+ shared `src/globals/hooks/`)
- Blocks: `src/blocks/<Name>/config.ts` + `Component.tsx`, registered in
  `src/blocks/registry.ts`
- Fields shared across collections: `src/fields/<name>.ts` (or
  `src/fields/<name>/config.ts` when it has its own hooks)
- Reusable frontend components: `src/components/[feature]/ComponentName.tsx`
- Layout primitives (`Section`, `Container`, `Stack`, `Heading`):
  `src/components/primitives/`
- Custom Payload admin components: `src/custom/<name>/Component.tsx`
- Routes: `src/app/(frontend)/...` (public site) and
  `src/app/(payload)/...` (admin + Payload's own API/GraphQL routes)
- Utilities: `src/utilities/[name].ts`
- `src/_legacy/` is quarantined, pre-migration code excluded from the
  TypeScript build (`tsconfig.json` `exclude`) - see its `README.md` for what's
  pending a Phase 7 port; don't add new code there or import from it

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)
- Collection/global slugs: lowercase, matching the exported const name
  (`Pages` -> `slug: 'pages'`)

## Styling

- Tailwind CSS v4, CSS-first config: tokens are defined with `@theme static`,
  no `tailwind.config.js`
- `src/app/(frontend)/styles/base/_base-tokens.css` + `base/_alias-tokens.css` are the
  two portable files another project edits when reusing this `styles/`
  folder; see each file's own header comment and `styles/personalities.md`
  - Split by raw vs. derived, and this indirection is load-bearing, not
    stylistic: `_base-tokens.css` holds every literal value (palette colors,
    radius, type scale, spacing, and the section/header layout rhythm) - the
    only place a literal belongs; `_alias-tokens.css` holds everything built
    by referencing those values via `var()`/`light-dark()`/`color-mix()` -
    semantic role tokens (`--color-surface`, `--color-on-surface`, ...),
    shadows, and font-family aliases. A dark-mode value never gets an inline
    literal - it's always its own named `_base-tokens.css` palette step, even
    if used only once
  - Components and blocks reference **only** semantic tokens, never the
    palette directly, so a brand swap only touches `_base-tokens.css`
  - Surface/foreground tokens are defined in matching pairs so text can't end
    up unreadable on its own background
- `_base-tokens.css`'s Breakpoints section is pure device-viewport mechanics,
  not a personality-tunable value - kept there anyway so every raw literal
  in the styles system lives in one file
- Theming is `light-dark()`-based (no `.dark` class, no JS toggle); driven by
  `color-scheme` in `base/_reset.css`
- Editors pick semantic roles (`surface`, `spacing`, `width`), never raw
  colors or pixel values - see `src/fields/appearance.ts`; a new block should
  reuse `appearanceField()` rather than inventing new raw style controls
- No inline styles; no shadcn/ui (not used in this project)

## Database

- MongoDB via `@payloadcms/db-mongodb` (`mongooseAdapter`), configured in
  `src/payload.config.ts`
- Schema changes happen by editing a collection/global's `fields`, then
  running `npm run generate:types` to refresh `src/payload-types.ts` - there
  is no separate migration step for MongoDB here
- All reads/writes go through Payload's Local API (`payload.find`,
  `payload.create`, etc.), never a raw MongoDB driver call

## Data Fetching

- Server Components fetch directly via Payload's Local API
  (`getPayload({ config })` then `payload.find`/`findByID`), not through a
  client-side fetch layer
- Page and global lookups are wrapped in `unstable_cache` with a per-document
  tag (see Payload CMS section above) rather than fetched raw on every request
- Public-facing reads (frontend pages) run with default `overrideAccess: true`
  since no `user` is passed; any future code path that fetches on behalf of a
  logged-in user must pass `overrideAccess: false` per
  `.claude/rules/security-critical.md`

## Error Handling

- Custom Payload admin field errors (e.g. the "only one featured post" rule)
  render through a custom `Error` component
  (`src/custom/error/Component.tsx#CheckboxError`), not a generic message
- Frontend pages call Next's `notFound()` when a slug lookup misses, rather
  than rendering an empty state

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding: this project uses Vitest (`vitest.config.mts`, jsdom
environment, integration specs under `tests/int/**/*.int.spec.ts`) and
Playwright (`playwright.config.ts`) for e2e, both already configured via
`npm run test:int` / `npm run test:e2e` - but no test files exist yet, so the
first logic-bearing step is also the one that creates `tests/int/`. Use
`vi.mock()` for Payload's Local API / external adapters (S3, Resend) rather
than hitting a real database or third-party service, and `vi.useFakeTimers()`
for time-dependent logic (e.g. the featured-post date field).

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/browser-tests`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
