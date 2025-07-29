import Link from 'next/link'
import { Star, Calendar, User, BookOpen } from 'lucide-react'
import { Review, Media, Tag } from '@/payload-types'
import { formatDateShort, truncateText, cn } from '@/lib/utils'
import { OptimizedImage } from '@/components/common'

interface ReviewCardProps {
  review: Review & {
    coverImage?: Media
    tags?: (number | Tag)[]
  }
  showReadingStatus?: boolean
  showExcerpt?: boolean
  className?: string
}

export default function ReviewCard({ 
  review, 
  showReadingStatus = true, 
  showExcerpt = true,
  className 
}: ReviewCardProps) {
  const {
    title,
    slug,
    author,
    excerpt,
    rating,
    publishedDate,
    readingStatus,
    coverImage,
    tags
  } = review

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-neutral-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'bg-green-100 text-green-800'
      case 'currently-reading':
        return 'bg-blue-100 text-blue-800'
      case 'want-to-read':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'finished':
        return 'Finished'
      case 'currently-reading':
        return 'Reading'
      case 'want-to-read':
        return 'Want to Read'
      default:
        return status
    }
  }

  return (
    <article className={cn("card card-hover group", className)}>
      <div className="relative">
        {/* Cover Image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          <OptimizedImage
            src={coverImage?.url}
            alt={coverImage?.alt || `Cover of ${title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1200px) 33vw, 25vw"
            quality={75}
            loading="lazy"
            fallbackIcon={<BookOpen className="h-12 w-12 text-neutral-400" />}
          />
        </div>

        {/* Reading Status Badge */}
        {showReadingStatus && (
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(readingStatus)}`}>
              {getStatusLabel(readingStatus)}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Title & Author */}
        <div className="mb-3">
          <h3 className="text-xl font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            <Link href={`/reviews/${slug}`}>
              {title}
            </Link>
          </h3>
          <p className="text-neutral-600 flex items-center mt-1">
            <User className="h-4 w-4 mr-1" />
            {author}
          </p>
        </div>

        {/* Rating */}
        <div className="mb-3">
          {renderStars(rating)}
        </div>

        {/* Excerpt */}
        {showExcerpt && (
          <p className="text-neutral-700 text-sm mb-4 line-clamp-3">
            {truncateText(excerpt, 120)}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag) => {
              // Handle case where tag might be just an ID (number)
              if (typeof tag === 'number') return null
              
              return (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                  style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
                >
                  {tag.name}
                </Link>
              )
            })}
            {tags.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-500">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center text-sm text-neutral-500">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDateShort(publishedDate)}
        </div>

        {/* Read More Link */}
        <div className="mt-4">
          <Link
            href={`/reviews/${slug}`}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
          >
            Read Review
            <span className="ml-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}