import React from 'react'
import './styles/index.css'
import { GoogleTagManager } from '@next/third-parties/google'
import { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { Header } from '@/components/Header'
import { isDoc } from '@/utilities/isDoc'
import type { Media } from '@/payload-types'
import { fontVariables } from './fonts'

const FALLBACK_NAME = 'Site Builder'
const FALLBACK_DESCRIPTION = 'A site built with the site builder.'

/** Builds one favicon entry from a header icon field, or null if unset. */
function iconDescriptor(icon: string | Media | null | undefined, media?: string) {
  if (!isDoc<Media>(icon) || !icon.url) return null
  return {
    url: icon.url,
    type: icon.mimeType ?? undefined,
    sizes: icon.width && icon.height ? `${icon.width}x${icon.height}` : undefined,
    media,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  // depth 1 so header.icon / header.iconDark resolve to full Media docs
  // rather than bare relationship ids.
  const [settings, header] = await Promise.all([
    getCachedGlobal('settings')(),
    getCachedGlobal('header', 1)(),
  ])

  // Light entry carries no media query, so it also covers dark mode when no
  // dark-mode icon was uploaded — there is nothing to override it with.
  const icons = [
    iconDescriptor(header?.icon),
    iconDescriptor(header?.iconDark, '(prefers-color-scheme: dark)'),
  ].filter((icon): icon is NonNullable<typeof icon> => icon !== null)

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
    description: settings.siteDescription || FALLBACK_DESCRIPTION,
    title: {
      default: settings.siteName || FALLBACK_NAME,
      template: `%s | ${settings.siteName || FALLBACK_NAME}`,
    },
    ...(icons.length > 0 ? { icons } : {}),
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const settings = await getCachedGlobal('settings', 1)()

  // The .variable classes define --font-montserrat / --font-vollkorn /
  // --font-doto on <html>; the font-primary utility resolves against them.
  return (
    <html lang="en" className={`${fontVariables} font-primary`}>
      {settings.gtmCode && <GoogleTagManager gtmId={settings.gtmCode} />}
      <body>
        <Header />
        {/* No offset class here on purpose: whether <main> needs one — and how
            much — depends on the header's own position and height, both
            editor-chosen. styles/sections/_header.css applies it via a
            body:has() rule keyed off the header's data attributes, so a fixed
            header always gets the right padding and a sticky/static one
            correctly gets none. */}
        <main>{children}</main>
        {/* TODO(phase 7): restore Footer from src/_legacy/. */}
      </body>
    </html>
  )
}
