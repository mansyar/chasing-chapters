import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoogleBooksClient, getGoogleBooksClient } from '../../src/lib/google-books'
import { bookSearchCache, bookDetailsCache, rateLimiter } from '../../src/lib/cache'

// Mock environment variable
vi.stubEnv('GOOGLE_BOOKS_API_KEY', 'test-api-key')

describe('Google Books API Integration', () => {
  beforeEach(() => {
    // Clear caches and rate limiter before each test
    bookSearchCache.clear()
    bookDetailsCache.clear()
    rateLimiter.cleanup()
    
    // Reset the rate limiter by clearing its internal state
    ;(rateLimiter as any).limits.clear()
    
    // Clear fetch mocks
    vi.clearAllMocks()
    
    // Mock console.error to suppress error logs in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('GoogleBooksClient', () => {
    let client: GoogleBooksClient

    beforeEach(() => {
      client = new GoogleBooksClient('test-api-key')
    })

    it('should create a client instance', () => {
      expect(client).toBeInstanceOf(GoogleBooksClient)
    })

    describe('searchBooks', () => {
      it('should search for books with valid parameters', async () => {
        const mockResponse = {
          kind: 'books#volumes',
          totalItems: 1,
          items: [
            {
              id: 'test-book-id',
              volumeInfo: {
                title: 'Test Book',
                authors: ['Test Author'],
                publishedDate: '2023-01-01',
                description: 'A test book',
                pageCount: 200,
                categories: ['Fiction'],
                industryIdentifiers: [
                  { type: 'ISBN_13', identifier: '9781234567890' }
                ],
                imageLinks: {
                  thumbnail: 'https://example.com/cover.jpg'
                }
              }
            }
          ]
        }

        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await client.searchBooks({
          query: 'test book',
          maxResults: 10
        })

        expect(result.totalItems).toBe(1)
        expect(result.items).toHaveLength(1)
        expect(result.items![0].volumeInfo.title).toBe('Test Book')
      })

      it('should cache search results', async () => {
        const mockResponse = {
          kind: 'books#volumes',
          totalItems: 1,
          items: [
            {
              id: 'test-book-id',
              volumeInfo: {
                title: 'Test Book',
                authors: ['Test Author']
              }
            }
          ]
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        // First call
        await client.searchBooks({ query: 'test book' })
        
        // Second call should use cache
        await client.searchBooks({ query: 'test book' })

        // Fetch should only be called once
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      it('should handle API errors', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        })

        await expect(client.searchBooks({ query: 'test' }))
          .rejects
          .toThrow('Google Books API error: 403 Forbidden')
      })

      it('should respect rate limiting', async () => {
        // Force rate limit by making many requests
        for (let i = 0; i < 101; i++) {
          rateLimiter.isAllowed('google-books-api')
        }

        await expect(client.searchBooks({ query: 'test' }))
          .rejects
          .toThrow('Rate limit exceeded')
      })
    })

    describe('getBookById', () => {
      it('should fetch a book by ID', async () => {
        const mockBook = {
          id: 'test-book-id',
          volumeInfo: {
            title: 'Test Book',
            authors: ['Test Author'],
            publishedDate: '2023-01-01'
          }
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockBook)
        })

        const result = await client.getBookById('test-book-id')

        expect(result).toEqual(mockBook)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('test-book-id'),
          expect.objectContaining({
            headers: { 'User-Agent': 'Chasing-Chapters/1.0' }
          })
        )
      })

      it('should return null for 404 errors', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })

        const result = await client.getBookById('nonexistent-id')
        expect(result).toBeNull()
      })

      it('should cache book details', async () => {
        const mockBook = {
          id: 'test-book-id',
          volumeInfo: {
            title: 'Test Book',
            authors: ['Test Author']
          }
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockBook)
        })

        // First call
        await client.getBookById('test-book-id')
        
        // Second call should use cache
        await client.getBookById('test-book-id')

        // Fetch should only be called once
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    describe('processBookData', () => {
      it('should process book data correctly', () => {
        const mockItem = {
          id: 'test-id',
          volumeInfo: {
            title: 'Test Book',
            authors: ['Author One', 'Author Two'],
            publishedDate: '2023-01-01',
            description: 'A test description',
            pageCount: 250,
            categories: ['Fiction', 'Drama'],
            industryIdentifiers: [
              { type: 'ISBN_10', identifier: '1234567890' },
              { type: 'ISBN_13', identifier: '9781234567890' }
            ],
            imageLinks: {
              thumbnail: 'https://example.com/thumb.jpg',
              small: 'https://example.com/small.jpg'
            },
            publisher: 'Test Publisher',
            language: 'en',
            averageRating: 4.5,
            ratingsCount: 100
          }
        }

        const processed = client.processBookData(mockItem)

        expect(processed).toEqual({
          id: 'test-id',
          title: 'Test Book',
          authors: ['Author One', 'Author Two'],
          publishedDate: '2023-01-01',
          description: 'A test description',
          pageCount: 250,
          categories: ['Fiction', 'Drama'],
          coverImageUrl: 'https://example.com/small.jpg', // Should prefer larger image
          isbn: '1234567890',
          isbn13: '9781234567890',
          publisher: 'Test Publisher',
          language: 'en',
          averageRating: 4.5,
          ratingsCount: 100
        })
      })

      it('should handle missing data gracefully', () => {
        const mockItem = {
          id: 'test-id',
          volumeInfo: {
            title: 'Minimal Book'
          }
        }

        const processed = client.processBookData(mockItem)

        expect(processed).toEqual({
          id: 'test-id',
          title: 'Minimal Book',
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
    })

    describe('searchAndProcessBooks', () => {
      it('should search and process books with pagination info', async () => {
        const mockResponse = {
          kind: 'books#volumes',
          totalItems: 25,
          items: Array(10).fill(null).map((_, i) => ({
            id: `book-${i}`,
            volumeInfo: {
              title: `Book ${i}`,
              authors: ['Test Author']
            }
          }))
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await client.searchAndProcessBooks({
          query: 'test',
          maxResults: 10,
          startIndex: 0
        })

        expect(result.books).toHaveLength(10)
        expect(result.totalItems).toBe(25)
        expect(result.hasMore).toBe(true)
        expect(result.books[0].title).toBe('Book 0')
      })
    })
  })

  describe('getGoogleBooksClient', () => {
    it('should return a singleton instance', () => {
      const client1 = getGoogleBooksClient()
      const client2 = getGoogleBooksClient()
      
      expect(client1).toBe(client2)
      expect(client1).toBeInstanceOf(GoogleBooksClient)
    })

    it('should throw error if API key is missing', async () => {
      // Mock the environment variable to be empty
      const originalEnv = process.env.GOOGLE_BOOKS_API_KEY
      process.env.GOOGLE_BOOKS_API_KEY = ''
      
      // Clear the module cache to reset the singleton
      vi.resetModules()
      
      try {
        const { getGoogleBooksClient } = await import('../../src/lib/google-books')
        expect(() => getGoogleBooksClient()).toThrow('GOOGLE_BOOKS_API_KEY environment variable is not set')
      } finally {
        // Restore the original environment variable
        process.env.GOOGLE_BOOKS_API_KEY = originalEnv
      }
    })
  })
})