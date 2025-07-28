'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import { ProcessedBookData } from '@/lib/google-books'
// import './BookMetadataFields.scss'

interface BookMetadataFieldsProps {
  // Field paths for auto-population
  authorPath?: string
  googleBooksIdPath?: string
  isbnPath?: string
  pageCountPath?: string
  publishYearPath?: string
  genrePath?: string
}

export const BookMetadataFields: React.FC<BookMetadataFieldsProps> = ({
  authorPath = 'author',
  googleBooksIdPath = 'googleBooksId',
  isbnPath = 'isbn',
  pageCountPath = 'pageCount',
  publishYearPath = 'publishYear',
  genrePath = 'genre',
}) => {
  const [lastPopulatedBook, setLastPopulatedBook] = useState<string | null>(null)
  const [showPopulateButton, setShowPopulateButton] = useState(false)
  const [pendingBookData, setPendingBookData] = useState<ProcessedBookData | null>(null)

  // Field hooks
  const { value: authorValue, setValue: setAuthorValue } = useField<string>({ path: authorPath })
  const { value: googleBooksIdValue, setValue: setGoogleBooksIdValue } = useField<string>({ path: googleBooksIdPath })
  const { value: isbnValue, setValue: setIsbnValue } = useField<string>({ path: isbnPath })
  const { value: pageCountValue, setValue: setPageCountValue } = useField<number>({ path: pageCountPath })
  const { value: publishYearValue, setValue: setPublishYearValue } = useField<number>({ path: publishYearPath })
  const { value: genreValue, setValue: setGenreValue } = useField<string>({ path: genrePath })

  const populateFields = useCallback((book: ProcessedBookData, force: boolean = false) => {
    // Only populate empty fields unless forcing
    if (!authorValue || force) {
      const authorString = book.authors.length > 0 ? book.authors.join(', ') : ''
      if (authorString) setAuthorValue(authorString)
    }

    if (!googleBooksIdValue || force) {
      setGoogleBooksIdValue(book.id)
    }

    if (!isbnValue || force) {
      const isbn = book.isbn13 || book.isbn
      if (isbn) setIsbnValue(isbn)
    }

    if (!pageCountValue || force) {
      if (book.pageCount) setPageCountValue(book.pageCount)
    }

    if (!publishYearValue || force) {
      if (book.publishedDate) {
        const year = parseInt(book.publishedDate.split('-')[0], 10)
        if (!isNaN(year)) setPublishYearValue(year)
      }
    }

    if (!genreValue || force) {
      if (book.categories.length > 0) {
        // Take the first category as the primary genre
        setGenreValue(book.categories[0])
      }
    }

    setLastPopulatedBook(book.id)
    setShowPopulateButton(false)
    setPendingBookData(null)
  }, [
    authorValue, setAuthorValue,
    googleBooksIdValue, setGoogleBooksIdValue,
    isbnValue, setIsbnValue,
    pageCountValue, setPageCountValue,
    publishYearValue, setPublishYearValue,
    genreValue, setGenreValue
  ])

  const handlePopulateClick = () => {
    if (pendingBookData) {
      populateFields(pendingBookData, true)
    }
  }

  const dismissPopulate = () => {
    setShowPopulateButton(false)
    setPendingBookData(null)
  }

  useEffect(() => {
    const handleBookSelected = (event: CustomEvent<{ book: ProcessedBookData }>) => {
      const book = event.detail.book

      // Don't auto-populate if this is the same book we just populated
      if (lastPopulatedBook === book.id) {
        return
      }

      // Check if any fields have values
      const hasExistingData = !!(
        authorValue || 
        googleBooksIdValue || 
        isbnValue || 
        pageCountValue || 
        publishYearValue || 
        genreValue
      )

      if (!hasExistingData) {
        // Auto-populate immediately if no existing data
        populateFields(book)
      } else {
        // Show option to populate if there's existing data
        setPendingBookData(book)
        setShowPopulateButton(true)
      }
    }

    // Listen for book selection events
    window.addEventListener('bookSelected', handleBookSelected as EventListener)

    return () => {
      window.removeEventListener('bookSelected', handleBookSelected as EventListener)
    }
  }, [
    authorValue,
    googleBooksIdValue,
    isbnValue,
    pageCountValue,
    publishYearValue,
    genreValue,
    lastPopulatedBook,
    populateFields
  ])

  if (!showPopulateButton || !pendingBookData) {
    return null
  }

  return (
    <div className="book-metadata-populate">
      <div className="populate-notification">
        <div className="populate-header">
          <span className="populate-icon">📚</span>
          <div className="populate-text">
            <div className="populate-title">Auto-populate book metadata?</div>
            <div className="populate-subtitle">
              Found metadata for &ldquo;{pendingBookData.title}&rdquo; by {pendingBookData.authors.join(', ')}
            </div>
          </div>
        </div>
        
        <div className="populate-preview">
          <div className="preview-grid">
            {pendingBookData.authors.length > 0 && (
              <div className="preview-item">
                <span className="preview-label">Author:</span>
                <span className="preview-value">{pendingBookData.authors.join(', ')}</span>
              </div>
            )}
            {pendingBookData.publishedDate && (
              <div className="preview-item">
                <span className="preview-label">Year:</span>
                <span className="preview-value">{pendingBookData.publishedDate.split('-')[0]}</span>
              </div>
            )}
            {pendingBookData.pageCount && (
              <div className="preview-item">
                <span className="preview-label">Pages:</span>
                <span className="preview-value">{pendingBookData.pageCount}</span>
              </div>
            )}
            {(pendingBookData.isbn || pendingBookData.isbn13) && (
              <div className="preview-item">
                <span className="preview-label">ISBN:</span>
                <span className="preview-value">{pendingBookData.isbn13 || pendingBookData.isbn}</span>
              </div>
            )}
            {pendingBookData.categories.length > 0 && (
              <div className="preview-item">
                <span className="preview-label">Genre:</span>
                <span className="preview-value">{pendingBookData.categories[0]}</span>
              </div>
            )}
          </div>
        </div>

        <div className="populate-actions">
          <button
            type="button"
            className="populate-btn populate"
            onClick={handlePopulateClick}
          >
            ✅ Populate Fields
          </button>
          <button
            type="button"
            className="populate-btn dismiss"
            onClick={dismissPopulate}
          >
            ❌ Dismiss
          </button>
        </div>

        <div className="populate-note">
          This will overwrite any existing data in the metadata fields.
        </div>
      </div>
    </div>
  )
}