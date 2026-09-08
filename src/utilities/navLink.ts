import { isDoc } from '@/utilities/isDoc'
import type { Page } from '@/payload-types'

/** Shared by Header and Footer nav rendering: a nav item is either an
 * internal page reference or a custom URL. Returns null when the item has
 * no resolvable destination (e.g. an unpopulated reference). */
export function hrefForNavLink(item: {
  type?: string | null
  url?: string | null
  reference?: (number | string) | Page | null
}): string | null {
  if (item.type === 'custom') return item.url ?? null
  if (!isDoc<Page>(item.reference)) return null
  return item.reference.slug === 'home' ? '/' : `/${item.reference.slug}`
}
