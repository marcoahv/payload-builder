import React from 'react'
import Link from 'next/link'

export type SearchParamsProps = Record<string, string | undefined>

type PaginationProps = {
  totalPages: number
  currentPage: number
  searchParams?: SearchParamsProps
  hasNext: boolean
  hasPrev: boolean
}

export function buildHref(page: number, searchParams?: SearchParamsProps): string {
  const params = new URLSearchParams()
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })
  }
  if (page > 1) {
    params.set('page', String(page))
  }
  const queryString = params.toString()
  return queryString ? `?${queryString}` : '?'
}

export const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  searchParams,
  hasNext,
  hasPrev,
}) => {
  if (totalPages <= 1) return null
  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }
  return (
    <nav aria-label={'Pagination'} className="pagination">
      <ol className="pagination__list">
        <li>
          {hasPrev ? (
            <Link
              href={buildHref(currentPage - 1, searchParams)}
              className="pagination__link pagination__link--arrow"
              aria-label={'Previous Page'}
            >
              Previous
            </Link>
          ) : (
            <span
              className="pagination__link pagination__link--arrow pagination__link--disabled"
              aria-disabled={'true'}
            >
              Previous
            </span>
          )}
        </li>
        {pages.map((page) => (
          <li key={page}>
            {page === currentPage ? (
              <span className="pagination__link pagination__link--active" aria-current="page">
                {page}
              </span>
            ) : (
              <Link href={buildHref(page, searchParams)} className="pagination__link">
                {page}
              </Link>
            )}
          </li>
        ))}
        <li>
          {hasNext ? (
            <Link
              href={buildHref(currentPage + 1, searchParams)}
              className="pagination__link pagination__link--arrow"
              aria-label={'Next Page'}
            >
              Next
            </Link>
          ) : (
            <span
              className="pagination__link pagination__link--arrow pagination__link--disabled"
              aria-disabled={'true'}
            >
              Next
            </span>
          )}
        </li>
      </ol>
    </nav>
  )
}
