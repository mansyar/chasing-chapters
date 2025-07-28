'use client'

import React, { useState, useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import { BookSearchComponent } from './BookSearchComponent'
import { ProcessedBookData } from '@/lib/google-books'
import { OptimizedImage } from '@/components/common'
// import './BookSearchField.scss'

interface BookSearchFieldProps {
  path: string
  required?: boolean
  label?: string
  admin?: {
    description?: string
  }
}

export const BookSearchField: React.FC<BookSearchFieldProps> = ({
  path,
  required = false,
  label = 'Search Books',
  admin,
}) => {
  const { value, setValue } = useField<string>({ path })
  const [selectedBook, setSelectedBook] = useState<ProcessedBookData | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)

  const handleBookSelect = useCallback(
    (book: ProcessedBookData) => {
      setSelectedBook(book)
      setValue(book.title)

      // Trigger an event that other fields can listen to for auto-population
      const event = new CustomEvent('bookSelected', {
        detail: { book },
      })
      window.dispatchEvent(event)
    },
    [setValue]
  )

  const handleManualEntry = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const manualTitle = e.target.value
      setValue(manualTitle)
      setSelectedBook(null)
    },
    [setValue]
  )

  const clearSelection = () => {
    setSelectedBook(null)
    setValue('')
  }

  const toggleManualEntry = () => {
    setShowManualEntry(!showManualEntry)
    if (!showManualEntry) {
      setSelectedBook(null)
      setValue('')
    }
  }

  return (
    <div className="book-search-field">
      <div className="field-label">
        <label htmlFor={path}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      </div>

      {admin?.description && (
        <div className="field-description">{admin.description}</div>
      )}

      <div className="book-search-field-content">
        <div className="search-mode-toggle">
          <button
            type="button"
            className={`toggle-btn ${!showManualEntry ? 'active' : ''}`}
            onClick={() => setShowManualEntry(false)}
          >
            🔍 Search Books
          </button>
          <button
            type="button"
            className={`toggle-btn ${showManualEntry ? 'active' : ''}`}
            onClick={toggleManualEntry}
          >
            ✏️ Manual Entry
          </button>
        </div>

        {!showManualEntry ? (
          <div className="search-mode">
            <BookSearchComponent
              onBookSelect={handleBookSelect}
              value={value || ''}
              placeholder="Search for books by title, author, or ISBN..."
            />

            {selectedBook && (
              <div className="selected-book-info">
                <div className="selected-book-header">
                  <span className="selected-label">Selected Book:</span>
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={clearSelection}
                    title="Clear selection"
                  >
                    ✕
                  </button>
                </div>
                <div className="selected-book-details">
                  <div className="book-cover-small">
                    <OptimizedImage
                      src={selectedBook.coverImageUrl}
                      alt={`Cover of ${selectedBook.title}`}
                      width={40}
                      height={60}
                      quality={75}
                      loading="lazy"
                      fallbackIcon={<div className="cover-placeholder">📚</div>}
                    />
                  </div>
                  <div className="book-meta">
                    <div className="book-title-small">{selectedBook.title}</div>
                    <div className="book-authors-small">
                      by {selectedBook.authors.join(', ') || 'Unknown Author'}
                    </div>
                    {selectedBook.publishedDate && (
                      <div className="book-year">
                        Published: {selectedBook.publishedDate.split('-')[0]}
                      </div>
                    )}
                    {selectedBook.id && (
                      <div className="google-books-id">
                        Google Books ID: {selectedBook.id}
                      </div>
                    )}
                  </div>
                </div>
                <div className="auto-populate-note">
                  📝 Book metadata will be auto-populated in other fields
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="manual-mode">
            <input
              type="text"
              value={value || ''}
              onChange={handleManualEntry}
              placeholder="Enter book title manually..."
              className="manual-input"
              required={required}
            />
            <div className="manual-note">
              💡 You can manually enter the book title and fill other fields yourself.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}