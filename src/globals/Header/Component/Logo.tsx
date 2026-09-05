import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Media } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'

/**
 * Surface-aware logo.
 *
 * Renders the mark as a CSS mask filled with currentColor rather than as an
 * <img>, so it takes the colour of whatever surface it sits on — the header's
 * own, or the section beneath it when the bar is transparent. One asset covers
 * every surface and both colour schemes; see elements/_logo.css.
 *
 * The URL is CMS data, so it arrives as an inline custom property. That is
 * dynamic content rather than a styling decision — no colours or sizes are set
 * here.
 */
export function Logo({ logo, className }: { logo?: Media | string | null; className?: string }) {
  if (!isDoc<Media>(logo) || !logo.url) return null

  const style = {
    '--logo-src': `url("${logo.url}")`,
    ...(logo.width && logo.height ? { '--logo-ratio': `${logo.width} / ${logo.height}` } : {}),
  } as CSSProperties

  return (
    <Link className={className} href="/" aria-label="Home">
      {/* aria-hidden: the link already carries the accessible name, and without
          this the logo is announced twice. */}
      <span className="ui-logo-mark" aria-hidden="true" style={style} />
    </Link>
  )
}
