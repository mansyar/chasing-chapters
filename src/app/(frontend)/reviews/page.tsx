import { getPayload } from 'payload'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

import config from '@/payload.config'
import { PageWrapper } from '@/components/layout'
import { ReviewGrid } from '@/components/reviews'
import { Review, Media, Tag } from '@/payload-types'

export const metadata = {
  title: 'All Book Reviews - Chasing Chapters',
  description: 'Browse all book reviews, ratings, and reading recommendations on Chasing Chapters.',
}

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all published reviews
  const reviews = await payload.find({
    collection: 'reviews',
    where: {
      status: {
        equals: 'published'
      }
    },
    sort: '-publishedDate',
    limit: 50, // Adjust as needed or implement pagination
    depth: 2
  })

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
            Book Reviews
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto text-center">
            Discover thoughtful reviews of books across various genres. 
            From contemporary fiction to classic literature, find your next great read.
          </p>
        </PageWrapper>
      </section>

      {/* Reviews Grid */}
      <section className="py-16 bg-white">
        <PageWrapper>
          {reviews.docs.length > 0 ? (
            <>
              <div className="mb-8">
                <p className="text-neutral-600">
                  Showing {reviews.docs.length} review{reviews.docs.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ReviewGrid 
                reviews={reviews.docs as (Review & { coverImage?: Media; tags?: (number | Tag)[] })[]}
                showTitle={false}
              />
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                No Reviews Yet
              </h2>
              <p className="text-neutral-600 mb-8">
                Book reviews will appear here once they&apos;re published.
              </p>
              <a
                href="/admin"
                className="btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Add Your First Review
              </a>
            </div>
          )}
        </PageWrapper>
      </section>

      {/* Call to Action */}
      {reviews.docs.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <PageWrapper className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Looking for something specific?
            </h2>
            <p className="text-neutral-600 mb-6">
              Browse by reading status or explore different topics and genres.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/currently-reading" className="btn-primary">
                Currently Reading
              </Link>
              <Link href="/want-to-read" className="btn-outline">
                Want to Read
              </Link>
              <Link href="/tags" className="btn-outline">
                Browse Tags
              </Link>
            </div>
          </PageWrapper>
        </section>
      )}
    </>
  )
}