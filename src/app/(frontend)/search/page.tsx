'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { ReviewCard } from '@/components/reviews'
import { Review, Tag, Media } from '@/payload-types'
import { searchAnalytics } from '@/lib/search-analytics'

interface SearchResult extends Review {
  coverImage?: Media
  tags?: Tag[]
  _searchScore?: number
}

interface SearchResponse {
  success: boolean
  data: {
    docs: SearchResult[]
    totalDocs: number
    totalPages: number
    page: number
    hasPrevPage: boolean
    hasNextPage: boolean
    prevPage: number | null
    nextPage: number | null
  }
  query: {
    q: string
    tags: string[]
    status: string
    page: number
    limit: number
    sort: string
  }
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Search form state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  )
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  
  // Pagination
  const currentPage = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')

  // Load available tags for filtering
  useEffect(() => {
    async function loadTags() {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const tagsData = await response.json()
          setAvailableTags(tagsData.docs || [])
        }
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }
    loadTags()
  }, [])

  // Perform search
  const performSearch = useCallback(async (params: URLSearchParams) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/search?${params.toString()}`)
      const data: SearchResponse = await response.json()
      
      if (data.success) {
        setSearchResults(data)
        
        // Track search analytics
        const queryParam = params.get('q') || ''
        const tagsParam = params.get('tags')?.split(',').filter(Boolean) || []
        const statusParam = params.get('status') || ''
        
        if (queryParam || tagsParam.length > 0 || statusParam) {
          searchAnalytics.trackSearch({
            query: queryParam,
            tags: tagsParam,
            status: statusParam,
            resultsCount: data.data.totalDocs
          })
        }
      } else {
        setError('Search failed')
      }
    } catch (error) {
      setError('Failed to perform search')
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update URL and perform search
  const updateSearch = useCallback((newParams: Partial<{
    q: string
    tags: string[]
    status: string
    page: number
  }>) => {
    const params = new URLSearchParams()
    
    const query = newParams.q !== undefined ? newParams.q : searchQuery
    const tags = newParams.tags !== undefined ? newParams.tags : selectedTags
    const status = newParams.status !== undefined ? newParams.status : selectedStatus
    const page = newParams.page !== undefined ? newParams.page : currentPage
    
    if (query) params.set('q', query)
    if (tags.length > 0) params.set('tags', tags.join(','))
    if (status) params.set('status', status)
    if (page > 1) params.set('page', page.toString())
    params.set('limit', limit.toString())
    
    router.push(`/search?${params.toString()}`)
  }, [searchQuery, selectedTags, selectedStatus, currentPage, limit, router])

  // Perform search when URL params change
  useEffect(() => {
    const params = new URLSearchParams()
    const q = searchParams.get('q') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    
    if (q) params.set('q', q)
    if (tags.length > 0) params.set('tags', tags.join(','))
    if (status) params.set('status', status)
    params.set('page', page.toString())
    params.set('limit', limit.toString())
    
    performSearch(params)
  }, [searchParams, performSearch, limit])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearch({ q: searchQuery, page: 1 })
  }

  // Handle tag filter toggle
  const toggleTag = (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug)
      ? selectedTags.filter(t => t !== tagSlug)
      : [...selectedTags, tagSlug]
    
    setSelectedTags(newTags)
    updateSearch({ tags: newTags, page: 1 })
  }

  // Handle reading status filter
  const handleStatusChange = (status: string) => {
    const newStatus = selectedStatus === status ? '' : status
    setSelectedStatus(newStatus)
    updateSearch({ status: newStatus, page: 1 })
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([])
    setSelectedStatus('')
    updateSearch({ tags: [], status: '', page: 1 })
  }

  const hasFilters = selectedTags.length > 0 || selectedStatus

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-6">
            <Search className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
            Search Reviews
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8">
            Find your next great read by searching through book reviews, authors, and topics.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by book title, author, or content..."
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-6 py-3 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline px-4 py-3 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasFilters && (
                  <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                    {selectedTags.length + (selectedStatus ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </form>
        </PageWrapper>
      </section>

      {/* Filters Panel */}
      {showFilters && (
        <section className="py-8 bg-neutral-50 border-b">
          <PageWrapper>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Filters</h2>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Reading Status Filter */}
              <div>
                <h3 className="font-medium text-neutral-900 mb-3">Reading Status</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'finished', label: 'Finished' },
                    { value: 'currently-reading', label: 'Currently Reading' },
                    { value: 'want-to-read', label: 'Want to Read' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedStatus === status.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <div>
                  <h3 className="font-medium text-neutral-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.slug)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag.slug)
                            ? 'text-white'
                            : 'bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-400'
                        }`}
                        style={
                          selectedTags.includes(tag.slug) && tag.color
                            ? { backgroundColor: tag.color }
                            : {}
                        }
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PageWrapper>
        </section>
      )}

      {/* Search Results */}
      <section className="py-16 bg-white">
        <PageWrapper>
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Searching...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-red-600 mb-4">⚠️ Search Error</div>
              <p className="text-neutral-600 mb-4">{error}</p>
              <button
                onClick={() => performSearch(new URLSearchParams(searchParams.toString()))}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : searchResults ? (
            <>
              {/* Results Summary */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Search Results
                </h2>
                <p className="text-neutral-600">
                  {searchResults.data.totalDocs > 0 ? (
                    <>
                      Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, searchResults.data.totalDocs)} of {searchResults.data.totalDocs} results
                      {searchResults.query.q && ` for "${searchResults.query.q}"`}
                    </>
                  ) : (
                    'No results found'
                  )}
                </p>
              </div>

              {/* Results Grid */}
              {searchResults.data.docs.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchResults.data.docs.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        showExcerpt
                        className="h-full"
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {searchResults.data.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                      <button
                        onClick={() => updateSearch({ page: currentPage - 1 })}
                        disabled={!searchResults.data.hasPrevPage}
                        className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-600">
                          Page {currentPage} of {searchResults.data.totalPages}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => updateSearch({ page: currentPage + 1 })}
                        disabled={!searchResults.data.hasNextPage}
                        className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                    No Results Found
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Try adjusting your search terms or filters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/reviews" className="btn-primary">
                      Browse All Reviews
                    </Link>
                    <Link href="/tags" className="btn-outline">
                      Explore Tags
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                Search Book Reviews
              </h3>
              <p className="text-neutral-600">
                Enter a search term above to find reviews by title, author, or content.
              </p>
            </div>
          )}
        </PageWrapper>
      </section>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <PageWrapper className="py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading search...</p>
        </div>
      </PageWrapper>
    }>
      <SearchPageContent />
    </Suspense>
  )
}