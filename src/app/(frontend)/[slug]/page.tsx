import { getPayload } from 'payload'
import React from 'react'
import config from '@/payload.config'
import { Media } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { generateMeta } from '@/utilities/generateMeta'
import { unstable_cache } from 'next/cache'
import { Page as PageType } from '@/payload-types'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPayloadClient } from '@/utilities/getPayloadClient'
import { PageClient } from './PageClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { docs } = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        not_equals: 'blog',
      },
    },
    limit: 0,
  })
  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug = 'home' } = await params
  const payload = await getPayloadClient()
  const doc = await payload
    .find({
      collection: 'pages',
      limit: 1,
      where: { slug: { equals: slug } },
      populate: {
        media: {
          sizes: {
            og: true,
          },
        },
      },
    })
    .then((res) => res.docs[0])

  if (!doc) return { title: 'Page not found' }
  const settings = await getCachedGlobal('settings')()
  return generateMeta({ doc, settings })
}

export default async function Page({ params }: PageProps) {
  const { slug = 'home' } = await params

  const page = await queryPageBySlug({ slug })

  if (!page) {
    return notFound()
  }

  return <PageClient initialData={page} />
}

/**
 * Cached page lookup, tagged per slug.
 *
 * The tag is what makes edits show up. An unstable_cache entry can only be
 * invalidated by revalidateTag() with a matching tag, or by a time-based
 * `revalidate` — revalidatePath() does not reach it. Without one, this cached
 * indefinitely and survived dev-server restarts (the entry lives in
 * .next/cache), so saving a page in the admin changed the database but never
 * the rendered page.
 *
 * Mirrors getCachedGlobal() in utilities/getGlobals.ts, whose `global_<slug>`
 * tag is why header and settings edits have always propagated correctly.
 * Paired with revalidateTag(`page_<slug>`) in collections/Pages/hooks.
 */
const queryPageBySlug = ({ slug }: { slug: string }) =>
  unstable_cache(
    async () => {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })
      const page = await payload.find({
        collection: 'pages',
        limit: 1,
        where: {
          slug: {
            equals: slug,
          },
        },
        populate: {
          media: {
            filename: true,
            width: true,
            height: true,
            url: true,
            alt: true,
            blurDataUrl: true,
            sizes: {
              fullSize: true,
              card: true,
              og: true,
            },
          },
        },
        select: {
          createdAt: false,
          updatedAt: false,
          generateSlug: false,
        },
      })
      return (page.docs?.[0] as PageType | undefined) || null
    },
    ['page-by-slug', slug],
    { tags: [`page_${slug}`] },
  )()
