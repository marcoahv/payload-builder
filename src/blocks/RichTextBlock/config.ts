import type { Block } from 'payload'
import { appearanceField } from '@/fields/appearance'

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  fields: [
    ...appearanceField(),
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
  ],
}
