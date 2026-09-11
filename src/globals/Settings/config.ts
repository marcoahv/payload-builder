import { type GlobalConfig } from 'payload'
import { revalidateGlobal } from '@/globals/hooks/revalidateGlobal'

export const Settings: GlobalConfig = {
  slug: 'settings',
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Site Builder',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      defaultValue:
        'A site built with the site builder.',
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'text',
      name: 'gtmCode',
      label: 'Google Tag Manager',
      admin: {
        position: 'sidebar',
        description: 'Add your Google Tag Manager Code (GTM-XXXXXX)',
      },
    },
    {
      name: 'imageRadius',
      type: 'select',
      label: 'Image Corner Radius',
      defaultValue: 'md',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
        { label: 'Extra Large', value: 'xl' },
      ],
      admin: {
        description: 'Controls how rounded image corners are across the site.',
      },
    },
  ],
}
