import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

  it('should render with label', async () => {
    await act(async () => {
      render(<TagManager {...defaultProps} />)
    })
    
    expect(screen.getByText('Tags')).toBeInTheDocument()
  })

  it('should display required indicator when required is true', async () => {
    await act(async () => {
      render(<TagManager {...defaultProps} required />)
    })
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should fetch tags on mount', async () => {
    await act(async () => {
      render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for the async fetch to be called
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(fetch).toHaveBeenCalledWith('/api/tags?limit=100&sort=name', {
      credentials: 'include',
    })
  })

  it('should display selected tags', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} value={['1', '2']} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument()
    }, { container: renderResult.container })
  })

  it('should show dropdown when input is focused', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument()
      expect(screen.getByText('Biography')).toBeInTheDocument()
    }, { container: renderResult.container })
  })

  it('should filter tags based on search term', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'fic' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument()
      expect(screen.queryByText('Biography')).not.toBeInTheDocument()
    }, { container: renderResult.container })
  })

  it('should add tag when clicked from dropdown', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      const fictionOption = screen.getByText('Fiction')
      act(() => {
        fireEvent.click(fictionOption)
      })
      
      expect(mockOnChange).toHaveBeenCalledWith(['1'])
    }, { container: renderResult.container })
  })

  it('should remove tag when remove button is clicked', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} value={['1']} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    await waitFor(() => {
      const removeButton = screen.getByTitle('Remove Fiction')
      act(() => {
        fireEvent.click(removeButton)
      })
      
      expect(mockOnChange).toHaveBeenCalledWith([])
    }, { container: renderResult.container })
  })

  it('should show create button when search term has no matches', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'New Tag' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Create "New Tag"')).toBeInTheDocument()
    }, { container: renderResult.container })
  })

  it('should open create modal when create button is clicked', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'New Tag' } })
    })
    
    // Wait for create button to appear
    await waitFor(() => {
      expect(screen.getByText(/Create.*New Tag/)).toBeInTheDocument()
    }, { container: renderResult.container })
    
    const createButton = screen.getByText(/Create.*New Tag/)
    await act(async () => {
      fireEvent.click(createButton)
    })
    
    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Create New Tag')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter tag name')).toBeInTheDocument()
    }, { container: renderResult.container })
  })

  it('should create new tag when form is submitted', async () => {
    const newTag = { id: '4', name: 'New Tag', slug: 'new-tag', color: '#E11D74' }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newTag),
    })

    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'New Tag' } })
    })
    
    // Wait for create button to appear
    await waitFor(() => {
      expect(screen.getByText(/Create.*New Tag/)).toBeInTheDocument()
    }, { container: renderResult.container })
    
    const createButton = screen.getByText(/Create.*New Tag/)
    await act(async () => {
      fireEvent.click(createButton)
    })
    
    // Wait for modal to open and submit button to be available
    await waitFor(() => {
      expect(screen.getByText('Create Tag')).toBeInTheDocument()
    }, { container: renderResult.container })
    
    const submitButton = screen.getByText('Create Tag')
    await act(async () => {
      fireEvent.click(submitButton)
    })
    
    expect(fetch).toHaveBeenCalledWith('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: 'New Tag',
        color: '#E11D74',
      }),
    })
  })

  it('should handle keyboard navigation', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
    })
    
    await act(async () => {
      // Filter to one result - use "Biogra" to get only "Biography"
      fireEvent.change(input, { target: { value: 'Biogra' } })
    })
    
    // Wait for the filtered results to appear
    await waitFor(() => {
      expect(screen.getByText('Biography')).toBeInTheDocument()
      // Ensure only one result is shown
      expect(screen.queryByText('Fiction')).not.toBeInTheDocument()
      expect(screen.queryByText('Non-Fiction')).not.toBeInTheDocument()
    }, { container: renderResult.container })
    
    // Press Enter to select
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13, keyCode: 13 })
    })
    
    // Wait for the onChange to be called (Biography has ID '3')
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(['3'])
    }, { container: renderResult.container })
  })

  it('should handle escape key to close dropdown', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument()
    }, { container: renderResult.container })
    
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Escape' })
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Fiction')).not.toBeInTheDocument()
    }, { container: renderResult.container })
  })

  it('should not render interactive elements when readOnly is true', async () => {
    await act(async () => {
      render(<TagManager {...defaultProps} readOnly />)
    })
    
    expect(screen.queryByPlaceholderText('Search or add tags...')).not.toBeInTheDocument()
  })

  it('should display selected tags with correct colors', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} value={['1']} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    await waitFor(() => {
      const fictionTag = screen.getByText('Fiction')
      const tagElement = fictionTag.closest('.tag-manager__tag')
      expect(tagElement).toHaveStyle({ backgroundColor: '#3B82F6' })
    }, { container: renderResult.container })
  })

  it('should filter out already selected tags from dropdown', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} value={['1']} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      // Fiction should appear in selected tags but NOT in dropdown
      const dropdown = renderResult.container.querySelector('.tag-manager__dropdown')
      const dropdownOptions = dropdown?.querySelectorAll('.tag-manager__option')
      const dropdownTexts = Array.from(dropdownOptions || []).map(option => option.textContent)
      
      expect(dropdownTexts).not.toContain('Fiction') // Should not appear in dropdown
      expect(dropdownTexts).toContain('Non-Fiction') // Should appear in dropdown
      expect(dropdownTexts).toContain('Biography') // Should appear in dropdown
    }, { container: renderResult.container })
  })

  it('should handle tag creation modal cancellation', async () => {
    let renderResult: any
    await act(async () => {
      renderResult = render(<TagManager {...defaultProps} />)
    })
    
    // Allow time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const input = screen.getByPlaceholderText('Search or add tags...')
    
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'New Tag' } })
    })
    
    // Wait for create button to appear
    await waitFor(() => {
      expect(screen.getByText(/Create.*New Tag/)).toBeInTheDocument()
    }, { container: renderResult.container })
    
    const createButton = screen.getByText(/Create.*New Tag/)
    await act(async () => {
      fireEvent.click(createButton)
    })
    
    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    }, { container: renderResult.container })
    
    const cancelButton = screen.getByText('Cancel')
    await act(async () => {
      fireEvent.click(cancelButton)
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Create New Tag')).not.toBeInTheDocument()
    }, { container: renderResult.container })
  })
})