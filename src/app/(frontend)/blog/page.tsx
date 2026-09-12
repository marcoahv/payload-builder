import { PaginatedDocs } from 'payload'
import React from 'react'
import { notFound } from 'next/navigation'
import type { Category, Post } from '@/payload-types'
import { SearchParamsProps } from '@/components/Pagination'
import { Metadata } from 'next'
import { generateMeta } from '@/utilities/generateMeta'
import { getPayloadClient } from '@/utilities/getPayloadClient'
import { unstable_cache } from 'next/cache'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { BlogPageClient } from './BlogPageClient'

type Props = {
  searchParams: Promise<{
    page?: string
    category?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await queryBlogPage()
  if (!page) return { title: 'Blog not found' }
  const settings = await getCachedGlobal('settings')()
  return generateMeta({ doc: page, settings })
}

export default async function Page({ searchParams }: Props) {
  const { page: pageParam, category: categoryParam } =
    await searchParams
  const currentPage = Number(pageParam) || 1

  const [page, categories, featuredBlog, blogs] = await Promise.all([
    queryBlogPage(),
    queryAllCategories(),
    queryFeaturedBlog(),
    queryBlogs(currentPage, categoryParam),
  ])

  if (!page) return notFound()

  const currentSearchParams: SearchParamsProps = {
    category: categoryParam,
  }

  const heroPost = featuredBlog ?? blogs.docs[0]

  return (
    <BlogPageClient
      initialData={page}
      categories={categories}
      heroPost={heroPost}
      featuredBlog={featuredBlog}
      blogs={blogs}
      currentPage={currentPage}
      categoryParam={categoryParam}
      searchParams={currentSearchParams}
    />
  )
}

const queryBlogPage = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const page = await payload.find({
      collection: 'pages',
      limit: 1,
      where: {
        slug: {
          equals: 'blog',
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
        title: true,
        meta: true,
        featuredImage: true,
        blocks: true,
        blogBlocks: true,
      },
    })
    return page.docs?.[0] || null
  },
  ['blog-page'],
  {
    tags: ['page_blog'],
  },
)

const queryAllCategories = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    return await payload.find({
      collection: 'categories',
      limit: 0,
      select: {
        name: true,
        slug: true,
        relatedPosts: true,
      },
      populate: {
        posts: {
          slug: true,
          title: true,
          featured: true,
        },
      },
    })
  },
  ['blog-categories'],
  {
    tags: ['blog'],
  },
) as () => Promise<PaginatedDocs<Category>>

const queryFeaturedBlog = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const featuredBlog = await payload.find({
      collection: 'posts',
      limit: 1,
      where: {
        featured: {
          equals: true,
        },
      },
      populate: {
        categories: {
          name: true,
          slug: true,
        },
        media: {
          sizes: {
            fullSize: true,
            card: true,
          },
          height: true,
          width: true,
          blurDataUrl: true,
          url: true,
          filename: true,
        },
      },
      select: {
        createdAt: false,
        updatedAt: false,
        generateSlug: false,
      },
    })
    return featuredBlog.docs?.[0] || null
  },
  [],
  {
    tags: ['blog'],
  },
) as () => Promise<Post | null>

const queryBlogs = unstable_cache(
  async (currentPage, categoryParam) => {
    const payload = await getPayloadClient()
    return await payload.find({
      collection: 'posts',
      limit: 8,
      page: currentPage,
      ...(categoryParam && {
        where: {
          'category.slug': {
            equals: categoryParam,
          },
        },
      }),
      populate: {
        categories: {
          name: true,
          slug: true,
        },
        media: {
          sizes: {
            fullSize: true,
            card: true,
          },
          height: true,
          width: true,
          blurDataUrl: true,
          url: true,
          filename: true,
        },
      },
      select: {
        createdAt: false,
        updatedAt: false,
        generateSlug: false,
      },
      sort: '-date',
    })
  },
  [],
  {
    tags: ['blog'],
  },
) as (
  currentPage: number,
  categoryParam?: string,
) => Promise<PaginatedDocs<Post>>
