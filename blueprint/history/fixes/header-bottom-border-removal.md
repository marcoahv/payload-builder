# Current Feature

**Title:** Header bottom-border removal
**Type:** Fix
**Status:** verified
**Branch:** `fix/header-bottom-border-removal`

## The problem

`src/globals/Header/Component/_header.css:88-91` sets a bottom border on the
header bar itself:

```css
.header[data-transparent='false'],
.header[data-transparent='true'].header--scrolled {
  border-block-end: 1px solid var(--color-border);
}
```

This draws a 1px line under the whole header bar whenever the header isn't
transparent, or once the page scrolls past the top (the `--scrolled`
overlay state). The user wants this border gone. Confirmed this is the
header bar's own border, not the separate `.header__nav` bottom border used
on the mobile dropdown drawer (`_header.css:264`/`289`) — that one stays
untouched.

## The fix

Delete the whole rule block at `_header.css:88-91` (both selectors and the
declaration). It's a standalone block that nothing else depends on, so
removing it entirely drops the border for both cases with no dead selector
left behind.

Must not break: every other header behavior (surface colors, transparency,
scrolled-overlay background/blur, position, height) is untouched — only the
border declaration goes.

## Build steps

- [x] 1. **Delete the border-block-end rule in `_header.css`.** Remove lines
  88-91 (the `.header[data-transparent='false'], .header[data-transparent='true'].header--scrolled`
  block) entirely. **Done when:** `npm run build` passes, and in the browser
  the header shows no bottom border in both the non-transparent and
  scrolled-transparent states, in both light and dark mode, while the
  mobile nav drawer's own border is unaffected.

## Verify

`npm run dev`, load a page with `data-transparent="false"` and one with
`data-transparent="true"`: confirm no line under the header bar in either
case, before and after scrolling. Open the mobile hamburger menu and
confirm its dropdown border is still there, unchanged.
