/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { calculateRelevanceScore, highlightSearchTerms, extractSnippets } from '@/lib/search-highlight'
import { searchCache, generateCacheKey } from '@/lib/search-cache'

describe('Search Functionality Tests', () => {
  describe('Search Relevance Scoring', () => {
    it('should calculate relevance scores correctly', () => {
      const fields = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        excerpt: 'A classic American novel about the Jazz Age',
        content: 'The story follows Nick Carraway and his neighbor Jay Gatsby'
      }

      const score = calculateRelevanceScore(fields, 'Gatsby')
      expect(score).toBeGreaterThan(0)

      // Title matches should score higher than content matches
      const titleScore = calculateRelevanceScore(fields, 'Gatsby')
      const contentScore = calculateRelevanceScore(fields, 'Carraway')
      expect(titleScore).toBeGreaterThan(contentScore)
    })

    it('should return 0 for empty query', () => {
      const fields = { title: 'Test Book' }
      const score = calculateRelevanceScore(fields, '')
      expect(score).toBe(0)
    })

    it('should handle multiple search terms', () => {
      const fields = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald'
      }

      const score = calculateRelevanceScore(fields, 'Great Scott')
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('Search Highlighting', () => {
    it('should highlight search terms in text', () => {
      const text = 'The Great Gatsby is a classic novel'
      const query = 'Great'
      
      const highlighted = highlightSearchTerms(text, query)
      expect(highlighted).toContain('<mark')
      expect(highlighted).toContain('Great')
    })

    it('should handle multiple search terms', () => {
      const text = 'The Great Gatsby is a classic American novel'
      const query = 'Great American'
      
      const highlighted = highlightSearchTerms(text, query)
      expect(highlighted).toContain('Great')
      expect(highlighted).toContain('American')
    })

    it('should return original text for empty query', () => {
      const text = 'Test text'
      const highlighted = highlightSearchTerms(text, '')
      expect(highlighted).toBe(text)
    })

    it('should be case insensitive', () => {
      const text = 'The Great Gatsby'
      const query = 'great'
      
      const highlighted = highlightSearchTerms(text, query)
      expect(highlighted).toContain('Great')
    })
  })

  describe('Text Snippet Extraction', () => {
    it('should extract relevant snippets', () => {
      const text = 'This is a long text that contains the search term "important" somewhere in the middle of the content'
      const query = 'important'
      
      const snippets = extractSnippets(text, query, 50)
      expect(snippets).toHaveLength(1)
      expect(snippets[0]).toContain('important')
    })

    it('should limit snippet length', () => {
      const text = 'This is a very long text that should be truncated when extracting snippets for search results'
      const query = 'long'
      
      const snippets = extractSnippets(text, query, 30)
      expect(snippets[0].length).toBeLessThanOrEqual(40) // Account for ellipsis
    })

    it('should return full text if shorter than limit', () => {
      const text = 'Short text'
      const query = 'text'
      
      const snippets = extractSnippets(text, query, 100)
      expect(snippets[0]).toBe(text)
    })
  })

  describe('Search Cache', () => {
    it('should store and retrieve cached data', () => {
      const key = 'test-key'
      const data = { test: 'data' }
      
      searchCache.set(key, data)
      const retrieved = searchCache.get(key)
      
      expect(retrieved).toEqual(data)
    })

    it('should return null for non-existent keys', () => {
      const retrieved = searchCache.get('non-existent-key')
      expect(retrieved).toBeNull()
    })

    it('should handle cache expiration', () => {
      const key = 'expiring-key'
      const data = { test: 'data' }
      
      // Set with very short TTL (1ms)
      searchCache.set(key, data, 1)
      
      // Wait a bit for expiration
      setTimeout(() => {
        const retrieved = searchCache.get(key)
        expect(retrieved).toBeNull()
      }, 5)
    })

    it('should generate consistent cache keys', () => {
      const params1 = { q: 'test', tags: ['fiction'], page: 1 }
      const params2 = { q: 'test', tags: ['fiction'], page: 1 }
      
      const key1 = generateCacheKey(params1)
      const key2 = generateCacheKey(params2)
      
      expect(key1).toBe(key2)
    })

    it('should generate different keys for different parameters', () => {
      const params1 = { q: 'test', tags: ['fiction'] }
      const params2 = { q: 'test', tags: ['mystery'] }
      
      const key1 = generateCacheKey(params1)
      const key2 = generateCacheKey(params2)
      
      expect(key1).not.toBe(key2)
    })
  })
})