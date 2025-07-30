import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import { ArrowLeft, Tag as TagIcon } from 'lucide-react'

import config from '@/payload.config'
import { PageWrapper } from '@/components/layout'
import { ReviewGrid } from '@/components/reviews'
import { Review, Media, Tag } from '@/payload-types'

// Force dynamic rendering since we need database access for metadata and content
export const dynamic = 'force-dynamic'

interface TagPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: TagPageProps) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const tags = await payload.find({
    collection: 'tags',
    where: {
      slug: { equals: slug }
    },
    limit: 1
  })

  const tag = tags.docs[0] as Tag

  if (!tag) {
    return {
      title: 'Tag Not Found - Chasing Chapters',
      description: 'The requested tag could not be found.'
    }
  }

  return {
    title: `${tag.name} - Book Reviews | Chasing Chapters`,
    description: tag.description || `Browse all book reviews tagged with ${tag.name} on Chasing Chapters.`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Find the tag
  const tags = await payload.find({
    collection: 'tags',
    where: {
      slug: { equals: slug }
    },
    limit: 1
  })

  if (!tags.docs.length) {
    notFound()
  }

  const tag = tags.docs[0] as Tag

  // Find reviews with this tag
  const reviews = await payload.find({
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
    },
    sort: '-publishedDate',
    limit: 50,
    depth: 2
  })

  return (
    <>
      {/* Back Navigation */}
      <PageWrapper padding="md">
        <Link
          href="/tags"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tags
        </Link>
      </PageWrapper>

      {/* Tag Header */}
      <section className="bg-gradient-to-br from-neutral-50 to-white">
        <PageWrapper>
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div 
                className="p-4 rounded-full shadow-lg"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                <TagIcon 
                  className="h-12 w-12 text-neutral-500"
                />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
              {tag.name}
            </h1>
            
            {tag.description && (
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-6">
                {tag.description}
              </p>
            )}

            <div className="text-neutral-500">
              {reviews.docs.length} review{reviews.docs.length !== 1 ? 's' : ''} tagged with {tag.name}
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-white">
        <PageWrapper>
          {reviews.docs.length > 0 ? (
            <ReviewGrid 
              reviews={reviews.docs as (Review & { coverImage?: Media; tags?: (number | Tag)[] })[]}
              showTitle={false}
            />
          ) : (
            <div className="text-center py-16">
              <TagIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                No Reviews Yet
              </h2>
              <p className="text-neutral-600 mb-6">
                No published reviews have been tagged with &quot;{tag.name}&quot; yet.
              </p>
              <Link href="/reviews" className="btn-primary">
                Browse All Reviews
              </Link>
            </div>
          )}
        </PageWrapper>
      </section>

      {/* Related Tags */}
      {reviews.docs.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <PageWrapper className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Explore More Topics
            </h2>
            <p className="text-neutral-600 mb-6">
              Discover reviews across different genres and topics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tags" className="btn-primary">
                Browse All Tags
              </Link>
              <Link href="/reviews" className="btn-outline">
                All Reviews
              </Link>
            </div>
          </PageWrapper>
        </section>
      )}
    </>
  )
}