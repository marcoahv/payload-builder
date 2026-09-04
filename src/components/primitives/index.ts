/**
 * Layout primitives — the portable presentation layer.
 *
 * PORTABILITY RULE: nothing in this folder may import from Payload, from
 * `@/payload-types`, or from `@/blocks`. These components take plain props
 * only, so this folder and `app/(frontend)/styles/` can be copied into any
 * Next.js project and work unchanged.
 *
 * Blocks are the adapters that map Payload data onto these primitives; that is
 * where the Payload dependency belongs.
 */

export { Section, type SectionProps, type Surface, type Spacing } from './Section'
export { Container, type ContainerProps, type Width } from './Container'
export { Stack, type StackProps } from './Stack'
export { Heading, type HeadingProps } from './Heading'
