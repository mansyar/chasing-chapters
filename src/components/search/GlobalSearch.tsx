'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { searchAnalytics } from '@/lib/search-analytics'

interface SearchSuggestion {
  id: string
  title: string
  author: string
  type: 'review'
}

interface PopularSearch {
  query: string
  count: number
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load recent searches and popular searches
  useEffect(() => {
    // Load recent searches
    const recentQueries = searchAnalytics.getRecentSearches(5)
    setRecentSearches(recentQueries)
    
    // Load popular searches
    const popularQueries = searchAnalytics.getPopularQueries(4)
    setPopularSearches(popularQueries)
  }, [isOpen]) // Reload when opening the search modal


  // Fetch search suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`)
        const data = await response.json()
        
        if (data.success) {
          setSuggestions(data.data.docs.slice(0, 5).map((review: any) => ({
            id: review.id,
            title: review.title,
            author: review.author,
            type: 'review' as const
          })))
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return
    
    setIsOpen(false)
    setQuery('')
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  // Handle keyboard navigation on the button
  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Search Button/Input */}
      <button
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        onKeyDown={handleButtonKeyDown}
        className="text-neutral-500 hover:text-neutral-700 transition-colors p-2 rounded-lg hover:bg-neutral-100"
        title="Search reviews"
        data-testid="global-search-button"
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </button>

      {/* Search Modal/Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-20 z-40" />
          
          {/* Search Panel */}
          <div className="absolute top-full right-0 mt-2 w-screen max-w-md bg-white rounded-lg shadow-lg border border-neutral-200 z-50 overflow-hidden" data-testid="global-search-modal">
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="p-4 border-b border-neutral-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search reviews, authors, topics..."
                  className="w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  data-testid="global-search-input"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Search Content */}
            <div className="max-h-96 overflow-y-auto">
              {/* Loading State */}
              {loading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-sm text-neutral-600">Searching...</p>
                </div>
              )}

              {/* Search Suggestions */}
              {!loading && suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-2 py-2">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSearch(suggestion.title)}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-md group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 group-hover:text-primary-600">
                            {suggestion.title}
                          </div>
                          <div className="text-xs text-neutral-500">
                            by {suggestion.author}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {!loading && query.length < 2 && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-2 py-2 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  {recentSearches.map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(recentQuery)}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-md group text-sm text-neutral-700 flex items-center justify-between"
                    >
                      <span>{recentQuery}</span>
                      <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600" />
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {!loading && query.length < 2 && popularSearches.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-2 py-2 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Popular Searches
                  </div>
                  {popularSearches.map((popular, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(popular.query)}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-md group text-sm text-neutral-700 flex items-center justify-between"
                    >
                      <span>{popular.query}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">{popular.count}</span>
                        <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && query.length >= 2 && suggestions.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-sm text-neutral-600 mb-3">No suggestions found</p>
                  <button
                    onClick={() => handleSearch()}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Search for &quot;{query}&quot;
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && query.length < 2 && recentSearches.length === 0 && (
                <div className="p-4 text-center">
                  <Search className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">
                    Start typing to search reviews
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-100 p-3 bg-neutral-50">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-4">
                  <span>Press Enter to search</span>
                  <span>ESC to close</span>
                </div>
                <button
                  onClick={() => router.push('/search')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Advanced Search
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}