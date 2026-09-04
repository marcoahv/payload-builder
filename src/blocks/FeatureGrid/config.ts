import type { Block } from 'payload'
import { appearanceField } from '@/fields/appearance'

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  labels: { singular: 'Feature Grid', plural: 'Feature Grids' },
  fields: [
    ...appearanceField(),
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: 'Two', value: '2' },
        { label: 'Three', value: '3' },
        { label: 'Four', value: '4' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      required: true,
      labels: { singular: 'Feature', plural: 'Features' },
      admin: {
        components: {
          RowLabel: '@/custom/label/Component.tsx#CardRowLabel',
        },
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
