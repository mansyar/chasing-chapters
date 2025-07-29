// Simple in-memory cache for search results
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class SearchCache {
  private cache = new Map<string, CacheEntry>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
export const searchCache = new SearchCache()

// Cleanup expired entries every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    searchCache.cleanup()
  }, 10 * 60 * 1000)
}

// Generate cache key for search parameters
export function generateCacheKey(params: {
  q?: string
  tags?: string[]
  status?: string
  page?: number
  limit?: number
  sort?: string
}): string {
  const { q = '', tags = [], status = '', page = 1, limit = 10, sort = '-publishedDate' } = params
  
  return [
    'search',
    q.toLowerCase().trim(),
    tags.sort().join(','),
    status,
    page,
    limit,
    sort
  ].join(':')
}