// https://fonts.google.com/

import { Montserrat, Vollkorn, Doto } from 'next/font/google'

// Each font exposes a CSS variable rather than a class name. The variables are
// applied to <html> in 'layout.tsx' and consumed by the --font-* tokens in
// 'styles/tokens/_typography.css'.
//
// The variable is the only thing that works: next/font self-hosts each family
// under a generated name, so `font-family: 'Montserrat'` would never match and
// would silently fall back to the system sans-serif.

export const montserrat = Montserrat({
  weight: ['100', '300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const vollkorn = Vollkorn({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-vollkorn',
  display: 'swap',
})

export const doto = Doto({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-doto',
  display: 'swap',
})

/** Applied together on <html> so every --font-* token resolves. */
export const fontVariables = [montserrat.variable, vollkorn.variable, doto.variable].join(' ')
