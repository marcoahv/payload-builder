import React from 'react'

export type Width = 'narrow' | 'default' | 'wide' | 'full'

export type ContainerProps = {
  width?: Width | null
  children: React.ReactNode
  className?: string
}

/**
 * Constrains content to a readable measure and supplies the horizontal
 * gutters. Pairs with <Section>, which stays full-width so its background can
 * run edge to edge.
 */
export function Container({ width = 'default', children, className }: ContainerProps) {
  return (
    <div
      className={['ui-container', className].filter(Boolean).join(' ')}
      data-width={width ?? 'default'}
    >
      {children}
    </div>
  )
}
