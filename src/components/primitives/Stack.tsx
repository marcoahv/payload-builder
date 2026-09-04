import React from 'react'

export type StackProps = {
  direction?: 'row' | 'column'
  gap?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  wrap?: boolean
  children: React.ReactNode
  className?: string
}

// Mapped rather than interpolated: Tailwind's scanner only emits classes it
// finds as complete literal strings, so `gap-${size}` would compile to nothing.
const GAP = { sm: 'gap-3', md: 'gap-6', lg: 'gap-12' } as const
const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const
const JUSTIFY = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const

/** One-dimensional flex layout. The workhorse inside blocks. */
export function Stack({
  direction = 'column',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  children,
  className,
}: StackProps) {
  return (
    <div
      className={[
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        GAP[gap],
        ALIGN[align],
        JUSTIFY[justify],
        wrap ? 'flex-wrap' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
