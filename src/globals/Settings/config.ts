import { type GlobalConfig } from 'payload'
import { revalidateGlobal } from '@/globals/hooks/revalidateGlobal'

export const Settings: GlobalConfig = {
  slug: 'settings',
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      type: 'text',
      name: 'gtmCode',
      label: 'Google Tag Manager',
      admin: {
        description: 'Add your Google Tag Manager Code (GTM-XXXXXX)',
      },
    },
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Site Builder',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      defaultValue:
        'A site built with the site builder.',
    },
  ],
}
