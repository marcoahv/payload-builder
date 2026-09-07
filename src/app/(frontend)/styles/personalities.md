# Website personality guide

A starting point for hand-editing `_base-tokens.css` and `_alias-tokens.css`
in a new project. Based on the Website-Personalities-Framework
(`theory-lectures.pdf`, "Web Design Rules and Framework" module, lecture 26):
pick one of 7 personalities based on the "vibe" a site should transmit, then
apply that personality's traits across each design ingredient.

Together, `_base-tokens.css` (raw values — colors, typography scale,
border-radius, plus the section/header rhythm that's one small slice of the
whitespace/layout ingredient) and `_alias-tokens.css` (shadows, plus the
semantic roles built from the palette) encode 4 of these ingredients as
literal or derived tokens: typography, colors, shadows, and border-radius.
Whitespace/layout is only partly a token here - the richer structural choices
below (grid, column count, creative arrangement) aren't CSS custom
properties, so along with images/illustrations and icons they're captured as
guidance only, not
as a token to edit.

Good web design isn't subjective: hundreds of well-designed sites were
deconstructed into these 7 repeatable patterns, so picking one and applying it
consistently beats guessing at each ingredient independently.

## 1. Serious/Elegant

**Industries:** Real estate, high fashion, jewelry, luxury products or services.

Design for luxury and elegance, based on thin serif typefaces, golden or
pastel colors, and big high-quality images.

- **Typography** — Serif typefaces, especially in headings; light font weight;
  small body font size.
- **Colors** — Gold, pastel colors, black, dark blue or grey.
- **Shadows** — Usually none.
- **Border-radius** — Usually none.
- **Images** — Big, high-quality images to feature elegant, expensive products.
- **Icons** — Usually none, but thin icons and lines may be used.

## 2. Minimalist/Simple

**Industries:** Fashion, portfolios, minimalism companies, software startups.

Focuses on the essential text content, using small or medium-sized
sans-serif black text, lines, and few images and icons.

- **Typography** — Boxy/squared sans-serif typefaces; small body font sizes.
- **Colors** — Usually black or dark grey on a pure white background; usually
  just one color throughout the design.
- **Shadows** — Usually none.
- **Border-radius** — Usually none.
- **Images** — Few images, which can add some color to the design; usually no
  illustrations, but if used, just black.
- **Icons** — Usually none, but small simple black icons may be used.

## 3. Plain/Neutral

**Industries:** Well-established corporations, companies that don't want to
make an impact through design.

Design that gets out of the way by using very neutral and small typefaces,
and a boxy, structured, condensed layout.

- **Typography** — Neutral-looking sans-serif typefaces; text is usually
  small and doesn't have visual impact.
- **Colors** — Safe colors, nothing too bright or too washed-out; blues and
  blacks are common.
- **Shadows** — Usually none.
- **Border-radius** — Usually none.
- **Images** — Frequently used, but usually in a small format.
- **Icons** — Usually none, but simple icons may be used.

## 4. Bold/Confident

**Industries:** Digital agencies, software startups, travel, "strong" companies.

Design that makes an impact, by featuring big and bold typography, paired
with confident use of big colored blocks.

- **Typography** — Boxy/squared sans-serif typefaces; big and bold
  typography, especially headings; uppercase headings are common.
- **Colors** — Usually multiple bright colors; big color blocks/sections
  used to draw attention.
- **Shadows** — Usually none.
- **Border-radius** — Usually none.
- **Images** — Lots of big images.
- **Icons** — Usually none.

## 5. Calm/Peaceful

**Industries:** Healthcare, all products with a focus on consumer well-being.

For products and services that care about the consumer, transmitted through
calming pastel colors and soft serif headings.

- **Typography** — Soft serif typefaces frequently used for headings, but
  sans-serif headings might be used too (e.g. for software products).
- **Colors** — Pastel/washed-out: light oranges, yellows, browns, greens, blues.
- **Shadows** — Usually none, but might be used sparingly.
- **Border-radius** — Some border-radius is usual.
- **Images** — Images and illustrations are usual, matching the calm palette.
- **Icons** — Quite frequent.

## 6. Startup/Upbeat

**Industries:** Software startups, and other modern-looking companies.

Widely used in startups: medium-sized sans-serif typefaces, light-grey
backgrounds, and rounded elements.

- **Typography** — Medium-sized headings (not too large), usually one
  sans-serif typeface across the whole design; a tendency for lighter text
  colors.
- **Colors** — Blues, greens, and purples are widely used; lots of light
  (mainly gray) backgrounds; gradients are also common.
- **Shadows** — Subtle shadows are frequent; glows are becoming modern.
- **Border-radius** — Very common.
- **Images** — Always used; 3D illustrations are modern; patterns and shapes
  sometimes add visual detail.
- **Icons** — Very frequent.

## 7. Playful/Fun

**Industries:** Child products, animal products, food.

Colorful and round designs, fueled by creative elements like hand-drawn
icons or illustrations, animations, and fun language.

- **Typography** — Round and creative (e.g. handwritten) sans-serif
  typefaces are frequent; centered text is more common.
- **Colors** — Multiple colors frequently used for a colorful layout, across
  both backgrounds and text.
- **Shadows** — Subtle shadows are quite common, but not always used.
- **Border-radius** — Very common.
- **Images** — Images, hand-drawn (or 3D) illustrations, and geometric
  shapes/patterns are all very frequently used.
- **Icons** — Very frequent, often in a hand-drawn style.

## Trait injection: blending neighboring personalities

The 7 personalities aren't mutually exclusive buckets. They sit on a
bold/calm × serious/playful quadrant, and a primary choice can borrow 1-2
traits from a neighboring personality to fit a brand more precisely than any
single personality alone:

- **Startup/Upbeat + Bold/Confident** — big and bold typography, big color
  blocks.
- **Bold/Confident + Calm/Peaceful** — headings using soft serif typefaces,
  illustrations in calming pastel colors.
- **Bold/Confident + Playful/Fun** — irregular round design elements,
  hand-drawn icons and patterns.

When applying this to `_base-tokens.css`/`_alias-tokens.css`: pick one personality's ingredients as
the default, then override just the 1-2 tokens the injected trait touches
(for example, borrowing Calm/Peaceful's border-radius into an otherwise
Bold/Confident `--radius-*` scale) rather than mixing every ingredient from
both.
