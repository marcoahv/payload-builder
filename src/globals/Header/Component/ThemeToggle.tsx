'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { isTheme, THEME_STORAGE_KEY, type Theme } from '@/utilities/theme'

const listeners = new Set<() => void>()

function getSnapshot(): Theme {
  const stored = document.documentElement.dataset.theme
  if (isTheme(stored)) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// The server can't know a visitor's stored preference, so it always renders
// as if light - matching what the beforeInteractive init script (layout.tsx)
// leaves in place until a visitor has made an explicit choice.
function getServerSnapshot(): Theme {
  return 'light'
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    media.removeEventListener('change', onStoreChange)
  }
}

function setTheme(next: Theme) {
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Safari private browsing and similar contexts can throw on storage
    // access; the DOM attribute above still applies for this visit.
  }
  listeners.forEach((listener) => listener())
}

/** Manual light/dark override (build plan item 14). */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <button
      type="button"
      className="header__theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={22} aria-hidden /> : <Moon size={22} aria-hidden />}
    </button>
  )
}
