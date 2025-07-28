import { NextRequest, NextResponse } from 'next/server'
import { getGoogleBooksClient, type BookSearchParams } from '@/lib/google-books'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract and validate query parameters
    const query = searchParams.get('q')?.trim()
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    const maxResults = Math.min(
      parseInt(searchParams.get('maxResults') || '10', 10),
      40 // Google Books API maximum
    )
    
    const startIndex = Math.max(
      parseInt(searchParams.get('startIndex') || '0', 10),
      0
    )

    const orderBy = searchParams.get('orderBy') as 'relevance' | 'newest' || 'relevance'
    const printType = searchParams.get('printType') as 'all' | 'books' | 'magazines' || 'books'
    const filter = searchParams.get('filter') as 'partial' | 'full' | 'free-ebooks' | 'paid-ebooks' | 'ebooks' || undefined

    // Validate parameters
    if (!['relevance', 'newest'].includes(orderBy)) {
      return NextResponse.json(
        { error: 'Invalid orderBy parameter. Must be "relevance" or "newest"' },
        { status: 400 }
      )
    }

    if (!['all', 'books', 'magazines'].includes(printType)) {
      return NextResponse.json(
        { error: 'Invalid printType parameter. Must be "all", "books", or "magazines"' },
        { status: 400 }
      )
    }

    if (maxResults < 1 || maxResults > 40) {
      return NextResponse.json(
        { error: 'maxResults must be between 1 and 40' },
        { status: 400 }
      )
    }

    // Prepare search parameters
    const searchOptions: BookSearchParams = {
      query,
      maxResults,
      startIndex,
      orderBy,
      printType,
      filter,
    }

    // Perform search
    const googleBooksClient = getGoogleBooksClient()
    const result = await googleBooksClient.searchAndProcessBooks(searchOptions)

    // Calculate pagination info
    const currentPage = Math.floor(startIndex / maxResults) + 1
    const totalPages = Math.ceil(result.totalItems / maxResults)
    const hasNextPage = result.hasMore
    const hasPrevPage = startIndex > 0

    // Return formatted response
    return NextResponse.json({
      success: true,
      data: {
        books: result.books,
        pagination: {
          currentPage,
          totalPages,
          totalItems: result.totalItems,
          itemsPerPage: maxResults,
          startIndex,
          hasNextPage,
          hasPrevPage,
        },
        query: {
          q: query,
          orderBy,
          printType,
          filter,
        },
      },
    })

  } catch (error) {
    console.error('Book search API error:', error)

    // Handle specific Google Books API errors
    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { 
            error: 'Too many requests',
            details: error.message,
            fallback: 'Manual entry is available'
          },
          { status: 429 }
        )
      }

      if (error.message.includes('API error: 403')) {
        return NextResponse.json(
          { 
            error: 'Google Books API quota exceeded or invalid API key',
            details: 'Please check your API key configuration and usage limits',
            fallback: 'You can enter book details manually'
          },
          { status: 503 }
        )
      }

      if (error.message.includes('API error: 400')) {
        return NextResponse.json(
          { 
            error: 'Invalid search parameters',
            details: error.message,
            fallback: 'Try different search terms'
          },
          { status: 400 }
        )
      }

      if (error.message.includes('GOOGLE_BOOKS_API_KEY')) {
        return NextResponse.json(
          { 
            error: 'Google Books API not configured',
            details: 'API key is missing from environment variables',
            fallback: 'Manual book entry is available'
          },
          { status: 500 }
        )
      }

      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { 
            error: 'Network error',
            details: 'Unable to connect to Google Books API',
            fallback: 'Check your internet connection or try manual entry'
          },
          { status: 503 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Book search failed',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : 'Internal server error',
        fallback: 'You can enter book details manually using the Manual Entry option'
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}