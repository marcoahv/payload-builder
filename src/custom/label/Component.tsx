'use client'
import { useRowLabel } from '@payloadcms/ui'

export const ArrayRowLabel = () => {
  const {
    data: { label },
    rowNumber,
  } = useRowLabel<{ label?: string }>()

  return <div>{label || `Link ${String(rowNumber).padStart(2, '0')}`}</div>
}

export const CardRowLabel = () => {
  const {data: {title}, rowNumber} = useRowLabel<{title: string}>()
  const customLabel = title || `Card ${String(rowNumber).padStart(2, '0')}`
  return <div>{customLabel}</div>
}
