import {Media} from '@/payload-types'

type Size = keyof NonNullable<Media['sizes']>

export function getMediaSize(doc: Media, size?: Size) {
  if (!size) return doc
  const sized = doc.sizes?.[size]
  // A size that couldn't be generated (e.g. an SVG, which Sharp can't
  // rasterize) still has an entry with a null `url`, not a missing entry -
  // fall back to the original file rather than rendering nothing.
  return sized?.url ? sized : doc
}