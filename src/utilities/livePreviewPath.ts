type LivePreviewPathInput =
  | { type: 'collection'; collectionSlug: string; docSlug?: string | null }
  | { type: 'global' }

/**
 * Resolves the frontend path Live Preview should point at, or undefined to
 * disable the button for that document.
 */
export function livePreviewPath(input: LivePreviewPathInput): string | undefined {
  if (input.type === 'global') return '/'

  const { collectionSlug, docSlug } = input

  if (collectionSlug === 'posts') {
    return docSlug ? `/blog/${docSlug}` : undefined
  }

  if (collectionSlug === 'pages') {
    if (!docSlug) return undefined
    if (docSlug === 'blog') return '/blog'
    return docSlug === 'home' ? '/' : `/${docSlug}`
  }

  return undefined
}
