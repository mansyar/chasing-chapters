import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../../src/app/(payload)/api/books/search/route'
import { GET as GetBookById } from '../../src/app/(payload)/api/books/[id]/route'
import { NextRequest } from 'next/server'

// Mock the cache module
vi.mock('../../src/lib/cache', () => ({
  bookSearchCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    clear: vi.fn(),
  },
  bookDetailsCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    clear: vi.fn(),
  },
  rateLimiter: {
    isAllowed: vi.fn().mockReturnValue(true),
    getRemainingRequests: vi.fn().mockReturnValue(100),
    getResetTime: vi.fn().mockReturnValue(null),
    cleanup: vi.fn(),
  }
}))

// Create a mock client instance
const mockClient = {
  searchAndProcessBooks: vi.fn(),
  getBookById: vi.fn(),
  processBookData: vi.fn()
}

// Mock the Google Books client
vi.mock('../../src/lib/google-books', () => ({
  getGoogleBooksClient: vi.fn(() => mockClient)
}))

describe('Google Books API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock console.error to suppress error logs in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Reset mock implementations and provide default responses to prevent undefined errors
    mockClient.searchAndProcessBooks.mockReset().mockResolvedValue({
      books: [],
      totalItems: 0,
      hasMore: false
    })
    mockClient.getBookById.mockReset().mockResolvedValue(null)
    mockClient.processBookData.mockReset().mockReturnValue({
      id: 'default',
      title: 'Default',
      authors: [],
      publishedDate: undefined,
      description: undefined,
      pageCount: undefined,
      categories: [],
      coverImageUrl: undefined,
      isbn: undefined,
      isbn13: undefined,
      publisher: undefined,
      language: undefined,
      averageRating: undefined,
      ratingsCount: undefined
    })
  })

  describe('/api/books/search', () => {
    it('should return search results with valid query', async () => {
      mockClient.searchAndProcessBooks.mockResolvedValue({
        books: [
          {
            id: 'test-id',
            title: 'Test Book',
            authors: ['Test Author'],
            publishedDate: '2023-01-01',
            categories: ['Fiction']
          }
        ],
        totalItems: 1,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/books/search?q=test+book')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.books).toHaveLength(1)
      expect(data.data.books[0].title).toBe('Test Book')
      expect(data.data.pagination).toBeDefined()
    })

    it('should return 400 for missing query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/books/search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query parameter "q" is required')
    })

    it('should validate maxResults parameter', async () => {
      // Test with 0, which should fail validation
      const request = new NextRequest('http://localhost:3000/api/books/search?q=test&maxResults=0')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('maxResults must be between 1 and 40')
    })

    it('should validate orderBy parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/books/search?q=test&orderBy=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid orderBy parameter. Must be "relevance" or "newest"')
    })

    it('should handle API errors with fallback messages', async () => {
      mockClient.searchAndProcessBooks.mockRejectedValue(
        new Error('Google Books API error: 403 Forbidden')
      )

      const request = new NextRequest('http://localhost:3000/api/books/search?q=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Google Books API quota exceeded or invalid API key')
      expect(data.fallback).toBe('You can enter book details manually')
    })

    it('should handle rate limit errors', async () => {
      mockClient.searchAndProcessBooks.mockRejectedValue(
        new Error('Rate limit exceeded. Try again in 30 seconds.')
      )

      const request = new NextRequest('http://localhost:3000/api/books/search?q=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many requests')
      expect(data.fallback).toBe('Manual entry is available')
    })

    it('should handle missing API key error', async () => {
      mockClient.searchAndProcessBooks.mockRejectedValue(
        new Error('GOOGLE_BOOKS_API_KEY environment variable is not set')
      )

      const request = new NextRequest('http://localhost:3000/api/books/search?q=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Google Books API not configured')
      expect(data.fallback).toBe('Manual book entry is available')
    })

    it('should calculate pagination correctly', async () => {
      mockClient.searchAndProcessBooks.mockResolvedValue({
        books: Array(10).fill(null).map((_, i) => ({
          id: `book-${i}`,
          title: `Book ${i}`,
          authors: ['Test Author']
        })),
        totalItems: 25,
        hasMore: true
      })

      const request = new NextRequest('http://localhost:3000/api/books/search?q=test&maxResults=10&startIndex=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.pagination.currentPage).toBe(2)
      expect(data.data.pagination.totalPages).toBe(3)
      expect(data.data.pagination.hasNextPage).toBe(true)
      expect(data.data.pagination.hasPrevPage).toBe(true)
    })
  })

  describe('/api/books/[id]', () => {
    it('should return book details for valid ID', async () => {
      const mockBook = {
        id: 'test-id',
        volumeInfo: {
          title: 'Test Book',
          authors: ['Test Author']
        }
      }

      mockClient.getBookById.mockResolvedValue(mockBook)
      mockClient.processBookData.mockReturnValue({
        id: 'test-id',
        title: 'Test Book',
        authors: ['Test Author'],
        publishedDate: undefined,
        description: undefined,
        pageCount: undefined,
        categories: [],
        coverImageUrl: undefined,
        isbn: undefined,
        isbn13: undefined,
        publisher: undefined,
        language: undefined,
        averageRating: undefined,
        ratingsCount: undefined
      })

      const request = new NextRequest('http://localhost:3000/api/books/test-id')
      const response = await GetBookById(request, { 
        params: Promise.resolve({ id: 'test-id' }) 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.book.title).toBe('Test Book')
    })

    it('should return 400 for empty ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/books/')
      const response = await GetBookById(request, { 
        params: Promise.resolve({ id: '' }) 
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Book ID is required')
    })

    it('should return 404 for non-existent book', async () => {
      mockClient.getBookById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/books/nonexistent')
      const response = await GetBookById(request, { 
        params: Promise.resolve({ id: 'nonexistent' }) 
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Book not found')
    })

    it('should handle API errors', async () => {
      mockClient.getBookById.mockRejectedValue(
        new Error('Google Books API error: 403 Forbidden')
      )

      const request = new NextRequest('http://localhost:3000/api/books/test-id')
      const response = await GetBookById(request, { 
        params: Promise.resolve({ id: 'test-id' }) 
      })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Google Books API quota exceeded or invalid API key')
    })
  })
})