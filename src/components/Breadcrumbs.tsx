import { Container, Section, type Surface, type Spacing, type Width } from '@/components/primitives'
import { getServerSideURL } from '@/utilities/getUrl'
import Link from 'next/link'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  surface?: Surface | null
  spacing?: Spacing | null
  width?: Width | null
}

/**
 * Defaults are local, not Section's/Container's own - they match how
 * breadcrumbs already looked before appearance became editor-configurable,
 * so an existing post with no stored value renders identically.
 */
export function Breadcrumbs({
  items,
  surface = 'muted',
  spacing = 'tight',
  width,
}: BreadcrumbsProps) {
  const serverUrl = getServerSideURL()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${serverUrl}${item.href}` }),
    })),
  }

  return (
    <>
      {/* Must render before the <script> below - _header.css's fixed-header
          clearance targets `.ui-section:first-child` inside <main>. */}
      <Section surface={surface} spacing={spacing}>
        <Container width={width}>
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumbs__list">
              {items.map((item, index) => (
                <li key={item.label} className="breadcrumbs__item">
                  {item.href ? (
                    <Link href={item.href} className="breadcrumbs__link">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="breadcrumbs__current" aria-current="page">
                      {item.label}
                    </span>
                  )}
                  {index < items.length - 1 && (
                    <span className="breadcrumbs__separator" aria-hidden="true">
                      /
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </Container>
      </Section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
