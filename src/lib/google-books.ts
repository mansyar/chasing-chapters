import { bookSearchCache, bookDetailsCache, rateLimiter } from './cache'

export interface GoogleBookItem {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    publishedDate?: string
    description?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
      small?: string
      medium?: string
      large?: string
      extraLarge?: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    publisher?: string
    language?: string
    printType?: 'BOOK' | 'MAGAZINE'
    maturityRating?: 'NOT_MATURE' | 'MATURE'
    averageRating?: number
    ratingsCount?: number
  }
  saleInfo?: {
    country?: string
    saleability?: string
    isEbook?: boolean
    listPrice?: {
      amount: number
      currencyCode: string
    }
    retailPrice?: {
      amount: number
      currencyCode: string
    }
  }
}

export interface GoogleBooksSearchResponse {
  kind: string
  totalItems: number
  items?: GoogleBookItem[]
}

export interface BookSearchParams {
  query: string
  maxResults?: number
  startIndex?: number
  orderBy?: 'relevance' | 'newest'
  printType?: 'all' | 'books' | 'magazines'
  filter?: 'partial' | 'full' | 'free-ebooks' | 'paid-ebooks' | 'ebooks'
}

export interface ProcessedBookData {
  id: string
  title: string
  authors: string[]
  publishedDate?: string
  description?: string
  pageCount?: number
  categories: string[]
  coverImageUrl?: string
  isbn?: string
  isbn13?: string
  publisher?: string
  language?: string
  averageRating?: number
  ratingsCount?: number
}

class GoogleBooksClient {
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/books/v1/volumes'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchBooks(params: BookSearchParams): Promise<GoogleBooksSearchResponse> {
    const {
      query,
      maxResults = 10,
      startIndex = 0,
      orderBy = 'relevance',
      printType = 'books',
      filter,
    } = params

    // Create cache key
    const cacheKey = `search:${JSON.stringify(params)}`
    
    // Check cache first
    const cachedResult = bookSearchCache.get(cacheKey)
    if (cachedResult) {
      console.log('Returning cached search result for:', query)
      return cachedResult
    }

    // Check rate limit
    const clientId = 'google-books-api' // In production, you might want to use IP or user ID
    if (!rateLimiter.isAllowed(clientId)) {
      const resetTime = rateLimiter.getResetTime(clientId)
      const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60
      throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`)
    }

    const searchParams = new URLSearchParams({
      q: query,
      key: this.apiKey,
      maxResults: Math.min(maxResults, 40).toString(), // Google Books API max is 40
      startIndex: startIndex.toString(),
      orderBy,
      printType,
    })

    if (filter) {
      searchParams.append('filter', filter)
    }

    const url = `${this.baseUrl}?${searchParams.toString()}`

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Chasing-Chapters/1.0',
        },
      })

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`)
      }

      const data: GoogleBooksSearchResponse = await response.json()
      
      // Cache the result (5 minutes)
      bookSearchCache.set(cacheKey, data, 300)
      
      return data
    } catch (error) {
      console.error('Google Books API search failed:', error)
      throw error
    }
  }

  async getBookById(bookId: string): Promise<GoogleBookItem | null> {
    // Check cache first
    const cacheKey = `book:${bookId}`
    const cachedResult = bookDetailsCache.get(cacheKey)
    if (cachedResult) {
      console.log('Returning cached book details for:', bookId)
      return cachedResult
    }

    // Check rate limit
    const clientId = 'google-books-api'
    if (!rateLimiter.isAllowed(clientId)) {
      const resetTime = rateLimiter.getResetTime(clientId)
      const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60
      throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`)
    }

    const url = `${this.baseUrl}/${bookId}?key=${this.apiKey}`

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Chasing-Chapters/1.0',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`)
      }

      const data: GoogleBookItem = await response.json()
      
      // Cache the result (30 minutes)
      bookDetailsCache.set(cacheKey, data, 1800)
      
      return data
    } catch (error) {
      console.error('Google Books API get book failed:', error)
      throw error
    }
  }

  processBookData(item: GoogleBookItem): ProcessedBookData {
    const { volumeInfo } = item

    // Extract ISBN numbers
    let isbn: string | undefined
    let isbn13: string | undefined

    if (volumeInfo.industryIdentifiers) {
      for (const identifier of volumeInfo.industryIdentifiers) {
        if (identifier.type === 'ISBN_10') {
          isbn = identifier.identifier
        } else if (identifier.type === 'ISBN_13') {
          isbn13 = identifier.identifier
        }
      }
    }

    // Get the best available cover image
    let coverImageUrl: string | undefined
    if (volumeInfo.imageLinks) {
      // Prefer larger images, fall back to smaller ones
      coverImageUrl =
        volumeInfo.imageLinks.extraLarge ||
        volumeInfo.imageLinks.large ||
        volumeInfo.imageLinks.medium ||
        volumeInfo.imageLinks.small ||
        volumeInfo.imageLinks.thumbnail ||
        volumeInfo.imageLinks.smallThumbnail
    }

    // Convert Google Books data to our normalized format
    return {
      id: item.id,
      title: volumeInfo.title || 'Unknown Title',
      authors: volumeInfo.authors || [],
      publishedDate: volumeInfo.publishedDate,
      description: volumeInfo.description,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories || [],
      coverImageUrl,
      isbn,
      isbn13,
      publisher: volumeInfo.publisher,
      language: volumeInfo.language,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
    }
  }

  async searchAndProcessBooks(params: BookSearchParams): Promise<{
    books: ProcessedBookData[]
    totalItems: number
    hasMore: boolean
  }> {
    const response = await this.searchBooks(params)
    const books = response.items?.map((item) => this.processBookData(item)) || []
    const currentCount = (params.startIndex || 0) + books.length
    const hasMore = currentCount < response.totalItems

    return {
      books,
      totalItems: response.totalItems,
      hasMore,
    }
  }
}

// Singleton instance
let googleBooksClient: GoogleBooksClient | null = null

export function getGoogleBooksClient(): GoogleBooksClient {
  if (!googleBooksClient) {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_BOOKS_API_KEY environment variable is not set')
    }
    googleBooksClient = new GoogleBooksClient(apiKey)
  }
  return googleBooksClient
}

export { GoogleBooksClient }