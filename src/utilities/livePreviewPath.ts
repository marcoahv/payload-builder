type LivePreviewPathInput =
  | { type: 'collection'; collectionSlug: string; docSlug?: string | null }
  | { type: 'global' }

/**
 * Resolves the frontend path Live Preview should point at, or undefined to
 * disable the button for that document. The 'blog'-slug Pages document is
 * excluded on purpose: its route (`/blog`) is rendered by a separate
 * template not wired for live preview.
 */
export function livePreviewPath(input: LivePreviewPathInput): string | undefined {
  if (input.type === 'global') return '/'

  const { collectionSlug, docSlug } = input

  if (collectionSlug === 'posts') {
    return docSlug ? `/blog/${docSlug}` : undefined
  }

  if (collectionSlug === 'pages') {
    if (!docSlug || docSlug === 'blog') return undefined
    return docSlug === 'home' ? '/' : `/${docSlug}`
  }

  return undefined
}
