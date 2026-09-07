# Current Feature

**Title:** BlockSlug type cast on block registries + stale `_legacy` doc reference
**Type:** Fix
**Status:** verified
**Branch:** fix/blockslug-type-cast-and-stale-legacy-doc

## The problem

1. `src/collections/Pages/config.ts` already casts its `blocks` field's
   `blockReferences: blockSlugs` as `blockSlugs as BlockSlug[]` (an
   uncommitted, in-progress change from before this session) to satisfy a
   TypeScript diagnostic: `blockSlugs` is `string[]` (derived from
   `blockConfigs.map((block) => block.slug)` in `src/blocks/registry.ts`),
   but `blockReferences` expects `BlockSlug[]`. `src/collections/Posts/config.ts`
   has the exact same diagnostic on its own `BlocksFeature({ blocks: blockSlugs })`
   call (`src/collections/Posts/config.ts:169-170`, inside the `body` field's
   `lexicalEditor` config) and was never fixed - `blockSlugs` is passed there
   as plain `string[]` too.
2. `blueprint/context/coding-standards.md`'s "File Organization" section
   (line 63) still documents `src/_legacy/` as an existing, quarantined
   directory ("don't add new code there or import from it"). That directory
   was deleted in commit `1ec333a` and `tsconfig.json`'s `exclude` list no
   longer references it (`"exclude": ["node_modules"]` only) - the bullet is
   stale.

## The fix

- Add the same `BlockSlug` cast to `Posts/config.ts`'s `BlocksFeature` call,
  importing `type BlockSlug` from `payload` alongside the existing
  `CollectionConfig`/`slugField` import. Match `Pages/config.ts`'s exact
  pattern (`blocks: blockSlugs as BlockSlug[]`) for consistency between the
  two identical call sites.
- Remove the stale `src/_legacy/` bullet from `coding-standards.md`'s File
  Organization list.
- Must not change `blockSlugs`' runtime value or the block registry's public
  shape - this is a type-only annotation fixing a build-time diagnostic, not
  a behavior change.

## Build steps

- [x] 1. In `src/collections/Posts/config.ts`, add `type BlockSlug` to the
  existing `from 'payload'` import and change
  `blocks: blockSlugs` to `blocks: blockSlugs as BlockSlug[]` inside the
  `BlocksFeature({...})` call. Remove the stale `src/_legacy/` bullet from
  `blueprint/context/coding-standards.md`'s File Organization section.
  Done when: `npm run build` succeeds and the `BlocksFeature` line no longer
  shows a `string[]` vs `BlockSlug[]` type diagnostic in the editor/IDE
  problems panel.

## Verify

- `npm run build` passes (already the project's only automated gate; no
  `Verify` command declared yet).
- Open `src/collections/Posts/config.ts` in the editor and confirm no
  red-squiggle diagnostic remains on the `BlocksFeature` call.
- `grep -n "_legacy" blueprint/context/coding-standards.md` returns nothing.
