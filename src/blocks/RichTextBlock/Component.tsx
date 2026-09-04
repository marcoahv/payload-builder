import { Section, Container } from '@/components/primitives'
import { RichText } from '@/components/RichText'
import type { RichTextBlock as RichTextBlockProps } from '@/payload-types'

/** Lexical prose, rendered through the shared converters. */
export function RichTextBlock(props: RichTextBlockProps) {
  const { surface, spacing, width, content } = props
  if (!content) return null

  return (
    <Section surface={surface} spacing={spacing}>
      <Container width={width ?? 'narrow'}>
        <div className="ui-prose">
          <RichText data={content} />
        </div>
      </Container>
    </Section>
  )
}
