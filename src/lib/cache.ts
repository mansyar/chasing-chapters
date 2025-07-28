interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map()
  private defaultTTL: number

  constructor(defaultTTLSeconds: number = 300) { // 5 minutes default
    this.defaultTTL = defaultTTLSeconds * 1000 // Convert to milliseconds
  }

  set(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds || this.defaultTTL / 1000) * 1000
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    this.cache.set(key, item)
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired items
  cleanup(): number {
    let cleaned = 0
    const now = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    return cleaned
  }

  // Get cache statistics
  stats(): {
    size: number
    keys: string[]
    oldestTimestamp: number | null
    newestTimestamp: number | null
  } {
    const keys = Array.from(this.cache.keys())
    const timestamps = Array.from(this.cache.values()).map(item => item.timestamp)
    
    return {
      size: this.cache.size,
      keys,
      oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null,
    }
  }
}

// Rate limiting functionality
interface RateLimitInfo {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitInfo> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 100, windowMinutes: number = 1) {
    this.maxRequests = maxRequests
    this.windowMs = windowMinutes * 60 * 1000 // Convert to milliseconds
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const limit = this.limits.get(key)

    if (!limit || now > limit.resetTime) {
      // First request or window has reset
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (limit.count >= this.maxRequests) {
      return false
    }

    // Increment count
    limit.count++
    return true
  }

  getRemainingRequests(key: string): number {
    const limit = this.limits.get(key)
    
    if (!limit || Date.now() > limit.resetTime) {
      return this.maxRequests
    }

    return Math.max(0, this.maxRequests - limit.count)
  }

  getResetTime(key: string): number | null {
    const limit = this.limits.get(key)
    
    if (!limit || Date.now() > limit.resetTime) {
      return null
    }

    return limit.resetTime
  }

  cleanup(): number {
    let cleaned = 0
    const now = Date.now()
    
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key)
        cleaned++
      }
    }
    
    return cleaned
  }
}

// Export singleton instances
export const bookSearchCache = new SimpleCache<any>(300) // 5 minutes cache
export const bookDetailsCache = new SimpleCache<any>(1800) // 30 minutes cache for individual books
export const rateLimiter = new RateLimiter(100, 1) // 100 requests per minute

// Cleanup job - runs every 5 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    bookSearchCache.cleanup()
    bookDetailsCache.cleanup()
    rateLimiter.cleanup()
  }, 5 * 60 * 1000) // 5 minutes
}

export { SimpleCache, RateLimiter }