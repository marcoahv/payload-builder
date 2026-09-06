import React from 'react'

export type CardVariant = 'default'

export function CardContainer({
  variant = 'default',
  children,
}: {
  variant?: CardVariant
  children: React.ReactNode
}) {
  return (
    <div className={`card-container card-container--${variant}`}>
      {children}
    </div>
  )
}
