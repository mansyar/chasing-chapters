import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { TagManager } from '../../src/components/TagManager/TagManager'

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock fetch
global.fetch = vi.fn()

const mockTags = [
  { id: '1', name: 'Fiction', slug: 'fiction', color: '#3B82F6' },
  { id: '2', name: 'Non-Fiction', slug: 'non-fiction', color: '#EF4444' },
  { id: '3', name: 'Biography', slug: 'biography', color: '#10B981' },
]

describe('TagManager Component', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    value: [],
    onChange: mockOnChange,
    path: 'tags',
    name: 'tags',
    label: 'Tags',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ docs: mockTags }),
    })
  })

  it('should render with label', () => {
    render(<TagManager {...defaultProps} />)
    
    expect(screen.getByText('Tags')).toBeInTheDocument()
  })

  it('should display required indicator when required is true', () => {
    render(<TagManager {...defaultProps} required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should fetch tags on mount', async () => {
    render(<TagManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/tags?limit=100&sort=name', {
        credentials: 'include',
      })
    })
  })

  it('should display selected tags', async () => {
    render(<TagManager {...defaultProps} value={['1', '2']} />)
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument()
    })
  })

  it('should show dropdown when input is focused', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument()
      expect(screen.getByText('Biography')).toBeInTheDocument()
    })
  })

  it('should filter tags based on search term', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'fic' } })
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument()
      expect(screen.queryByText('Biography')).not.toBeInTheDocument()
    })
  })

  it('should add tag when clicked from dropdown', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      const fictionOption = screen.getByText('Fiction')
      fireEvent.click(fictionOption)
      
      expect(mockOnChange).toHaveBeenCalledWith(['1'])
    })
  })

  it('should remove tag when remove button is clicked', async () => {
    render(<TagManager {...defaultProps} value={['1']} />)
    
    await waitFor(() => {
      const removeButton = screen.getByTitle('Remove Fiction')
      fireEvent.click(removeButton)
      
      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })

  it('should show create button when search term has no matches', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'New Tag' } })
    
    await waitFor(() => {
      expect(screen.getByText('Create "New Tag"')).toBeInTheDocument()
    })
  })

  it('should open create modal when create button is clicked', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'New Tag' } })
    
    await waitFor(() => {
      const createButton = screen.getByText('Create "New Tag"')
      fireEvent.click(createButton)
      
      expect(screen.getByText('Create New Tag')).toBeInTheDocument()
      expect(screen.getByDisplayValue('New Tag')).toBeInTheDocument()
    })
  })

  it('should create new tag when form is submitted', async () => {
    const newTag = { id: '4', name: 'New Tag', slug: 'new-tag', color: '#3B82F6' }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newTag),
    })

    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'New Tag' } })
    
    await waitFor(() => {
      const createButton = screen.getByText('Create "New Tag"')
      fireEvent.click(createButton)
    })
    
    await waitFor(() => {
      const submitButton = screen.getByText('Create Tag')
      fireEvent.click(submitButton)
      
      expect(fetch).toHaveBeenCalledWith('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: 'New Tag',
          color: '#3B82F6',
        }),
      })
    })
  })

  it('should handle keyboard navigation', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      // Filter to one result
      fireEvent.change(input, { target: { value: 'Fiction' } })
    })
    
    await waitFor(() => {
      // Press Enter to select
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnChange).toHaveBeenCalledWith(['1'])
    })
  })

  it('should handle escape key to close dropdown', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
    })
    
    fireEvent.keyDown(input, { key: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByText('Fiction')).not.toBeInTheDocument()
    })
  })

  it('should not render interactive elements when readOnly is true', () => {
    render(<TagManager {...defaultProps} readOnly />)
    
    expect(screen.queryByPlaceholderText('Search or add tags...')).not.toBeInTheDocument()
  })

  it('should display selected tags with correct colors', async () => {
    render(<TagManager {...defaultProps} value={['1']} />)
    
    await waitFor(() => {
      const fictionTag = screen.getByText('Fiction')
      const tagElement = fictionTag.closest('.tag-manager__tag')
      expect(tagElement).toHaveStyle({ backgroundColor: '#3B82F6' })
    })
  })

  it('should filter out already selected tags from dropdown', async () => {
    render(<TagManager {...defaultProps} value={['1']} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      expect(screen.queryByText('Fiction')).not.toBeInTheDocument() // Should not appear in dropdown
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument() // Should appear in dropdown
      expect(screen.getByText('Biography')).toBeInTheDocument() // Should appear in dropdown
    })
  })

  it('should handle tag creation modal cancellation', async () => {
    render(<TagManager {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'New Tag' } })
    
    await waitFor(() => {
      const createButton = screen.getByText('Create "New Tag"')
      fireEvent.click(createButton)
    })
    
    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      expect(screen.queryByText('Create New Tag')).not.toBeInTheDocument()
    })
  })
})