// Simple client-side search analytics
interface SearchEvent {
  query: string
  tags: string[]
  status: string
  resultsCount: number
  timestamp: number
  sessionId: string
}

interface SearchAnalytics {
  totalSearches: number
  uniqueQueries: number
  popularQueries: Record<string, number>
  popularTags: Record<string, number>
  searchSessions: SearchEvent[]
}

class SearchAnalyticsManager {
  private storageKey = 'search-analytics'
  private sessionId: string
  private maxStoredEvents = 100 // Limit stored events to prevent localStorage bloat

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getAnalytics(): SearchAnalytics {
    if (typeof window === 'undefined') {
      return this.getDefaultAnalytics()
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to parse search analytics:', error)
    }

    return this.getDefaultAnalytics()
  }

  private getDefaultAnalytics(): SearchAnalytics {
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      popularQueries: {},
      popularTags: {},
      searchSessions: []
    }
  }

  private saveAnalytics(analytics: SearchAnalytics): void {
    if (typeof window === 'undefined') return

    try {
      // Keep only the most recent events to prevent localStorage bloat
      if (analytics.searchSessions.length > this.maxStoredEvents) {
        analytics.searchSessions = analytics.searchSessions
          .slice(-this.maxStoredEvents)
      }

      localStorage.setItem(this.storageKey, JSON.stringify(analytics))
    } catch (error) {
      console.error('Failed to save search analytics:', error)
    }
  }

  // Track a search event
  trackSearch(params: {
    query: string
    tags?: string[]
    status?: string
    resultsCount: number
  }): void {
    const { query, tags = [], status = '', resultsCount } = params
    
    if (!query.trim()) return // Don't track empty searches

    const analytics = this.getAnalytics()
    
    // Create search event
    const event: SearchEvent = {
      query: query.trim().toLowerCase(),
      tags,
      status,
      resultsCount,
      timestamp: Date.now(),
      sessionId: this.sessionId
    }

    // Update analytics
    analytics.totalSearches++
    analytics.searchSessions.push(event)

    // Track popular queries
    if (!analytics.popularQueries[event.query]) {
      analytics.uniqueQueries++
      analytics.popularQueries[event.query] = 0
    }
    analytics.popularQueries[event.query]++

    // Track popular tags
    tags.forEach(tag => {
      if (!analytics.popularTags[tag]) {
        analytics.popularTags[tag] = 0
      }
      analytics.popularTags[tag]++
    })

    this.saveAnalytics(analytics)
  }

  // Get popular search queries
  getPopularQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const analytics = this.getAnalytics()
    
    return Object.entries(analytics.popularQueries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }))
  }

  // Get popular tags
  getPopularTags(limit: number = 10): Array<{ tag: string; count: number }> {
    const analytics = this.getAnalytics()
    
    return Object.entries(analytics.popularTags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }))
  }

  // Get recent searches for current session
  getRecentSearches(limit: number = 5): string[] {
    const analytics = this.getAnalytics()
    
    return analytics.searchSessions
      .filter(event => event.sessionId === this.sessionId)
      .map(event => event.query)
      .reverse() // Most recent first
      .filter((query, index, arr) => arr.indexOf(query) === index) // Remove duplicates
      .slice(0, limit)
  }

  // Get search statistics
  getStats(): {
    totalSearches: number
    uniqueQueries: number
    averageResultsPerSearch: number
    searchesThisSession: number
    noResultSearches: number
  } {
    const analytics = this.getAnalytics()
    
    const sessionsEvents = analytics.searchSessions.filter(
      event => event.sessionId === this.sessionId
    )
    
    const noResultSearches = analytics.searchSessions.filter(
      event => event.resultsCount === 0
    ).length

    const totalResults = analytics.searchSessions.reduce(
      (sum, event) => sum + event.resultsCount, 
      0
    )

    return {
      totalSearches: analytics.totalSearches,
      uniqueQueries: analytics.uniqueQueries,
      averageResultsPerSearch: analytics.totalSearches > 0 
        ? Math.round(totalResults / analytics.totalSearches * 10) / 10
        : 0,
      searchesThisSession: sessionsEvents.length,
      noResultSearches
    }
  }

  // Clear analytics data
  clearAnalytics(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(this.storageKey)
  }

  // Export analytics data for debugging
  exportAnalytics(): SearchAnalytics {
    return this.getAnalytics()
  }
}

// Global analytics instance
export const searchAnalytics = new SearchAnalyticsManager()

// Hook for React components
export function useSearchAnalytics() {
  return {
    trackSearch: searchAnalytics.trackSearch.bind(searchAnalytics),
    getPopularQueries: searchAnalytics.getPopularQueries.bind(searchAnalytics),
    getPopularTags: searchAnalytics.getPopularTags.bind(searchAnalytics),
    getRecentSearches: searchAnalytics.getRecentSearches.bind(searchAnalytics),
    getStats: searchAnalytics.getStats.bind(searchAnalytics),
    clearAnalytics: searchAnalytics.clearAnalytics.bind(searchAnalytics),
    exportAnalytics: searchAnalytics.exportAnalytics.bind(searchAnalytics)
  }
}