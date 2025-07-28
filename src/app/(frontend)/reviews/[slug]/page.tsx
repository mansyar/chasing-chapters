import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import { Star, Calendar, User, BookOpen, ArrowLeft, Clock, BookOpenCheck } from 'lucide-react'

import config from '@/payload.config'
import { PageWrapper } from '@/components/layout'
import LexicalContent from '@/components/lexical/LexicalContent'
import { OptimizedImage, SocialShare } from '@/components/common'
import { Review, Media, Tag } from '@/payload-types'
import { formatDate, formatDateShort } from '@/lib/utils'
import { generateReviewMetadata } from '@/lib/metadata'

interface ReviewPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ReviewPageProps) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const reviews = await payload.find({
    collection: 'reviews',
    where: {
      slug: { equals: params.slug },
      status: { equals: 'published' }
    },
    limit: 1,
    depth: 2
  })

  const review = reviews.docs[0] as Review & { coverImage?: Media; tags?: (number | Tag)[] }

  if (!review) {
    return {
      title: 'Review Not Found - Chasing Chapters',
      description: 'The requested book review could not be found.'
    }
  }

  // Use the enhanced metadata generator
  return generateReviewMetadata({
    title: review.title,
    author: review.author,
    excerpt: review.excerpt,
    slug: review.slug,
    coverImage: typeof review.coverImage === 'object' && review.coverImage?.url ? {
      url: review.coverImage.url,
      alt: review.coverImage.alt || `Cover of ${review.title}`,
      width: review.coverImage.width || undefined,
      height: review.coverImage.height || undefined
    } : undefined,
    publishedDate: review.publishedDate,
    rating: review.rating,
    tags: review.tags?.filter((tag): tag is Tag => typeof tag !== 'number'),
    genre: review.genre || ''
  })
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const reviews = await payload.find({
    collection: 'reviews',
    where: {
      slug: { equals: params.slug },
      status: { equals: 'published' }
    },
    limit: 1,
    depth: 2
  })

  if (!reviews.docs.length) {
    notFound()
  }

  const review = reviews.docs[0] as Review & { coverImage?: Media; tags?: (number | Tag)[] }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-neutral-300'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-medium text-neutral-700">
          {rating}/5
        </span>
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
        return 'Finished Reading'
      case 'currently-reading':
        return 'Currently Reading'
      case 'want-to-read':
        return 'Want to Read'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <BookOpenCheck className="h-4 w-4" />
      case 'currently-reading':
        return <BookOpen className="h-4 w-4" />
      case 'want-to-read':
        return <Clock className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  return (
    <>
      {/* Back Navigation */}
      <PageWrapper padding="md">
        <Link
          href="/reviews"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reviews
        </Link>
      </PageWrapper>

      {/* Review Header */}
      <section className="bg-gradient-to-br from-neutral-50 to-white">
        <PageWrapper>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Book Cover */}
            <div className="lg:col-span-1">
              <div className="aspect-[3/4] relative rounded-lg overflow-hidden shadow-lg max-w-sm mx-auto lg:mx-0">
                <OptimizedImage
                  src={review.coverImage?.url}
                  alt={review.coverImage?.alt || `Cover of ${review.title}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, (max-width: 1200px) 33vw, 400px"
                  quality={90}
                  fallbackIcon={<BookOpen className="h-16 w-16 text-neutral-400" />}
                />
              </div>
            </div>

            {/* Book Info */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(review.readingStatus)}`}>
                  {getStatusIcon(review.readingStatus)}
                  <span className="ml-2">{getStatusLabel(review.readingStatus)}</span>
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
                {review.title}
              </h1>

              <p className="text-xl text-neutral-600 flex items-center mb-4">
                <User className="h-5 w-5 mr-2" />
                by {review.author}
              </p>

              {/* Rating */}
              <div className="mb-6">
                {renderStars(review.rating)}
              </div>

              {/* Excerpt */}
              <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
                {review.excerpt}
              </p>

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-neutral-600">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Published: {formatDate(review.publishedDate)}</span>
                </div>
                
                {review.pageCount && (
                  <div className="flex items-center text-neutral-600">
                    <BookOpen className="h-5 w-5 mr-2" />
                    <span>{review.pageCount} pages</span>
                  </div>
                )}

                {review.dateStarted && (
                  <div className="flex items-center text-neutral-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>Started: {formatDateShort(review.dateStarted)}</span>
                  </div>
                )}

                {review.dateFinished && (
                  <div className="flex items-center text-neutral-600">
                    <BookOpenCheck className="h-5 w-5 mr-2" />
                    <span>Finished: {formatDateShort(review.dateFinished)}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.tags.map((tag) => {
                    if (typeof tag === 'number') return null
                    
                    return (
                      <Link
                        key={tag.id}
                        href={`/tags/${tag.slug}`}
                        className="px-3 py-1 text-sm font-medium rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                        style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
                      >
                        {tag.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Review Content */}
      <section className="py-12 bg-white">
        <PageWrapper maxWidth="4xl">
          <div className="prose prose-lg prose-neutral max-w-none">
            <LexicalContent content={review.content} />
          </div>
          
          {/* Social Sharing */}
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <SocialShare
              url={`/reviews/${review.slug}`}
              title={`${review.title} by ${review.author} - Book Review`}
              description={review.excerpt}
              hashtags={['books', 'bookreview', 'reading', ...(review.tags?.filter((tag): tag is Tag => typeof tag !== 'number').map(tag => tag.name.toLowerCase().replace(/\s+/g, '')) || [])]}
              className="max-w-md"
            />
          </div>
        </PageWrapper>
      </section>

      {/* Additional Book Info */}
      {(review.genre || review.publishYear || review.isbn) && (
        <section className="py-8 bg-neutral-50">
          <PageWrapper maxWidth="4xl">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Book Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {review.genre && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Genre</dt>
                  <dd className="text-neutral-900">{review.genre}</dd>
                </div>
              )}
              {review.publishYear && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Published</dt>
                  <dd className="text-neutral-900">{review.publishYear}</dd>
                </div>
              )}
              {review.isbn && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500">ISBN</dt>
                  <dd className="text-neutral-900">{review.isbn}</dd>
                </div>
              )}
            </div>
          </PageWrapper>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-12 bg-white">
        <PageWrapper className="text-center">
          <h3 className="text-2xl font-bold text-neutral-900 mb-4">
            Enjoyed this review?
          </h3>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Check out more book reviews and discover your next great read.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reviews" className="btn-primary">
              Browse All Reviews
            </Link>
            <Link href="/currently-reading" className="btn-outline">
              What I&apos;m Reading
            </Link>
          </div>
        </PageWrapper>
      </section>
    </>
  )
}