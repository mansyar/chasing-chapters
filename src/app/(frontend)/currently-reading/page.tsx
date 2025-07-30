import { getPayload } from 'payload'
import React from 'react'
import { BookOpen, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

import config from '@/payload.config'
import { PageWrapper } from '@/components/layout'
import { ReviewGrid } from '@/components/reviews'
import { Review, Media, Tag } from '@/payload-types'

export const metadata = {
  title: 'Currently Reading - Chasing Chapters',
  description: 'Books I am currently reading and my reading progress.',
}

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic'

export default async function CurrentlyReadingPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch currently reading books
  const currentlyReadingReviews = await payload.find({
    collection: 'reviews',
    where: {
      readingStatus: {
        equals: 'currently-reading'
      }
    },
    sort: '-dateStarted',
    depth: 2
  })

  // Get count for stats
  const totalCurrentlyReading = currentlyReadingReviews.totalDocs

  return (
    <>
      {/* Header Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Currently Reading
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Books I&apos;m actively reading right now. Follow along with my reading journey!
          </p>
          
          {/* Stats */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200 max-w-sm mx-auto">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-neutral-900">{totalCurrentlyReading}</div>
            <div className="text-sm text-neutral-600">Books in Progress</div>
          </div>
        </PageWrapper>
      </section>

      {/* Currently Reading Books */}
      <section className="py-16 bg-white">
        <PageWrapper>
          {currentlyReadingReviews.docs.length > 0 ? (
            <>
              <ReviewGrid 
                reviews={currentlyReadingReviews.docs as (Review & { coverImage?: Media; tags?: (number | Tag)[] })[]}
                showReadingStatus={true}
              />
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                No books currently being read
              </h2>
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                I&apos;m not actively reading any books at the moment. Check back soon for updates!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/want-to-read" className="btn-primary">
                  View Reading List
                </Link>
                <Link href="/reviews" className="btn-outline">
                  Browse All Reviews
                </Link>
              </div>
            </div>
          )}
        </PageWrapper>
      </section>

      {/* Navigation Links */}
      <section className="py-12 bg-neutral-50">
        <PageWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link 
              href="/want-to-read" 
              className="group bg-white rounded-lg p-6 border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center mb-3">
                <Calendar className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-purple-600">
                  Want to Read
                </h3>
              </div>
              <p className="text-neutral-600">
                Explore my reading wishlist and upcoming books
              </p>
            </Link>
            
            <Link 
              href="/reviews" 
              className="group bg-white rounded-lg p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center mb-3">
                <BookOpen className="h-6 w-6 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600">
                  All Reviews
                </h3>
              </div>
              <p className="text-neutral-600">
                Browse all my book reviews and recommendations
              </p>
            </Link>
          </div>
        </PageWrapper>
      </section>
    </>
  )
}