import { Category, Media, Post, User } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'
import { MediaImage } from '@/components/MediaImage'
import { Heading } from '@/components/primitives'
import { Calendar, Tag, User2 } from 'lucide-react'
import Link from 'next/link'

type PostPreviewProps = {
  post: Pick<
    Post,
    | 'id'
    | 'slug'
    | 'title'
    | 'summary'
    | 'featuredImage'
    | 'populatedAuthor'
    | 'date'
    | 'date_tz'
    | 'category'
  >
  variant?: 'featured' | 'header'
  showLink?: boolean
  imageSize?: 'fullSize' | 'card'
  className?: string
}

export function PostPreview({
  post,
  variant = 'featured',
  showLink = true,
  imageSize = 'fullSize',
  className,
}: PostPreviewProps) {
  const {
    featuredImage,
    populatedAuthor: author,
    date,
    date_tz,
    category,
    title,
    summary,
    slug,
  } = post
  // The header variant renders as a full-width banner below its meta row,
  // overriding the featured variant's side-by-side row at atMedium+ - `flex-col`
  // and `items-stretch` win regardless of source order because utilities
  // always beat @layer components (see styles/README.md's "Elements vs.
  // sections"); items-stretch overrides the row layout's leftover
  // align-items: flex-start so the lone content child still fills the width.
  const classNames = [
    'post-preview',
    variant === 'header' ? 'flex-col items-stretch' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const banner = isDoc<Media>(featuredImage) && (
    <MediaImage
      image={featuredImage}
      size={imageSize}
      className="w-full"
      imgClassName="w-full aspect-video object-cover"
    />
  )

  const content = (
    <div className={classNames}>
      {variant === 'featured' && isDoc<Media>(featuredImage) && (
        <MediaImage image={featuredImage} size={imageSize} />
      )}
      <div className="post-preview__content">
        {variant === 'featured' && <Heading level={3}>{title}</Heading>}
        <div className="post-preview__meta">
          {isDoc<User>(author) && (
            <span className="post-preview__meta-item">
              <User2 height={16} width={16} /> {author.name}
            </span>
          )}
          {isDoc<Category>(category) && (
            <span className="post-preview__meta-item">
              <Tag width={16} height={16} /> {category.name}
            </span>
          )}
          {date && (
            <span className="post-preview__meta-item">
              <Calendar width={16} height={16} />
              {new Date(date).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: date_tz,
              })}
            </span>
          )}
        </div>
        {variant === 'header' && banner}
        {summary && <p className="post-preview__summary">{summary}</p>}
      </div>
    </div>
  )

  if (showLink) {
    return (
      <Link href={`/blog/${slug}`} className="post-preview__link">
        {content}
      </Link>
    )
  }

  return content
}
