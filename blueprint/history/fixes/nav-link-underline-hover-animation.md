# Current Feature

**Title:** Nav link hover underline: spacing + animation
**Type:** Fix
**Status:** verified
**Branch:** `fix/nav-link-underline-hover-animation`

## The problem

`.ui-link` (`src/app/(frontend)/styles/elements/_link.css:1-26`) is the shared
utility behind every Header and Footer nav link
(`src/globals/Header/Component/HeaderClient.tsx:139,162`,
`src/globals/Footer/Component/index.tsx:46`). On hover it currently:

```css
transition: color 0.3s ease 0s;
/* ... */
&:hover {
  color: color-mix(in srgb, currentColor 70%, transparent);
  text-decoration: underline;
}
```

Two problems:

- `text-decoration: underline` only exists in the `&:hover` block, so the
  underline pops in/out instantly — `text-decoration-line` isn't an
  animatable property, unlike `color`, which fades smoothly over the
  declared `0.3s`.
- The underline sits flush against the text's baseline with no offset, so
  there's no visual padding between the glyphs and the line (the project's
  prose links already use `text-underline-offset: 0.2em` for this, in
  `_prose.css:51-55`).

## The fix

Make the underline present at all times but invisible by default, and
transition its color the same way `color` already transitions — so it fades
in/out in sync with the text-color hover animation instead of toggling
abruptly. Add `text-underline-offset` to match the existing prose-link
spacing convention.

In `src/app/(frontend)/styles/elements/_link.css`, on `.ui-link`:

- Move `text-decoration: underline;` out of `&:hover` into the base rule,
  and add `text-decoration-color: transparent;` alongside it.
- Add `text-underline-offset: 0.2em;` to the base rule (same value
  `_prose.css` uses).
- Extend the `transition` list to include `text-decoration-color 0.3s ease
  0s` (keep the existing `color 0.3s ease 0s`).
- In `&:hover`, replace `text-decoration: underline;` with
  `text-decoration-color: currentColor;` (`currentColor` re-resolves against
  the animating `color` value each frame, so the underline fades in with the
  same dimmed tone the text is transitioning to).

Must not break: the link's default (non-hover) appearance stays visually
underline-free (transparent decoration color renders as none), and the
existing color-fade timing/easing stays identical.

## Build steps

- [x] 1. **Update `.ui-link`'s hover underline in `_link.css`** per the fix
  above. **Done when:** `npm run build` passes, and in the browser a Header
  nav link and a Footer nav link both show a smoothly fading-in underline
  (not an instant pop) with visible gap between text and line, while
  unhovered links show no underline.

## Verify

`npm run dev`, open the site, hover a Header nav link and a Footer nav link:
the underline should fade in together with the color change (not snap on
instantly) and sit with a small gap below the text, in both light and dark
mode. Un-hovering should fade it back out.
