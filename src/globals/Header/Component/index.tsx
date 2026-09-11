import { getCachedGlobal } from '@/utilities/getGlobals'
import { HeaderClient } from './HeaderClient'

/**
 * Server half of the header: fetches the `header` global and hands it to the
 * client component.
 *
 * depth 2 resolves the nested docs — a navLink's related page (for its title
 * and slug) and each social link's uploaded icon.
 */
export async function Header() {
  const header = await getCachedGlobal('header', 2)()

  if (!header) return null

  return <HeaderClient initialHeader={header} />
}
