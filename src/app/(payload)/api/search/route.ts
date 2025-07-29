import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Review, Tag, Media } from '@/payload-types'
import { searchCache, generateCacheKey } from '@/lib/search-cache'
import { calculateRelevanceScore } from '@/lib/search-highlight'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const readingStatus = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sort') || '-publishedDate'

    // Generate cache key
    const cacheKey = generateCacheKey({
      q: query,
      tags,
      status: readingStatus,
      page,
      limit,
      sort: sortBy
    })

    // Check cache first
    const cachedResult = searchCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true
      })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Build search conditions
    const searchConditions: any = {
      and: [
        {
          status: {
            equals: 'published'
          }
        }
      ]
    }

    // Add text search conditions
    if (query.trim()) {
      searchConditions.and.push({
        or: [
          {
            title: {
              contains: query
            }
          },
          {
            author: {
              contains: query
            }
          },
          {
            excerpt: {
              contains: query
            }
          },
          {
            genre: {
              contains: query
            }
          }
        ]
      })
    }

    // Add tag filtering
    if (tags.length > 0) {
      // Find tag IDs from slugs
      const tagResults = await payload.find({
        collection: 'tags',
        where: {
          slug: {
            in: tags
          }
        },
        limit: 100
      })

      const tagIds = tagResults.docs.map((tag: Tag) => tag.id)
      
      if (tagIds.length > 0) {
        searchConditions.and.push({
          tags: {
            in: tagIds
          }
        })
      }
    }

    // Add reading status filtering
    if (readingStatus && ['want-to-read', 'currently-reading', 'finished'].includes(readingStatus)) {
      searchConditions.and.push({
        readingStatus: {
          equals: readingStatus
        }
      })
    }

    // Perform the search
    const results = await payload.find({
      collection: 'reviews',
      where: searchConditions,
      sort: sortBy,
      page,
      limit,
      depth: 2
    })

    // Format the response with type safety
    const formattedResults = {
      docs: results.docs.map((review: Review) => ({
        id: review.id,
        title: review.title,
        slug: review.slug,
        author: review.author,
        excerpt: review.excerpt,
        rating: review.rating,
        publishedDate: review.publishedDate,
        readingStatus: review.readingStatus,
        coverImage: review.coverImage as Media,
        tags: (review.tags as Tag[]) || [],
        // Add search relevance metadata
        _searchScore: calculateRelevanceScore({
          title: review.title || '',
          author: review.author || '',
          excerpt: review.excerpt || '',
          genre: review.genre || '',
          content: typeof review.content === 'string' ? review.content : ''
        }, query)
      })),
      totalDocs: results.totalDocs,
      totalPages: results.totalPages,
      page: results.page,
      hasPrevPage: results.hasPrevPage,
      hasNextPage: results.hasNextPage,
      prevPage: results.prevPage,
      nextPage: results.nextPage
    }

    // Sort by relevance if there's a search query
    if (query.trim()) {
      formattedResults.docs.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0))
    }

    const response = {
      success: true,
      data: formattedResults,
      query: {
        q: query,
        tags,
        status: readingStatus,
        page,
        limit,
        sort: sortBy
      }
    }

    // Cache the result (cache for 5 minutes for search results)
    searchCache.set(cacheKey, response, 5 * 60 * 1000)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform search',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

