'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { RichText } from '@/components/RichText'
import { Section, Container, Heading, Stack } from '@/components/primitives'
import { PostPreview } from '@/components/PostPreview'
import { getServerSideURL } from '@/utilities/getUrl'
import type { Post } from '@/payload-types'

/**
 * Renders only the parts of the post detail page that depend on the post's
 * own fields. Breadcrumbs, PostNavigation, and related posts stay
 * server-rendered in page.tsx - they're derived from other documents at page
 * load, not the currently-edited post, so there's nothing on them to
 * live-update.
 */
export function PostClient({ initialData }: { initialData: Post }) {
  const { data } = useLivePreview<Post>({
    initialData,
    serverURL: getServerSideURL(),
    depth: 2,
  })

  return (
    <>
      <Section surface={data.headerAppearance?.surface} spacing={data.headerAppearance?.spacing}>
        <Container width={data.headerAppearance?.width}>
          <Stack gap="lg">
            <Heading level={1}>{data.title}</Heading>
            <PostPreview post={data} variant="header" showLink={false} imageSize="fullSize" />
          </Stack>
        </Container>
      </Section>
      <Section surface={data.bodyAppearance?.surface} spacing={data.bodyAppearance?.spacing}>
        <Container width={data.bodyAppearance?.width}>
          <div className="ui-prose">
            <RichText data={data.body} />
          </div>
        </Container>
      </Section>
    </>
  )
}
