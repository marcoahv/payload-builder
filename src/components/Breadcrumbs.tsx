import { Container } from '@/components/primitives'
import { getServerSideURL } from '@/utilities/getUrl'
import Link from 'next/link'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="breadcrumbs">
        <Container>
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
      </div>
    </>
  )
}
