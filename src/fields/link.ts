import type { Field } from 'payload'

/**
 * A nav-style link that can point at either an internal `pages` document or
 * an arbitrary custom URL. Spread into any `navLinks`-shaped array field
 * alongside a sibling `newTab` checkbox.
 */
export const linkField = (): Field[] => [
  { name: 'label', type: 'text', required: true },
  {
    name: 'type',
    type: 'radio',
    defaultValue: 'reference',
    options: [
      { label: 'Page', value: 'reference' },
      { label: 'Custom URL', value: 'custom' },
    ],
    admin: { layout: 'horizontal' },
  },
  {
    name: 'reference',
    type: 'relationship',
    relationTo: 'pages',
    required: true,
    admin: {
      appearance: 'drawer',
      condition: (_, siblingData) => siblingData?.type === 'reference',
    },
  },
  {
    name: 'url',
    type: 'text',
    required: true,
    admin: {
      condition: (_, siblingData) => siblingData?.type === 'custom',
    },
  },
]
