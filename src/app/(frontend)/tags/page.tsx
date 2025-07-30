import Link from 'next/link'
import { getPayload } from 'payload'
import { Tag as TagIcon } from 'lucide-react'

import config from '@/payload.config'
import { PageWrapper } from '@/components/layout'
import { Tag } from '@/payload-types'

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Browse Tags - Chasing Chapters',
  description: 'Explore book reviews by topic, genre, and theme. Find your next great read through our organized tag system.',
}

export default async function TagsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Get all tags with review counts
  const tags = await payload.find({
    collection: 'tags',
    sort: 'name',
    limit: 100,
    depth: 0
  })

  // Get review counts for each tag
  const tagsWithCounts = await Promise.all(
    tags.docs.map(async (tag: Tag) => {
      const reviewCount = await payload.count({
        collection: 'reviews',
        where: {
          and: [
            {
              status: {
                equals: 'published'
              }
            },
            {
              tags: {
                in: [tag.id]
              }
            }
          ]
        }
      })
      
      return {
        ...tag,
        reviewCount: reviewCount.totalDocs
      }
    })
  )

  // Filter out tags with no reviews and sort by review count (descending)
  const popularTags = tagsWithCounts
    .filter(tag => tag.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)

  const allTags = tagsWithCounts.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-6">
            <TagIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
            Browse by Tags
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Explore book reviews organized by topics, genres, and themes. 
            Find your next great read through our curated tag system.
          </p>
        </PageWrapper>
      </section>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <section className="py-16 bg-white">
          <PageWrapper>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Popular Tags</h2>
              <div className="w-24 h-1 bg-primary-600 rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTags.slice(0, 6).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="card card-hover p-6 text-center group"
                >
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: '#f3f4f6' }}
                  >
                    <TagIcon 
                      className="h-8 w-8 group-hover:scale-110 transition-transform duration-200 text-neutral-500"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors mb-2">
                    {tag.name}
                  </h3>
                  {tag.description && (
                    <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                      {tag.description}
                    </p>
                  )}
                  <div className="text-sm text-neutral-500">
                    {tag.reviewCount} review{tag.reviewCount !== 1 ? 's' : ''}
                  </div>
                </Link>
              ))}
            </div>

            {popularTags.length > 6 && (
              <div className="text-center mt-8">
                <p className="text-neutral-600 mb-4">
                  Showing {Math.min(6, popularTags.length)} of {popularTags.length} popular tags
                </p>
              </div>
            )}
          </PageWrapper>
        </section>
      )}

      {/* All Tags */}
      <section className={`py-16 ${popularTags.length > 0 ? 'bg-neutral-50' : 'bg-white'}`}>
        <PageWrapper>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">All Tags</h2>
            <div className="w-24 h-1 bg-primary-600 rounded"></div>
          </div>

          {allTags.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-neutral-600">
                  {allTags.length} tag{allTags.length !== 1 ? 's' : ''} available
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {allTags.map((tag) => (
                  tag.reviewCount > 0 ? (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:shadow-md"
                    >
                      <TagIcon className="h-3 w-3 mr-2" />
                      {tag.name}
                      <span className="ml-2 px-2 py-0.5 bg-neutral-200 text-neutral-600 text-xs rounded-full">
                        {tag.reviewCount}
                      </span>
                    </Link>
                  ) : (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-neutral-100 text-neutral-500 cursor-default"
                    >
                      <TagIcon className="h-3 w-3 mr-2" />
                      {tag.name}
                    </span>
                  )
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <TagIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                No Tags Yet
              </h3>
              <p className="text-neutral-600 mb-6">
                Tags will appear here once reviews are published with topic labels.
              </p>
              <Link href="/reviews" className="btn-primary">
                Browse Reviews
              </Link>
            </div>
          )}
        </PageWrapper>
      </section>

      {/* Call to Action */}
      {allTags.length > 0 && (
        <section className="py-12 bg-white">
          <PageWrapper className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-neutral-600 mb-6">
              Browse all reviews or explore different reading categories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/reviews" className="btn-primary">
                All Reviews
              </Link>
              <Link href="/currently-reading" className="btn-outline">
                Currently Reading
              </Link>
            </div>
          </PageWrapper>
        </section>
      )}
    </>
  )
}