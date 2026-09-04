import { internalDocToHref } from '@/components/RichText/converters/internalLink'
import { type JSXConvertersFunction, LinkJSXConverter } from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { uploadConverter } from './uploadConverter'
import { blockComponents } from '@/blocks/registry'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NodeTypes = DefaultNodeTypes | SerializedBlockNode<any>

/**
 * Block converters are derived from the registry rather than listed here, so a
 * block registered in `src/blocks/registry.ts` becomes usable inside rich text
 * automatically — no second place to update.
 *
 * Built inside the function, not at module scope. The import graph is a cycle
 * — registry → RichTextBlock → RichText → this file → registry — so reading
 * `blockComponents` while this module is still evaluating throws
 * "Cannot access 'blockComponents' before initialization". Deferring the read
 * to render time lets the cycle resolve.
 */
const buildBlockConverters = () =>
  Object.fromEntries(
    Object.entries(blockComponents).map(([slug, Component]) => [
      slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ node }: { node: SerializedBlockNode<any> }) => <Component {...node.fields} />,
    ]),
  )

export const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  upload: ({ node }) => {
    return uploadConverter({ uploadNode: node })
  },
  blocks: buildBlockConverters(),
})
