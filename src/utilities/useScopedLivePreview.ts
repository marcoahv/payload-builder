'use client'

import { useEffect, useRef, useState } from 'react'
import { isLivePreviewEvent, mergeData, ready } from '@payloadcms/live-preview'

type LivePreviewTarget =
  | { type: 'collection'; collectionSlug: string }
  | { type: 'global'; globalSlug: string }

/**
 * Like `useLivePreview`, but safe to mount alongside another live-preview
 * hook on the same page. `@payloadcms/live-preview`'s own `subscribe`/
 * `handleMessage` merge whatever `globalSlug`/`collectionSlug` the incoming
 * postMessage carries with no check against which document this hook
 * instance is watching, and keep their merge cache as a module-level
 * singleton shared by every subscription. Header renders in the root
 * layout on every route, including a Page's or Post's own live-preview
 * URL, so a Page/Post hook and Header's hook are mounted together the
 * moment either is being previewed - each must ignore messages meant for
 * the other. This hook filters by the exact collection/global slug it's
 * watching and keeps its merge cache in a local ref, using only
 * `@payloadcms/live-preview`'s stateless exports (`isLivePreviewEvent`,
 * `mergeData`, `ready`).
 */
export function useScopedLivePreview<T extends Record<string, any>>({
  target,
  initialData,
  serverURL,
  depth = 2,
}: {
  target: LivePreviewTarget
  initialData: T
  serverURL: string
  depth?: number
}): T {
  const [data, setData] = useState<T>(initialData)
  const previousDataRef = useRef<T>(initialData)
  const hasSentReadyMessage = useRef(false)
  const latestRequestId = useRef(0)
  const targetKey = target.type === 'global' ? target.globalSlug : target.collectionSlug

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (!isLivePreviewEvent(event, serverURL)) return

      const matchesTarget =
        target.type === 'global'
          ? event.data.globalSlug === target.globalSlug
          : event.data.collectionSlug === target.collectionSlug
      if (!matchesTarget) return

      // mergeData is a real network round trip, so back-to-back edits can
      // resolve out of order. Only the response to the most recently
      // dispatched message may commit - an older one lands here as a
      // no-op instead of rewinding `data` to a stale value.
      const requestId = ++latestRequestId.current
      const merged = await mergeData<T>({
        depth,
        serverURL,
        globalSlug: target.type === 'global' ? target.globalSlug : undefined,
        collectionSlug: target.type === 'collection' ? target.collectionSlug : undefined,
        incomingData: event.data.data,
        initialData: previousDataRef.current,
        locale: event.data.locale,
      })
      if (requestId !== latestRequestId.current) return
      previousDataRef.current = merged
      setData(merged)
    }

    window.addEventListener('message', onMessage)
    if (!hasSentReadyMessage.current) {
      hasSentReadyMessage.current = true
      ready({ serverURL })
    }
    return () => window.removeEventListener('message', onMessage)
    // `targetKey` already covers target.globalSlug/collectionSlug; depending
    // on `target` itself would re-subscribe every render for callers that
    // pass an inline object literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.type, targetKey, serverURL, depth])

  return data
}
