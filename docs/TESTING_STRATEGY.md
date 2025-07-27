# 🧪 Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for Chasing Chapters, covering unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Stack

- **Unit Tests**: Vitest + React Testing Library
- **Integration Tests**: Vitest + Supertest (API testing)
- **End-to-End Tests**: Playwright
- **Component Testing**: React Testing Library
- **Test Utilities**: MSW (Mock Service Worker), Testing Library User Events

## Test Structure

```
tests/
├── __mocks__/              # Global mocks
│   ├── next-image.js
│   └── payload.js
├── unit/                   # Unit tests
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── lib/
├── integration/            # Integration tests
│   ├── api/
│   ├── collections/
│   └── auth/
├── e2e/                    # End-to-end tests
│   ├── frontend/
│   ├── admin/
│   └── workflows/
├── fixtures/               # Test data
│   ├── reviews.json
│   ├── tags.json
│   └── users.json
└── utils/                  # Test utilities
    ├── setup.ts
    ├── mocks.ts
    ├── factories.ts
    └── helpers.ts
```

## Configuration Files

### Vitest Configuration

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/utils/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'src/payload-types.ts',
        'src/app/(payload)/',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['line'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

## Test Utilities and Mocks

### Test Setup

```typescript
// tests/utils/setup.ts
import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
```

### Mock Data Factories

```typescript
// tests/utils/factories.ts
import { Review, Tag, Media } from '@/types'

export const createMockReview = (overrides: Partial<Review> = {}): Review => ({
  id: '1',
  title: 'The Great Gatsby',
  slug: 'the-great-gatsby',
  author: 'F. Scott Fitzgerald',
  excerpt: 'A masterpiece of American literature exploring themes of wealth and love.',
  content: {
    root: {
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'This is a fantastic book about the American Dream.',
            },
          ],
        },
      ],
    },
  },
  rating: 4.5,
  tags: [createMockTag()],
  coverImage: createMockMedia(),
  readingStatus: 'finished',
  dateStarted: '2024-01-15T00:00:00.000Z',
  dateFinished: '2024-01-25T00:00:00.000Z',
  publishedDate: '2024-01-26T00:00:00.000Z',
  status: 'published',
  bookMetadata: {
    pageCount: 180,
    genre: 'Fiction',
    publishYear: 1925,
    isbn: '9780743273565',
    googleBooksId: 'iJZqAAAAMAAJ',
  },
  createdAt: '2024-01-26T10:00:00.000Z',
  updatedAt: '2024-01-26T10:00:00.000Z',
  ...overrides,
})

export const createMockTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: '1',
  name: 'Classic Literature',
  slug: 'classic-literature',
  description: 'Timeless works of literature',
  color: '#3B82F6',
  status: 'active',
  ...overrides,
})

export const createMockMedia = (overrides: Partial<Media> = {}): Media => ({
  id: '1',
  url: '/uploads/gatsby-cover.jpg',
  alt: 'The Great Gatsby book cover',
  caption: 'Book cover',
  width: 400,
  height: 600,
  sizes: {
    thumbnail: {
      url: '/uploads/gatsby-cover-thumbnail.jpg',
      width: 200,
      height: 300,
    },
    card: {
      url: '/uploads/gatsby-cover-card.jpg',
      width: 400,
      height: 600,
    },
  },
  ...overrides,
})

export const createMockReviews = (count: number): Review[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockReview({
      id: String(index + 1),
      title: `Book Title ${index + 1}`,
      slug: `book-title-${index + 1}`,
      author: `Author ${index + 1}`,
    })
  )
}
```

### MSW Handlers

```typescript
// tests/utils/mocks/server.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createMockReviews, createMockReview } from '../factories'

export const handlers = [
  // Get reviews
  http.get('/api/reviews', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('where[status][equals]')

    const allReviews = createMockReviews(25)
    const filteredReviews = status
      ? allReviews.filter((review) => review.status === status)
      : allReviews

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const reviews = filteredReviews.slice(startIndex, endIndex)

    return HttpResponse.json({
      docs: reviews,
      totalDocs: filteredReviews.length,
      limit,
      totalPages: Math.ceil(filteredReviews.length / limit),
      page,
      pagingCounter: startIndex + 1,
      hasPrevPage: page > 1,
      hasNextPage: endIndex < filteredReviews.length,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: endIndex < filteredReviews.length ? page + 1 : null,
    })
  }),

  // Get single review
  http.get('/api/reviews/:id', ({ params }) => {
    const review = createMockReview({ id: params.id as string })
    return HttpResponse.json(review)
  }),

  // Get review by slug
  http.get('/api/reviews/slug/:slug', ({ params }) => {
    const review = createMockReview({ slug: params.slug as string })
    return HttpResponse.json(review)
  }),

  // Create review
  http.post('/api/reviews', async ({ request }) => {
    const data = await request.json()
    const review = createMockReview(data as any)
    return HttpResponse.json(review, { status: 201 })
  }),

  // Google Books API
  http.get('/api/books/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    return HttpResponse.json({
      kind: 'books#volumes',
      totalItems: 1,
      items: [
        {
          id: 'iJZqAAAAMAAJ',
          volumeInfo: {
            title: 'The Great Gatsby',
            authors: ['F. Scott Fitzgerald'],
            publishedDate: '1925',
            description: 'A masterpiece of American literature...',
            pageCount: 180,
            categories: ['Fiction'],
            imageLinks: {
              thumbnail: 'https://example.com/thumbnail.jpg',
            },
            industryIdentifiers: [
              {
                type: 'ISBN_13',
                identifier: '9780743273565',
              },
            ],
          },
        },
      ],
    })
  }),
]

export const server = setupServer(...handlers)
```

## Unit Testing Patterns

### Component Testing

```typescript
// tests/unit/components/ReviewCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewCard } from '@/components/ReviewCard'
import { createMockReview } from '../../utils/factories'

describe('ReviewCard', () => {
  const mockReview = createMockReview()
  const user = userEvent.setup()

  it('renders review information correctly', () => {
    render(<ReviewCard review={mockReview} />)

    expect(screen.getByText(mockReview.title)).toBeInTheDocument()
    expect(screen.getByText(`by ${mockReview.author}`)).toBeInTheDocument()
    expect(screen.getByText(mockReview.excerpt)).toBeInTheDocument()

    // Check star rating
    const stars = screen.getAllByText('★')
    expect(stars).toHaveLength(Math.floor(mockReview.rating))
  })

  it('displays cover image when available', () => {
    render(<ReviewCard review={mockReview} />)

    const image = screen.getByRole('img', { name: mockReview.coverImage!.alt })
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', expect.stringContaining('gatsby-cover'))
  })

  it('handles missing cover image gracefully', () => {
    const reviewWithoutImage = createMockReview({ coverImage: undefined })
    render(<ReviewCard review={reviewWithoutImage} />)

    const image = screen.queryByRole('img')
    expect(image).not.toBeInTheDocument()
  })

  it('calls onTagClick when tag is clicked', async () => {
    const onTagClick = vi.fn()
    render(<ReviewCard review={mockReview} onTagClick={onTagClick} />)

    const tagButton = screen.getByText(mockReview.tags[0].name)
    await user.click(tagButton)

    expect(onTagClick).toHaveBeenCalledWith(mockReview.tags[0].slug)
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(
      <ReviewCard review={mockReview} variant="compact" />
    )

    let card = screen.getByRole('article')
    expect(card).toHaveClass('p-4')

    rerender(<ReviewCard review={mockReview} variant="featured" />)

    card = screen.getByRole('article')
    expect(card).toHaveClass('p-8')
  })

  it('handles image load errors', () => {
    render(<ReviewCard review={mockReview} />)

    const image = screen.getByRole('img')
    fireEvent.error(image)

    // Image should be hidden after error
    expect(image).not.toBeInTheDocument()
  })
})
```

### Hook Testing

```typescript
// tests/unit/hooks/useReviews.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useReviews } from '@/hooks/useReviews'
import { createMockReviews } from '../../utils/factories'

describe('useReviews', () => {
  it('fetches reviews on mount', async () => {
    const { result } = renderHook(() => useReviews())

    expect(result.current.loading).toBe(true)
    expect(result.current.reviews).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.reviews).toHaveLength(10)
    expect(result.current.error).toBeNull()
  })

  it('handles pagination correctly', async () => {
    const { result } = renderHook(() =>
      useReviews({ page: 2, limit: 5 })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.pagination.currentPage).toBe(2)
    expect(result.current.pagination.hasPrevPage).toBe(true)
    expect(result.current.reviews).toHaveLength(5)
  })

  it('refetches data when refetch is called', async () => {
    const { result } = renderHook(() => useReviews())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.loading).toBe(false)

    await act(() => result.current.refetch())

    expect(result.current.loading).toBe(false)
    expect(result.current.reviews).toHaveLength(10)
  })

  it('handles errors gracefully', async () => {
    // Mock API failure
    server.use(
      http.get('/api/reviews', () => {
        return HttpResponse.json(
          { message: 'Server error' },
          { status: 500 }
        )
      })
    )

    const { result } = renderHook(() => useReviews())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch reviews')
    expect(result.current.reviews).toEqual([])
  })
})
```

### Utility Function Testing

```typescript
// tests/unit/utils/formatRating.test.ts
import { formatRating, truncateText, generateSlug } from '@/lib/utils'

describe('formatRating', () => {
  it('formats ratings correctly', () => {
    expect(formatRating(5)).toBe('★★★★★ (5.0)')
    expect(formatRating(4.5)).toBe('★★★★☆ (4.5)')
    expect(formatRating(0)).toBe('☆☆☆☆☆ (0.0)')
  })

  it('handles edge cases', () => {
    expect(formatRating(-1)).toBe('☆☆☆☆☆ (-1.0)')
    expect(formatRating(6)).toBe('★★★★★ (6.0)')
    expect(formatRating(2.7)).toBe('★★☆☆☆ (2.7)')
  })
})

describe('truncateText', () => {
  it('truncates long text correctly', () => {
    const longText = 'This is a very long text that should be truncated at some point'
    expect(truncateText(longText, 20)).toBe('This is a very long...')
  })

  it('preserves short text', () => {
    const shortText = 'Short text'
    expect(truncateText(shortText, 20)).toBe('Short text')
  })

  it('handles edge cases', () => {
    expect(truncateText('', 10)).toBe('')
    expect(truncateText('Test', 0)).toBe('...')
    expect(truncateText('Test', 4)).toBe('Test')
  })
})

describe('generateSlug', () => {
  it('generates slugs correctly', () => {
    expect(generateSlug('The Great Gatsby')).toBe('the-great-gatsby')
    expect(generateSlug('Book Title with Numbers 123')).toBe('book-title-with-numbers-123')
    expect(generateSlug('Special Characters!@#$%')).toBe('special-characters')
  })

  it('handles empty strings', () => {
    expect(generateSlug('')).toBe('')
    expect(generateSlug('   ')).toBe('')
  })
})
```

## Integration Testing

### API Route Testing

```typescript
// tests/integration/api/reviews.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/reviews/route'
import { createMockReview } from '../../utils/factories'

describe('/api/reviews', () => {
  describe('GET', () => {
    it('returns published reviews', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10',
          'where[status][equals]': 'published',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const data = JSON.parse(res._getData())
      expect(data.docs).toHaveLength(10)
      expect(data.totalDocs).toBeGreaterThan(0)
      expect(data.page).toBe(1)
    })

    it('handles pagination correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '2',
          limit: '5',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const data = JSON.parse(res._getData())
      expect(data.page).toBe(2)
      expect(data.limit).toBe(5)
      expect(data.docs).toHaveLength(5)
    })
  })

  describe('POST', () => {
    it('creates a new review', async () => {
      const reviewData = {
        title: 'New Book Review',
        author: 'Author Name',
        excerpt: 'A great book review',
        content: { root: { children: [] } },
        rating: 4.5,
        readingStatus: 'finished',
        status: 'published',
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: reviewData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)

      const data = JSON.parse(res._getData())
      expect(data.title).toBe(reviewData.title)
      expect(data.author).toBe(reviewData.author)
      expect(data.rating).toBe(reviewData.rating)
    })

    it('validates required fields', async () => {
      const invalidData = {
        title: '', // Missing required title
        author: 'Author Name',
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: invalidData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)

      const data = JSON.parse(res._getData())
      expect(data.errors).toBeDefined()
      expect(data.errors[0].field).toBe('title')
    })
  })
})
```

### Payload Collection Testing

```typescript
// tests/integration/collections/Reviews.test.ts
import payload from 'payload'
import { createMockReview } from '../../utils/factories'

describe('Reviews Collection', () => {
  beforeAll(async () => {
    await payload.init({
      secret: 'test-secret',
      local: true,
    })
  })

  afterAll(async () => {
    await payload.db.destroy()
  })

  describe('create', () => {
    it('creates a review with valid data', async () => {
      const reviewData = {
        title: 'Test Review',
        author: 'Test Author',
        excerpt: 'Test excerpt',
        content: { root: { children: [] } },
        rating: 4.5,
        readingStatus: 'finished',
        status: 'published',
      }

      const review = await payload.create({
        collection: 'reviews',
        data: reviewData,
      })

      expect(review.title).toBe(reviewData.title)
      expect(review.slug).toBe('test-review')
      expect(review.rating).toBe(reviewData.rating)
      expect(review.publishedDate).toBeDefined()
    })

    it('auto-generates slug from title', async () => {
      const review = await payload.create({
        collection: 'reviews',
        data: {
          title: 'The Great Book Title',
          author: 'Author',
          excerpt: 'Excerpt',
          content: { root: { children: [] } },
          rating: 4,
          readingStatus: 'finished',
          status: 'draft',
        },
      })

      expect(review.slug).toBe('the-great-book-title')
    })

    it('validates rating range', async () => {
      await expect(
        payload.create({
          collection: 'reviews',
          data: {
            title: 'Test',
            author: 'Author',
            excerpt: 'Excerpt',
            content: { root: { children: [] } },
            rating: 6, // Invalid rating
            readingStatus: 'finished',
            status: 'draft',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('read', () => {
    it('filters by status correctly', async () => {
      const { docs } = await payload.find({
        collection: 'reviews',
        where: {
          status: {
            equals: 'published',
          },
        },
      })

      docs.forEach((review) => {
        expect(review.status).toBe('published')
      })
    })

    it('sorts by publishedDate correctly', async () => {
      const { docs } = await payload.find({
        collection: 'reviews',
        sort: '-publishedDate',
        limit: 5,
      })

      for (let i = 1; i < docs.length; i++) {
        const current = new Date(docs[i].publishedDate)
        const previous = new Date(docs[i - 1].publishedDate)
        expect(current.getTime()).toBeLessThanOrEqual(previous.getTime())
      }
    })
  })

  describe('hooks', () => {
    it('sets publishedDate when status changes to published', async () => {
      const review = await payload.create({
        collection: 'reviews',
        data: {
          title: 'Draft Review',
          author: 'Author',
          excerpt: 'Excerpt',
          content: { root: { children: [] } },
          rating: 4,
          readingStatus: 'finished',
          status: 'draft',
        },
      })

      expect(review.publishedDate).toBeUndefined()

      const updatedReview = await payload.update({
        collection: 'reviews',
        id: review.id,
        data: {
          status: 'published',
        },
      })

      expect(updatedReview.publishedDate).toBeDefined()
    })
  })
})
```

## End-to-End Testing

### Frontend User Flows

```typescript
// tests/e2e/frontend/reviews.e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Reviews Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reviews')
  })

  test('displays list of reviews', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('All Reviews')

    const reviewCards = page.locator('[data-testid="review-card"]')
    await expect(reviewCards).toHaveCount(10)

    const firstCard = reviewCards.first()
    await expect(firstCard.locator('h3')).toBeVisible()
    await expect(firstCard.locator('[data-testid="star-rating"]')).toBeVisible()
  })

  test('filters reviews by tag', async ({ page }) => {
    // Click on a tag filter
    await page.locator('[data-testid="tag-filter"]').first().click()

    // Wait for filtered results
    await page.waitForURL(/.*tags=.*/);

    // Verify filtered results
    const reviewCards = page.locator('[data-testid="review-card"]')
    await expect(reviewCards).toHaveCountGreaterThan(0)

    // Check that all visible reviews have the selected tag
    const tagNames = await page.locator('[data-testid="review-tag"]').allTextContents()
    expect(tagNames.length).toBeGreaterThan(0)
  })

  test('navigates to individual review page', async ({ page }) => {
    const firstReviewTitle = await page.locator('[data-testid="review-card"] h3').first().textContent()
    await page.locator('[data-testid="review-card"]').first().click()

    // Should navigate to review detail page
    await expect(page).toHaveURL(/\/reviews\/.*/)
    await expect(page.locator('h1')).toContainText(firstReviewTitle!)
  })

  test('search functionality works', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('gatsby')
    await page.locator('[data-testid="search-button"]').click()

    await page.waitForURL(/.*q=gatsby.*/);

    const reviewCards = page.locator('[data-testid="review-card"]')
    await expect(reviewCards).toHaveCountGreaterThan(0)

    // Check that search results contain the search term
    const titles = await page.locator('[data-testid="review-card"] h3').allTextContents()
    expect(titles.some(title => title.toLowerCase().includes('gatsby'))).toBe(true)
  })

  test('pagination works correctly', async ({ page }) => {
    // Go to page 2
    await page.locator('[data-testid="pagination-next"]').click()

    await expect(page).toHaveURL(/.*page=2.*/)

    const reviewCards = page.locator('[data-testid="review-card"]')
    await expect(reviewCards).toHaveCountGreaterThan(0)

    // Previous button should be enabled
    await expect(page.locator('[data-testid="pagination-prev"]')).toBeEnabled()
  })

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()

    const reviewCards = page.locator('[data-testid="review-card"]')
    await expect(reviewCards).toHaveCount(10)

    // Test mobile navigation
    await page.locator('[data-testid="mobile-menu-toggle"]').click()
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
  })
})

test.describe('Review Detail Page', () => {
  test('displays complete review information', async ({ page }) => {
    await page.goto('/reviews/the-great-gatsby')

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-testid="book-author"]')).toBeVisible()
    await expect(page.locator('[data-testid="star-rating"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="book-metadata"]')).toBeVisible()

    // Check cover image
    await expect(page.locator('[data-testid="book-cover"]')).toBeVisible()

    // Check tags
    const tags = page.locator('[data-testid="review-tag"]')
    await expect(tags).toHaveCountGreaterThan(0)
  })

  test('social sharing works', async ({ page }) => {
    await page.goto('/reviews/the-great-gatsby')

    const shareButton = page.locator('[data-testid="share-button"]')
    await expect(shareButton).toBeVisible()

    // Test share functionality (mock or actual implementation)
    await shareButton.click()
    await expect(page.locator('[data-testid="share-menu"]')).toBeVisible()
  })

  test('related reviews section appears', async ({ page }) => {
    await page.goto('/reviews/the-great-gatsby')

    await expect(page.locator('[data-testid="related-reviews"]')).toBeVisible()

    const relatedCards = page.locator('[data-testid="related-review-card"]')
    await expect(relatedCards).toHaveCountGreaterThan(0)
  })
})
```

### Admin Panel E2E Tests

```typescript
// tests/e2e/admin/reviews-management.e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin - Review Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/admin')
  })

  test('creates a new review', async ({ page }) => {
    await page.goto('/admin/collections/reviews/create')

    // Fill basic information
    await page.fill('[name="title"]', 'New Test Review')
    await page.fill('[name="author"]', 'Test Author')
    await page.fill('[name="excerpt"]', 'This is a test review excerpt')

    // Set rating
    await page.fill('[name="rating"]', '4.5')

    // Select reading status
    await page.selectOption('[name="readingStatus"]', 'finished')

    // Fill content
    await page.locator('[data-testid="rich-text-editor"]').fill('This is the full review content.')

    // Set status to published
    await page.selectOption('[name="status"]', 'published')

    // Save review
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/admin\/collections\/reviews\/.*/)
    await expect(page.locator('.notice--success')).toBeVisible()
  })

  test('Google Books search integration works', async ({ page }) => {
    await page.goto('/admin/collections/reviews/create')

    // Search for a book
    await page.fill('[data-testid="google-books-search"]', 'The Great Gatsby')
    await page.click('[data-testid="search-books-button"]')

    // Wait for search results
    await expect(page.locator('[data-testid="book-search-result"]')).toHaveCountGreaterThan(0)

    // Select first result
    await page.locator('[data-testid="book-search-result"]').first().click()

    // Verify fields are auto-populated
    await expect(page.locator('[name="title"]')).toHaveValue('The Great Gatsby')
    await expect(page.locator('[name="author"]')).toHaveValue('F. Scott Fitzgerald')
    await expect(page.locator('[name="bookMetadata.isbn"]')).toHaveValue(/\d+/)
  })

  test('bulk operations work', async ({ page }) => {
    await page.goto('/admin/collections/reviews')

    // Select multiple reviews
    await page.locator('[data-testid="select-all-checkbox"]').check()

    // Open bulk actions menu
    await page.locator('[data-testid="bulk-actions-button"]').click()

    // Select publish action
    await page.locator('[data-testid="bulk-publish"]').click()

    // Confirm action
    await page.locator('[data-testid="confirm-bulk-action"]').click()

    await expect(page.locator('.notice--success')).toBeVisible()
  })

  test('review validation works', async ({ page }) => {
    await page.goto('/admin/collections/reviews/create')

    // Try to save without required fields
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('.field-error')).toHaveCountGreaterThan(0)
    await expect(page.locator('.field-error')).toContainText('This field is required')
  })
})
```

## Performance Testing

### Load Testing with Artillery

```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Browse reviews"
    weight: 60
    flow:
      - get:
          url: "/reviews"
      - think: 2
      - get:
          url: "/reviews?page=2"
      - think: 3
      - get:
          url: "/reviews/{{ $randomString() }}"

  - name: "Search functionality"
    weight: 30
    flow:
      - get:
          url: "/api/reviews?q=fiction"
      - think: 1
      - get:
          url: "/api/reviews?tags=science-fiction"

  - name: "API endpoints"
    weight: 10
    flow:
      - get:
          url: "/api/reviews"
      - get:
          url: "/api/tags"
```

### Lighthouse Performance Testing

```typescript
// tests/performance/lighthouse.test.ts
import lighthouse from 'lighthouse'
import { launch } from 'puppeteer'

describe('Performance Tests', () => {
  let browser: any

  beforeAll(async () => {
    browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
  })

  afterAll(async () => {
    await browser?.close()
  })

  const runLighthouseTest = async (url: string, thresholds: any) => {
    const { lhr } = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      logLevel: 'error',
    })

    expect(lhr.categories.performance.score).toBeGreaterThanOrEqual(thresholds.performance)
    expect(lhr.categories.accessibility.score).toBeGreaterThanOrEqual(thresholds.accessibility)
    expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(thresholds.seo)
    expect(lhr.categories['best-practices'].score).toBeGreaterThanOrEqual(thresholds.bestPractices)
  }

  test('Homepage performance', async () => {
    await runLighthouseTest('http://localhost:3000', {
      performance: 0.8,
      accessibility: 0.9,
      seo: 0.9,
      bestPractices: 0.8,
    })
  })

  test('Reviews listing performance', async () => {
    await runLighthouseTest('http://localhost:3000/reviews', {
      performance: 0.7,
      accessibility: 0.9,
      seo: 0.9,
      bestPractices: 0.8,
    })
  })

  test('Individual review performance', async () => {
    await runLighthouseTest('http://localhost:3000/reviews/sample-review', {
      performance: 0.8,
      accessibility: 0.9,
      seo: 0.9,
      bestPractices: 0.8,
    })
  })
})
```

## Test Scripts

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run && playwright test",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:performance": "artillery run tests/performance/load-test.yml",
    "test:lighthouse": "vitest run tests/performance/lighthouse.test.ts",
    "test:ci": "vitest run --coverage && playwright test --reporter=dot"
  }
}
```

This comprehensive testing strategy ensures high-quality, reliable code with excellent coverage across all aspects of the Chasing Chapters application.