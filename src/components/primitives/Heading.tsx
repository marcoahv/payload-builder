import React from 'react'

export type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Visual size, when it should differ from the semantic level. */
  size?: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
}

// Literal strings, not interpolation — see the note in Stack.tsx.
const SIZE = {
  1: 'ui-heading-1',
  2: 'ui-heading-2',
  3: 'ui-heading-3',
  4: 'ui-heading-4',
  5: 'ui-heading-5',
  6: 'ui-heading-6',
} as const

/**
 * Heading whose document level is independent of its visual size, so a block
 * can sit correctly in the outline without dictating how large it looks.
 * A page's first heading should be level 1 regardless of which block renders it.
 */
export function Heading({ level = 2, size, children, className }: HeadingProps) {
  const Tag = `h${level}` as const
  return <Tag className={[SIZE[size ?? level], className].filter(Boolean).join(' ')}>{children}</Tag>
}
