import { describe, expect, it } from 'vitest'
import { buildHref } from '@/components/Pagination'

describe('buildHref', () => {
  it('omits the page param for page 1', () => {
    expect(buildHref(1)).toBe('?')
  })

  it('includes the page param for page > 1', () => {
    expect(buildHref(2)).toBe('?page=2')
  })

  it('preserves other search params', () => {
    expect(buildHref(2, { category: 'news' })).toBe('?category=news&page=2')
  })

  it('does not duplicate an existing page param', () => {
    expect(buildHref(3, { page: '1', category: 'news' })).toBe('?category=news&page=3')
  })

  it('drops other search params when navigating to page 1', () => {
    expect(buildHref(1, { category: 'news' })).toBe('?category=news')
  })

  it('produces a valid href with no search params at all', () => {
    expect(buildHref(1, undefined)).toBe('?')
    expect(buildHref(2, undefined)).toBe('?page=2')
  })

  it('ignores empty-string search param values', () => {
    expect(buildHref(2, { category: '' })).toBe('?page=2')
  })
})
