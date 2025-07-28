import React from 'react'
import { BookOpen, Home, Search, ArrowLeft, Heart } from 'lucide-react'
import Link from 'next/link'

import { PageWrapper } from '@/components/layout'

export const metadata = {
  title: 'Page Not Found - Chasing Chapters',
  description: 'The page you are looking for could not be found. Explore our book reviews and discover your next great read.',
}

export default function NotFound() {
  return (
    <section className="py-16 bg-gradient-to-br from-neutral-50 via-white to-primary-50 min-h-[70vh] flex items-center">
      <PageWrapper className="text-center">
        <div className="max-w-2xl mx-auto">
          {/* 404 Visual */}
          <div className="relative mb-8">
            <div className="text-9xl font-bold text-neutral-200 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-24 w-24 text-primary-600 animate-pulse" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Chapter Not Found
          </h1>
          <p className="text-lg text-neutral-600 mb-8 max-w-lg mx-auto">
            It looks like this page has wandered off into another story. 
            Let&apos;s help you find your way back to the books!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/" className="btn-primary">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <Link href="/reviews" className="btn-outline">
              <Search className="h-4 w-4 mr-2" />
              Browse Reviews
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              While you&apos;re here, explore:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/currently-reading" 
                className="flex items-center p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors text-left group"
              >
                <BookOpen className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-neutral-900 group-hover:text-blue-600">
                    Currently Reading
                  </div>
                  <div className="text-sm text-neutral-600">
                    See what I&apos;m reading now
                  </div>
                </div>
              </Link>
              
              <Link 
                href="/want-to-read" 
                className="flex items-center p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors text-left group"
              >
                <Heart className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-neutral-900 group-hover:text-purple-600">
                    Reading Wishlist
                  </div>
                  <div className="text-sm text-neutral-600">
                    Books on my to-read list
                  </div>
                </div>
              </Link>
              
              <Link 
                href="/tags" 
                className="flex items-center p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors text-left group"
              >
                <Search className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-neutral-900 group-hover:text-green-600">
                    Browse by Tags
                  </div>
                  <div className="text-sm text-neutral-600">
                    Find books by genre or theme
                  </div>
                </div>
              </Link>
              
              <Link 
                href="/about" 
                className="flex items-center p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors text-left group"
              >
                <ArrowLeft className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-neutral-900 group-hover:text-primary-600">
                    About Me
                  </div>
                  <div className="text-sm text-neutral-600">
                    Learn about my reading journey
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Fun Message */}
          <div className="mt-8 text-sm text-neutral-500">
            <p>
              &ldquo;Not all those who wander are lost&rdquo; — but this page certainly is! 
              Let&apos;s get you back to the good stuff.
            </p>
          </div>
        </div>
      </PageWrapper>
    </section>
  )
}