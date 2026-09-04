import type { Block } from 'payload'
import { appearanceField } from '@/fields/appearance'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    ...appearanceField(),
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'subheading',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'layout',
      type: 'radio',
      defaultValue: 'imageRight',
      options: [
        { label: 'Image right', value: 'imageRight' },
        { label: 'Image left', value: 'imageLeft' },
        { label: 'Text only', value: 'textOnly' },
      ],
    },
    {
      name: 'links',
      type: 'array',
      maxRows: 2,
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Outline', value: 'outline' },
          ],
        },
      ],
    },
  ],
}
