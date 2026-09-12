import type { Block } from 'payload'
import { appearanceField } from '@/fields/appearance'

/**
 * Blog-only, not part of the shared block registry (src/blocks/registry.ts) -
 * see current-feature.md's Goal for why. Renders whichever post the page's
 * own query already determined is "featured" or "latest"; not
 * editor-configurable beyond appearance.
 */
export const FeaturedPost: Block = {
  slug: 'featuredPost',
  interfaceName: 'FeaturedPostBlock',
  labels: { singular: 'Featured Post', plural: 'Featured Posts' },
  fields: [...appearanceField()],
}
