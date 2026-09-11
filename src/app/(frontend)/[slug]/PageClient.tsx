'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { Blocks } from '@/blocks'
import { getServerSideURL } from '@/utilities/getUrl'
import type { Page as PageType } from '@/payload-types'

export function PageClient({ initialData }: { initialData: PageType }) {
  const { data } = useLivePreview<PageType>({
    initialData,
    serverURL: getServerSideURL(),
    depth: 2,
  })

  return (
    <div>
      <Blocks blocks={data.blocks} />
    </div>
  )
}
