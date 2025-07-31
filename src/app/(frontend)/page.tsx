import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { BookOpen, Star, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

import config from '@/payload.config'
import { PageWrapper } from '@/components/layout'
import { ReviewGrid } from '@/components/reviews'
import { SocialShareInline } from '@/components/common'
import { Review, Media, Tag } from '@/payload-types'

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Fetch recent published reviews
  const recentReviews = await payload.find({
    collection: 'reviews',
    where: {
      status: {
        equals: 'published'
      }
    },
    sort: '-publishedDate',
    limit: 6,
    depth: 2
  })

  // Fetch some stats
  const totalReviews = await payload.count({
    collection: 'reviews',
    where: {
      status: {
        equals: 'published'
      }
    }
  })

  const currentlyReading = await payload.count({
    collection: 'reviews',
    where: {
      readingStatus: {
        equals: 'currently-reading'
      }
    }
  })

  const wantToRead = await payload.count({
    collection: 'reviews',
    where: {
      readingStatus: {
        equals: 'want-to-read'
      }
    }
  })

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-8">
            <BookOpen className="h-16 w-16 text-primary-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            Welcome to Chasing Chapters
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto text-center">
            A personal journey through books, stories, and the adventures they hold. 
            Join me as I discover new worlds through reading.
          </p>
          
          {user && (
            <div className="bg-white/80 border border-neutral-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <p className="text-neutral-700">Welcome back, <strong>{user.email}</strong></p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/reviews" className="btn-primary">
              Browse All Reviews
            </Link>
            <Link href="/currently-reading" className="btn-outline">
              What I&apos;m Reading
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{totalReviews.totalDocs}</div>
              <div className="text-sm text-neutral-600">Reviews Published</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{currentlyReading.totalDocs}</div>
              <div className="text-sm text-neutral-600">Currently Reading</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{wantToRead.totalDocs}</div>
              <div className="text-sm text-neutral-600">Want to Read</div>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Recent Reviews */}
      <section className="py-16 bg-white">
        <PageWrapper>
          <ReviewGrid 
            reviews={recentReviews.docs as (Review & { coverImage?: Media; tags?: (number | Tag)[] })[]}
            title="Recent Reviews"
          />
          
          {recentReviews.docs.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/reviews" className="btn-outline">
                View All Reviews
              </Link>
            </div>
          )}
        </PageWrapper>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-neutral-50">
        <PageWrapper className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto text-center">
            Follow along as I explore new books, share thoughts on recent reads, 
            and discover hidden literary gems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/about" className="btn-primary">
              About Me
            </Link>
            <Link href="/contact" className="btn-outline">
              Get in Touch
            </Link>
          </div>
          
          {/* Social Sharing */}
          <div className="pt-8 border-t border-neutral-200 max-w-sm mx-auto">
            <SocialShareInline 
              url="/"
              title="Chasing Chapters - Book Reviews & Reading Adventures"
            />
          </div>
        </PageWrapper>
      </section>
    </>
  )
}
