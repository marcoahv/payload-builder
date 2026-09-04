# Styling system

Tailwind CSS v4, configured entirely in CSS. There is no `tailwind.config.js` — v4 is CSS-first and would ignore one.

```
styles/
  index.css        entry point — import order is load-bearing
  tokens/          the design vocabulary (palette, semantic, type, spacing, breakpoints)
  base/            global element rules (reset, color-scheme)
  elements/        single-purpose utilities (button, heading, link, prose, ...)
  layouts/         structural utilities (containers, flex boxes)
  sections/        component styles backing the primitives
```

## The portability rule

**Nothing in `styles/` or `components/primitives/` may import from Payload.**

That single constraint is what lets this folder plus `components/primitives/` be copied into a plain Next.js project and work unchanged. Blocks are the adapters that map Payload data onto primitives — that is where the Payload dependency belongs, and it is why blocks live in `src/blocks/` instead.

Verify it before shipping:

```bash
grep -rn "^import\|from '" src/components/primitives/ src/app/\(frontend\)/styles/ | grep -iE "payload|@/blocks"
```

Anything returned is a leak.

## Import order is load-bearing

`index.css` imports `tailwindcss` **first**. Do not move it.

1. It declares the cascade layer order — `@layer theme, base, components, utilities`. Without that first, everything below compiles *unlayered*, and unlayered CSS outranks every layered rule, so the reset would beat every utility.
2. A `@theme` override only wins if processed **after** Tailwind's defaults. `--breakpoint-*: initial` in `tokens/_breakpoints.css` silently does nothing when Tailwind is imported last.

## Two token tiers

This is the core of the system.

**`tokens/_palette.css` — primitive.** Raw colour values, and the only place a literal colour belongs. `--color-primary: #d6c1a1`.

**`tokens/_semantic.css` — roles.** What components actually use. `--color-surface`, `--color-on-surface`, `--color-action`.

Components reference **only** the semantic tier. Swapping the palette then re-brands the whole site without touching a component. A block that says `bg-primary` is welded to one colour; a block that says `bg-surface-muted` follows the brand.

Surfaces and their foregrounds are defined **as pairs** — picking `surface-muted` also determines `on-surface-muted`, so text can never end up unreadable on its own background.

### Never name a palette token after a CSS property

**A palette token is named for its value's position in a scale — `--color-neutral-900` — never for the property it happens to be used with.**

Tailwind already prefixes utilities with the property, so a property-named token stutters and then lies. A token called `--color-text-dark` generates `text-text-dark`, and nothing stops `bg-text-light` or `border-text-gray` — a name claiming "text" while setting a background or a border. All three compile without complaint.

Numbers also leave room to grow. `gray-dark`/`gray`/`gray-light` has nowhere to put a new mid-tone; a numbered ramp takes a `-400` without renaming anything.

Roles behave differently: the semantic tier *should* say what a token is for. `--color-on-surface` is right precisely because "on" names a relationship, not a property — it covers icons, borders and focus rings just as well as text.

### `@theme static`, not `@theme`

Plain `@theme` tree-shakes tokens nothing references in source. These tokens are a public contract meant to be overridden at runtime, so they must be emitted whether referenced or not. Every `@theme` under `tokens/` is `static` for this reason.

### Dark mode

`light-dark()` in the semantic tier, driven by `color-scheme: light dark` in `base/_reset.css`. No `.dark` class, no JavaScript, no flash. Next's Lightning CSS downlevels it to a `prefers-color-scheme` toggle for older browsers automatically.

Set the light value first, dark second: `light-dark(var(--color-neutral-0), #16181b)`.

## Breakpoints

`tokens/_breakpoints.css` clears Tailwind's defaults and defines four, **in pixels**:

| Prefix | Min width |
| --- | --- |
| `atSmall:` | 640px |
| `atMedium:` | 768px |
| `atLarge:` | 1024px |
| `atXLarge:` | 1280px |

