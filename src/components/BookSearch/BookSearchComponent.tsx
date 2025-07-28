'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ProcessedBookData } from '@/lib/google-books'
import { OptimizedImage } from '@/components/common'
// import './BookSearch.scss'

interface BookSearchProps {
  onBookSelect: (book: ProcessedBookData) => void
  value?: string
  disabled?: boolean
  placeholder?: string
}

interface SearchResponse {
  success: boolean
  data?: {
    books: ProcessedBookData[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
  error?: string
  details?: string
  fallback?: string
}

export const BookSearchComponent: React.FC<BookSearchProps> = ({
  onBookSelect,
  value = '',
  disabled = false,
  placeholder = 'Search for books...',
}) => {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ProcessedBookData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  const clearResults = useCallback(() => {
    setResults([])
    setShowResults(false)
    setError(null)
    setFallbackMessage(null)
    setSelectedIndex(-1)
    setCurrentPage(1)
    setTotalPages(0)
    setTotalItems(0)
  }, [])

  const performSearch = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      clearResults()
      return
    }

    setLoading(true)
    setError(null)
    setFallbackMessage(null)

    try {
      const maxResults = 10
      const startIndex = (page - 1) * maxResults

      const params = new URLSearchParams({
        q: searchQuery.trim(),
        maxResults: maxResults.toString(),
        startIndex: startIndex.toString(),
        orderBy: 'relevance',
        printType: 'books',
      })

      const response = await fetch(`/api/books/search?${params}`)
      const data: SearchResponse = await response.json()

      if (!response.ok) {
        setError(data.error || 'Search failed')
        if (data.fallback) {
          setFallbackMessage(data.fallback)
        }
        clearResults()
        return
      }

      if (data.success && data.data) {
        setResults(data.data.books)
        setCurrentPage(data.data.pagination.currentPage)
        setTotalPages(data.data.pagination.totalPages)
        setTotalItems(data.data.pagination.totalItems)
        setShowResults(true)
        setSelectedIndex(-1)
      } else {
        throw new Error('Search failed')
      }
    } catch (err) {
      console.error('Book search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setFallbackMessage('You can enter book details manually using the Manual Entry option')
      clearResults()
    } finally {
      setLoading(false)
    }
  }, [clearResults])

  const debounceSearch = useCallback(
    (searchQuery: string) => {
      const timer = setTimeout(() => {
        if (searchQuery.trim().length >= 2) {
          performSearch(searchQuery, 1)
        } else {
          clearResults()
        }
      }, 300)

      return () => clearTimeout(timer)
    },
    [performSearch, clearResults]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    debounceSearch(newQuery)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleBookSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBookSelect = (book: ProcessedBookData) => {
    onBookSelect(book)
    setQuery(book.title)
    setShowResults(false)
    setSelectedIndex(-1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && query.trim()) {
      performSearch(query, newPage)
    }
  }

  const formatAuthors = (authors: string[]) => {
    if (authors.length === 0) return 'Unknown Author'
    if (authors.length === 1) return authors[0]
    if (authors.length === 2) return authors.join(' & ')
    return `${authors[0]} & ${authors.length - 1} others`
  }

  const formatPublishDate = (publishedDate?: string) => {
    if (!publishedDate) return ''
    // Extract year from date string (could be YYYY, YYYY-MM, or YYYY-MM-DD)
    const year = publishedDate.split('-')[0]
    return year ? `(${year})` : ''
  }

  useEffect(() => {
    return debounceSearch(query)
  }, [query, debounceSearch])

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.book-search-container')) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="book-search-container">
      <div className="book-search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`book-search-input ${error ? 'error' : ''} ${loading ? 'loading' : ''}`}
        />
        {loading && <div className="book-search-spinner" />}
      </div>

      {error && (
        <div className="book-search-error">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <div className="error-message">{error}</div>
            {fallbackMessage && (
              <div className="fallback-message">
                💡 {fallbackMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {showResults && (
        <div className="book-search-results">
          <div className="book-search-results-header">
            {totalItems > 0 && (
              <span className="results-count">
                {totalItems} book{totalItems !== 1 ? 's' : ''} found
              </span>
            )}
          </div>

          <div className="book-search-results-list">
            {results.map((book, index) => (
              <div
                key={book.id}
                className={`book-search-result-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleBookSelect(book)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="book-cover">
                  <OptimizedImage
                    src={book.coverImageUrl}
                    alt={`Cover of ${book.title}`}
                    width={60}
                    height={90}
                    quality={75}
                    loading="lazy"
                    fallbackIcon={<div className="book-cover-placeholder">📚</div>}
                  />
                </div>
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-authors">{formatAuthors(book.authors)}</div>
                  <div className="book-details">
                    {formatPublishDate(book.publishedDate)}
                    {book.pageCount && ` • ${book.pageCount} pages`}
                    {book.publisher && ` • ${book.publisher}`}
                  </div>
                  {book.description && (
                    <div className="book-description">
                      {book.description.substring(0, 150)}
                      {book.description.length > 150 && '...'}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {results.length === 0 && !loading && query.trim().length >= 2 && (
              <div className="book-search-no-results">
                <div className="no-results-icon">📖</div>
                <div className="no-results-text">
                  No books found for &ldquo;{query}&rdquo;
                  <br />
                  <small>Try a different search term</small>
                </div>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="book-search-pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}