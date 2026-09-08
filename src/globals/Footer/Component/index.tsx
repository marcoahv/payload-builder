import Link from 'next/link'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { hrefForNavLink } from '@/utilities/navLink'
import { Container } from '@/components/primitives'
import { Logo } from '@/globals/Header/Component/Logo'

/**
 * Server component, self-fetching like `Header` — no props, so it can be
 * dropped into the layout without threading data through it.
 *
 * Nav links are the footer's own field (`footer.navLinks`), not a reuse of
 * `header.navLinks` — kept independent so the two navs can diverge. The logo
 * still comes from `header.logo`; the footer has no logo field of its own.
 */
export async function Footer() {
  const [header, footer, settings] = await Promise.all([
    getCachedGlobal('header', 2)(),
    getCachedGlobal('footer', 2)(),
    getCachedGlobal('settings')(),
  ])

  if (!header) return null

  const { logo } = header
  const navLinks = footer?.navLinks
  const { surface, spacing, width } = footer ?? {}

  return (
    <footer
      className="footer"
      data-surface={surface ?? 'default'}
      data-spacing={spacing ?? 'normal'}
    >
      <Container width={width}>
        <Logo logo={logo} className="footer__logo" />

        {navLinks && navLinks.length > 0 && (
          <nav className="footer__nav" aria-label="Footer navigation">
            <ul className="footer__links">
              {navLinks.map((item) => {
                const href = hrefForNavLink(item)
                if (!href) return null
                return (
                  <li key={item.id}>
                    <Link
                      className="ui-link"
                      href={href}
                      target={item.newTab ? '_blank' : undefined}
                      rel={item.newTab ? 'noopener noreferrer' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        <p className="footer__copyright">
          © {new Date().getFullYear()} {settings.siteName}. All rights
          reserved.
        </p>
      </Container>
    </footer>
  )
}