`md:` and friends no longer exist — using one is a build error, not a silent no-op.

Pixels, not rems, deliberately: `html { font-size: 62.5% }` makes `1rem = 10px`, so Tailwind's rem-based defaults would scale to 62.5% and `md:` would fire at 480px instead of 768px.

## Naming

**`ui-` prefix** on every hand-written `@utility` — `ui-btn`, `ui-heading-1`, `ui-prose`. Keeps them from colliding with a future Tailwind class.

**No prefix** on utilities Tailwind generates from `@theme` tokens — `font-primary`, `bg-surface`, `p-4`. These belong to Tailwind's namespaces and cannot be prefixed without fighting the framework.

Some utilities are **modifiers** that only work alongside a base: `ui-btn ui-btn-cta`, `ui-btn ui-btn-outline`. Alone they restyle nothing.

## Elements vs. sections

The difference is which cascade layer they land in, and it matters.

**Elements and layouts** use `@utility` → `@layer utilities`.

**Sections** use plain CSS inside `@layer components`:

```css
@layer components {
  .ui-section[data-surface='muted'] {
    background-color: var(--color-surface-muted);
    color: var(--color-on-surface-muted);
  }
}
```

Two reasons sections are not `@utility`:

1. **Utilities must win.** In `@layer components` a section rule is always overridable by a `ui-*` utility. If both were utilities they would sit at equal specificity, where only source order decides — and that order is Tailwind's to choose, not ours.
2. **Runtime-composed classes survive.** Tailwind only emits a utility when its scanner finds the class name written literally in source. Authored CSS in a layer is always emitted.

## Primitives

`components/primitives/` maps props to the `data-*` attributes that `sections/_section.css` styles:

```tsx
<Section surface="muted" spacing="loose">
  <Container width="narrow">
    <Stack gap="md">
      <Heading level={2}>…</Heading>
    </Stack>
  </Container>
</Section>
```

`Section` stays full-width so its background runs edge to edge; `Container` supplies the measure and gutters.

`Heading` separates document level from visual size — `<Heading level={3} size={5}>` sits correctly in the outline while looking smaller.

**Class names must be literal strings.** Tailwind's scanner cannot resolve interpolation, so `gap-${size}` compiles to nothing. Use a lookup map, as `Stack` and `Heading` do.

## Adding to the system

**A new element utility** — create `elements/_badge.css` with `@utility ui-badge { … }`, import it in `index.css`. Build from tokens, never literals.

**A new token** — add it to the right `@theme static` in `tokens/`. Semantic tokens must point at palette tokens, not raw values.

**A new block** — create `src/blocks/<Name>/{config.ts,Component.tsx}` and add both to `src/blocks/registry.ts`. Nothing else changes: `payload.config.ts`, the Pages and Posts collections, `RenderBlocks`, and the rich-text converters all derive from that one file. Spread `appearanceField()` into the config so the block inherits the standard surface/spacing/width controls, then hand those to `<Section>`.

## Checking your work

`@theme static` means tokens appear even when unused, so a missing token *is* a real problem — unlike under plain `@theme`.

Inspect the compiled output without starting the dev server:

```bash
node --input-type=module -e "
import postcss from 'postcss'; import tw from '@tailwindcss/postcss'; import fs from 'node:fs';
const from='src/app/(frontend)/styles/index.css';
const r=await postcss([tw({optimize:false})]).process(fs.readFileSync(from,'utf8'),{from});
process.stdout.write(r.css);" > /tmp/out.css
```

Useful checks on `/tmp/out.css`:

- Every `@media` uses px — a stray `rem` breakpoint means Tailwind's defaults leaked back in.
- Every `var(--x)` has a matching `--x:` definition. The exceptions are `--font-montserrat`, `--font-vollkorn` and `--font-doto`, which `next/font` supplies on `<html>` at runtime.
- `@layer theme, base, components, utilities;` appears before any bare top-level rule.
