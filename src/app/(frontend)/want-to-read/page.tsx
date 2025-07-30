import { getPayload } from 'payload'
import React from 'react'
import { Heart, Calendar, BookPlus, Clock } from 'lucide-react'
import Link from 'next/link'

import config from '@/payload.config'
import { PageWrapper } from '@/components/layout'
import { ReviewGrid } from '@/components/reviews'
import { Review, Media, Tag } from '@/payload-types'

export const metadata = {
  title: 'Want to Read - Chasing Chapters',
  description: 'My reading wishlist - books I plan to read in the future.',
}

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic'

export default async function WantToReadPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch want-to-read books
  const wantToReadReviews = await payload.find({
    collection: 'reviews',
    where: {
      readingStatus: {
        equals: 'want-to-read'
      }
    },
    sort: '-createdAt',
    depth: 2
  })

  // Get count for stats
  const totalWantToRead = wantToReadReviews.totalDocs

  return (
    <>
      {/* Header Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 py-16">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-6">
            <Heart className="h-12 w-12 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Want to Read
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            My ever-growing reading wishlist. These are the books that have caught my attention 
            and are waiting to be discovered.
          </p>
          
          {/* Stats */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200 max-w-sm mx-auto">
            <div className="flex items-center justify-center mb-2">
              <BookPlus className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-neutral-900">{totalWantToRead}</div>
            <div className="text-sm text-neutral-600">Books on Wishlist</div>
          </div>
        </PageWrapper>
      </section>

      {/* Want to Read Books */}
      <section className="py-16 bg-white">
        <PageWrapper>
          {wantToReadReviews.docs.length > 0 ? (
            <>
              <ReviewGrid 
                reviews={wantToReadReviews.docs as (Review & { coverImage?: Media; tags?: (number | Tag)[] })[]}
                showReadingStatus={true}
              />
            </>
          ) : (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                No books on the reading list yet
              </h2>
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                My reading wishlist is currently empty. I&apos;m always on the lookout for great book recommendations!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/currently-reading" className="btn-primary">
                  See What I&apos;m Reading
                </Link>
                <Link href="/reviews" className="btn-outline">
                  Browse All Reviews
                </Link>
              </div>
            </div>
          )}
        </PageWrapper>
      </section>

      {/* Reading Goals Section */}
      <section className="py-16 bg-gradient-to-r from-purple-100 to-pink-100">
        <PageWrapper className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            My Reading Philosophy
          </h2>
          <p className="text-lg text-neutral-700 mb-8 max-w-3xl mx-auto">
            I believe every book has something to offer, whether it&apos;s knowledge, entertainment, 
            or a new perspective. My reading list reflects my curiosity across genres and topics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-2">Diverse Genres</h3>
              <p className="text-sm text-neutral-600">
                From fiction to non-fiction, exploring various topics and styles
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200">
              <BookPlus className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-2">Quality over Quantity</h3>
              <p className="text-sm text-neutral-600">
                Focusing on books that resonate and provide meaningful insights
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-2">Mindful Reading</h3>
              <p className="text-sm text-neutral-600">
                Taking time to reflect and share thoughts on each reading experience
              </p>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Navigation Links */}
      <section className="py-12 bg-neutral-50">
        <PageWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link 
              href="/currently-reading" 
              className="group bg-white rounded-lg p-6 border border-neutral-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center mb-3">
                <Clock className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-blue-600">
                  Currently Reading
                </h3>
              </div>
              <p className="text-neutral-600">
                See what I&apos;m reading right now
              </p>
            </Link>
            
            <Link 
              href="/reviews" 
              className="group bg-white rounded-lg p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center mb-3">
                <Heart className="h-6 w-6 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600">
                  Finished Reviews
                </h3>
              </div>
              <p className="text-neutral-600">
                Read my complete book reviews and recommendations
              </p>
            </Link>
          </div>
        </PageWrapper>
      </section>
    </>
  )
}