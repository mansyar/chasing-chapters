import { NextRequest, NextResponse } from 'next/server'
import { getGoogleBooksClient } from '@/lib/google-books'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    if (!id?.trim()) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    const googleBooksClient = getGoogleBooksClient()
    const bookData = await googleBooksClient.getBookById(id)

    if (!bookData) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    const processedBook = googleBooksClient.processBookData(bookData)

    return NextResponse.json({
      success: true,
      data: {
        book: processedBook,
      },
    })

  } catch (error) {
    console.error('Book fetch API error:', error)

    // Handle specific Google Books API errors
    if (error instanceof Error) {
      if (error.message.includes('API error: 403')) {
        return NextResponse.json(
          { 
            error: 'Google Books API quota exceeded or invalid API key',
            details: 'Please check your API key configuration and usage limits'
          },
          { status: 503 }
        )
      }

      if (error.message.includes('API error: 404')) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }

      if (error.message.includes('GOOGLE_BOOKS_API_KEY')) {
        return NextResponse.json(
          { 
            error: 'Google Books API not configured',
            details: 'API key is missing from environment variables'
          },
          { status: 500 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch book',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : 'Internal server error'
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