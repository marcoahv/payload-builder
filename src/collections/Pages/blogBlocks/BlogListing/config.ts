import type { Block } from 'payload'
import { appearanceField } from '@/fields/appearance'

/**
 * Blog-only, not part of the shared block registry (src/blocks/registry.ts) -
 * see current-feature.md's Goal for why. Renders the paginated,
 * category-filterable grid of non-featured posts from the page's own query.
 */
export const BlogListing: Block = {
  slug: 'blogListing',
  interfaceName: 'BlogListingBlock',
  labels: { singular: 'Blog Listing', plural: 'Blog Listings' },
  fields: [
    ...appearanceField(),
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'More Posts',
    },
  ],
}
