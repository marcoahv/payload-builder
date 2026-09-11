import { describe, expect, it } from 'vitest'
import { isTheme, isThemeToggleEnabled } from '@/utilities/theme'

describe('isTheme', () => {
  it('accepts light and dark', () => {
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
  })

  it('rejects undefined and null', () => {
    expect(isTheme(undefined)).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isTheme('')).toBe(false)
  })

  it('rejects an arbitrary string', () => {
    expect(isTheme('system')).toBe(false)
  })
})

describe('isThemeToggleEnabled', () => {
  it('is enabled for true', () => {
    expect(isThemeToggleEnabled(true)).toBe(true)
  })

  it('is disabled only for an explicit false', () => {
    expect(isThemeToggleEnabled(false)).toBe(false)
  })

  it('treats undefined and null as enabled', () => {
    expect(isThemeToggleEnabled(undefined)).toBe(true)
    expect(isThemeToggleEnabled(null)).toBe(true)
  })
})
