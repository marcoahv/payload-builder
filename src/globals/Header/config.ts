import { type GlobalConfig } from 'payload'
import { revalidateGlobal } from '@/globals/hooks/revalidateGlobal'
import { headerAppearanceField } from '@/fields/appearance'

export const Header: GlobalConfig = {
  slug: 'header',
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    ...headerAppearanceField(),
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'logoDark',
      label: 'Logo (dark mode)',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional. Shown when the visitor prefers a dark colour scheme. Falls back to the main logo.',
      },
    },
    {
      name: 'icon',
      label: 'Site Icon',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          "The small mark used as the browser tab favicon — distinct from the logo above. Usually square, e.g. 32×32 or 64×64.",
      },
    },
    {
      name: 'iconDark',
      label: 'Site Icon (dark mode)',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          "Optional. Shown when the visitor's browser prefers a dark colour scheme. Falls back to the main icon.",
      },
    },
    {
      name: 'navLinks',
      label: 'Nav Links',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      labels: { singular: 'Navigation Link', plural: 'Navigation Links' },
      admin: {
        components: {
          RowLabel: {
            path: '@/custom/label/Component.tsx#ArrayRowLabel',
          },
        },
      },
      fields: [
        {
          name: 'link',
          type: 'relationship',
          relationTo: 'pages',
          required: true,
          admin: {
            appearance: 'drawer',
          },
        },
        {
          name: 'newTab',
          label: 'Open in a new tab',
          type: 'checkbox',
        },
      ],
    },
    {
      name: 'socialLinks',
      label: 'Social Links',
      type: 'array',
      maxRows: 6,
      labels: { singular: 'Social Link', plural: 'Social Links' },
      fields: [
        {
          name: 'platform',
          label: 'Platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'X / Twitter', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
            { label: 'YouTube', value: 'youtube' },
          ],
        },
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
        },
        {
          name: 'icon',
          label: 'Icon',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'ctaButtons',
      label: 'Call to Action Buttons',
      type: 'array',
      maxRows: 2,
      labels: { singular: 'Button', plural: 'Buttons' },
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
