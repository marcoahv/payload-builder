import React from 'react'

export type Surface = 'default' | 'muted' | 'inverse' | 'accent'
export type Spacing = 'none' | 'tight' | 'normal' | 'loose'

export type SectionProps = {
  surface?: Surface | null
  spacing?: Spacing | null
  children: React.ReactNode
  className?: string
  id?: string
  as?: 'section' | 'header' | 'footer' | 'article' | 'aside' | 'div'
}

/**
 * A full-bleed horizontal band — the outermost element of every block.
 *
 * Surface and spacing are chosen from a fixed set of ROLES, never raw values.
 * Each `data-surface` sets background and foreground together (see
 * `styles/sections/_section.css`), so a section cannot render unreadable text
 * on its own background.
 *
 * Wrap the contents in <Container> to constrain their width; this element
 * stays full-width so its background can run edge to edge.
 */
export function Section({
  surface = 'default',
  spacing = 'normal',
  children,
  className,
  id,
  as: Tag = 'section',
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={['ui-section', className].filter(Boolean).join(' ')}
      data-surface={surface ?? 'default'}
      data-spacing={spacing ?? 'normal'}
    >
      {children}
    </Tag>
  )
}
