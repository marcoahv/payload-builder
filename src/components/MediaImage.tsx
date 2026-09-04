import Image from 'next/image'
import type { Media } from '@/payload-types'
import { getMediaSize } from '@/utilities/getMediaSize'

export type MediaImageProps = {
  image: Media
  size?: keyof NonNullable<Media['sizes']>
  className?: string
  imgClassName?: string
  priority?: boolean
  /** Radius token to apply. `none` for full-bleed images. */
  radius?: 'none' | 'sm' | 'md' | 'lg'
}

const RADIUS = {
  none: '',
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
} as const

/**
 * Renders a Payload media doc at the right generated size, with its blur
 * placeholder when one exists.
 *
 * Payload-typed, so it lives here rather than in `primitives/` — the
 * portability rule keeps that folder free of Payload imports.
 */
export function MediaImage({
  image,
  size,
  className,
  imgClassName,
  priority,
  radius = 'md',
}: MediaImageProps) {
  const resolved = getMediaSize(image, size)
  if (!resolved?.url) return null

  // placeholder="blur" throws without blurDataURL, and the hook that generates
  // it only runs on upload — older media may predate it.
  const blur = image.blurDataUrl ?? undefined

  return (
    <div className={className}>
      <Image
        className={['ui-img h-auto', RADIUS[radius], imgClassName].filter(Boolean).join(' ')}
        src={resolved.url}
        alt={image.alt || ''}
        width={resolved.width ?? 1280}
        height={resolved.height ?? 720}
        blurDataURL={blur}
        placeholder={blur ? 'blur' : 'empty'}
        priority={priority}
      />
    </div>
  )
}
