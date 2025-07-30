import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import { ColorPicker } from '../../src/components/ColorPicker/ColorPicker'

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('ColorPicker Component', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    path: 'color',
    name: 'color',
    label: 'Color',
    value: '#3B82F6',
    onChange: mockOnChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with default color', () => {
    render(<ColorPicker {...defaultProps} />)
    
    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByText('#3B82F6')).toBeInTheDocument()
  })

  it('should display required indicator when required is true', () => {
    render(<ColorPicker {...defaultProps} required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should render color preview with correct background color', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const preview = screen.getByText('#3B82F6')
    expect(preview).toHaveStyle({ backgroundColor: '#3B82F6' })
  })

  it('should render default color swatches', () => {
    render(<ColorPicker {...defaultProps} />)
    
    // Should have 10 default color swatches
    const swatches = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('title')?.startsWith('#')
    )
    expect(swatches).toHaveLength(10)
  })

  it('should handle color swatch selection', async () => {
    render(<ColorPicker {...defaultProps} />)
    
    const redSwatch = screen.getByRole('button', { name: '#EF4444' })
    
    await act(async () => {
      fireEvent.click(redSwatch)
    })
    
    expect(mockOnChange).toHaveBeenCalledWith('#EF4444')
  })

  it('should show custom color input when custom button is clicked', async () => {
    render(<ColorPicker {...defaultProps} />)
    
    const customButton = screen.getByText('Custom')
    
    await act(async () => {
      fireEvent.click(customButton)
    })
    
    expect(await screen.findByPlaceholderText('#E11D74')).toBeInTheDocument()
    // Look for the text input specifically (not the hidden or color input)
    const textInput = await screen.findByRole('textbox')
    expect(textInput).toHaveValue('#3B82F6')
  })

  it('should handle custom hex color input', async () => {
    render(<ColorPicker {...defaultProps} />)
    
    const customButton = screen.getByText('Custom')
    fireEvent.click(customButton)
    
    const hexInput = await screen.findByPlaceholderText('#E11D74')
    fireEvent.change(hexInput, { target: { value: '#FF5733' } })
    
    expect(mockOnChange).toHaveBeenCalledWith('#FF5733')
  })

  it('should handle native color picker input', async () => {
    render(<ColorPicker {...defaultProps} />)
    
    const customButton = screen.getByText('Custom')
    fireEvent.click(customButton)
    
    // Get the color input by its title attribute (more specific)
    const colorInput = await screen.findByTitle('Use color picker')
    fireEvent.change(colorInput, { target: { value: '#00FF00' } })
    
    // The color picker normalizes to lowercase
    expect(mockOnChange).toHaveBeenCalledWith('#00ff00')
  })

  it('should validate hex color format', async () => {
    render(<ColorPicker {...defaultProps} />)
    
    const customButton = screen.getByText('Custom')
    fireEvent.click(customButton)
    
    const hexInput = await screen.findByPlaceholderText('#E11D74')
    
    // Invalid hex color
    fireEvent.change(hexInput, { target: { value: 'invalid' } })
    expect(hexInput).toHaveClass('color-picker__input--invalid')
    
    // Valid hex color
    fireEvent.change(hexInput, { target: { value: '#FF5733' } })
    expect(hexInput).not.toHaveClass('color-picker__input--invalid')
  })

  it('should not render interactive elements when readOnly is true', () => {
    render(<ColorPicker {...defaultProps} readOnly />)
    
    expect(screen.queryByText('Custom')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should update preview when color changes', async () => {
    const { rerender } = render(<ColorPicker {...defaultProps} />)
    
    expect(screen.getByText('#3B82F6')).toBeInTheDocument()
    
    rerender(<ColorPicker {...defaultProps} value="#FF5733" />)
    
    expect(await screen.findByText('#FF5733')).toBeInTheDocument()
  })

  it('should render hidden input with correct value', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const hiddenInput = document.querySelector('input[type="hidden"]')
    expect(hiddenInput).toHaveAttribute('name', 'color')
    expect(hiddenInput).toHaveAttribute('value', '#3B82F6')
  })

  it('should highlight selected color swatch', async () => {
    render(<ColorPicker {...defaultProps} value="#EF4444" />)
    
    const redSwatch = await screen.findByRole('button', { name: '#EF4444' })
    expect(redSwatch).toHaveClass('color-picker__swatch--selected')
  })
})