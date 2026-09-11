export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/**
 * Header.showThemeToggle gate. Only an explicit `false` disables the
 * control - undefined (documents saved before this field existed) and any
 * other value are treated as enabled, the same convention HeaderClient.tsx
 * already uses for transparentAtTop.
 */
export function isThemeToggleEnabled(value: unknown): boolean {
  return value !== false
}

/**
 * Runs before hydration (see layout.tsx's beforeInteractive Script) so the
 * stored preference applies before first paint - no flash of the wrong
 * theme. Only THEME_STORAGE_KEY is interpolated here; never template
 * request, CMS, or user-controlled data into this string, since it is
 * injected as raw HTML.
 */
export function themeInitScript(): string {
  return `(function(){try{var v=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(v==='light'||v==='dark'){document.documentElement.setAttribute('data-theme',v)}}catch(e){}})()`
}
