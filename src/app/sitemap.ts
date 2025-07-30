import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Review, Tag } from '@/payload-types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'
  
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Static routes with high priority
    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/reviews`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/tags`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/currently-reading`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/want-to-read`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
    ]

    // Fetch all published reviews (using the correct status field from Review interface)
    const reviewsData = await payload.find({
      collection: 'reviews',
      where: {
        status: {
          equals: 'published'
        }
      },
      sort: '-publishedDate',
      limit: 1000, // Adjust based on expected number of reviews
      depth: 0, // We only need basic data for sitemap
    })

    // Generate review routes
    const reviewRoutes: MetadataRoute.Sitemap = reviewsData.docs.map((review: Review) => ({
      url: `${baseUrl}/reviews/${review.slug}`,
      lastModified: new Date(review.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // Fetch all tags (no status field in Tag interface)
    const tagsData = await payload.find({
      collection: 'tags',
      sort: 'name',
      limit: 1000,
      depth: 0,
    })

    // Generate tag routes
    const tagRoutes: MetadataRoute.Sitemap = tagsData.docs.map((tag: Tag) => ({
      url: `${baseUrl}/tags/${tag.slug}`,
      lastModified: new Date(tag.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Combine all routes
    const allRoutes = [...staticRoutes, ...reviewRoutes, ...tagRoutes]

    console.log(`Generated sitemap with ${allRoutes.length} URLs:`)
    console.log(`- ${staticRoutes.length} static routes`)
    console.log(`- ${reviewRoutes.length} review routes`)
    console.log(`- ${tagRoutes.length} tag routes`)

    return allRoutes

  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return basic static routes in case of error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/reviews`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/tags`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]
  }
}