import {
  type BlockSlug,
  type CollectionConfig,
  slugField,
} from 'payload'
import { SEOField } from '@/fields/seo/config'
import { appearanceField } from '@/fields/appearance'
import { blockSlugs } from '@/blocks/registry'
import { deletePage, updatePage } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  defaultPopulate: {
    slug: true,
    title: true,
  },
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [updatePage],
    afterDelete: [deletePage],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    slugField(),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Information',
          fields: [
            {
              type: 'text',
              name: 'title',
              required: true,
            },
            {
              type: 'upload',
              name: 'featuredImage',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          label: 'Layout',
          fields: [
            {
              name: 'blocks',
              type: 'blocks',
              // Derived from the registry, so a newly registered block becomes
              // available here automatically. Blocks are defined once in
              // payload.config.ts and referenced by slug.
              blockReferences: blockSlugs as BlockSlug[],
              blocks: [],
            },
          ],
        },
        {
          label: 'Appearance',
          admin: {
            // Only the "blog" page reads heroAppearance/listAppearance
            // (see blog/page.tsx) — hide the whole tab everywhere else
            // rather than leave editors staring at an empty one.
            condition: (data) => data?.slug === 'blog',
          },
          fields: [
            {
              type: 'group',
              name: 'heroAppearance',
              label: 'Hero section',
              admin: {
                description:
                  'The page title and featured/latest post preview at the top of the blog listing.',
              },
              fields: appearanceField(),
            },
            {
              type: 'group',
              name: 'listAppearance',
              label: 'Post list section',
              admin: {
                description:
                  'The "More Posts" grid, category filter, and pagination below the hero.',
              },
              fields: appearanceField(),
            },
          ],
        },
        {
          label: 'SEO',
          fields: [SEOField],
        },
      ],
    },
  ],
}
