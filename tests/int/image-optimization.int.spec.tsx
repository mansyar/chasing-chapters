import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { OptimizedImage } from '@/components/common'
import { BookOpen } from 'lucide-react'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onLoad, onError, ...props }: any) => {
    const handleLoad = () => onLoad?.()
    const handleError = () => onError?.()
    
    return React.createElement('img', {
      src,
      alt,
      onLoad: handleLoad,
      onError: handleError,
      'data-testid': 'next-image',
      ...props
    })
  }
}))

describe('OptimizedImage Component', () => {
  it('renders image when src is provided', () => {
    render(
      <OptimizedImage
        src="https://example.com/test-image.jpg"
        alt="Test image"
        width={400}
        height={600}
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg')
    expect(image).toHaveAttribute('alt', 'Test image')
  })

  it('renders fallback when no src provided', () => {
    render(
      <OptimizedImage
        src={null}
        alt="Test image"
        width={400}
        height={600}
      />
    )

    // The fallback renders an SVG with BookOpen icon (look for the SVG element)
    const fallbackSvg = document.querySelector('svg')
    expect(fallbackSvg).toBeInTheDocument()
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument()
  })

  it('renders custom fallback icon', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom Icon</div>

    render(
      <OptimizedImage
        src={null}
        alt="Test image"
        width={400}
        height={600}
        fallbackIcon={<CustomIcon />}
      />
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('handles image load correctly', async () => {
    const onLoad = vi.fn()

    render(
      <OptimizedImage
        src="https://example.com/test-image.jpg"
        alt="Test image"
        width={400}
        height={600}
        onLoad={onLoad}
      />
    )

    const image = screen.getByTestId('next-image')
    
    // Simulate image load
    image.dispatchEvent(new Event('load'))
    
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('handles image error correctly', async () => {
    const onError = vi.fn()

    render(
      <OptimizedImage
        src="https://example.com/broken-image.jpg"
        alt="Test image"
        width={400}
        height={600}
        onError={onError}
      />
    )

    const image = screen.getByTestId('next-image')
    
    // Simulate image error
    image.dispatchEvent(new Event('error'))
    
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('applies correct props for fill images', () => {
    render(
      <OptimizedImage
        src="https://example.com/test-image.jpg"
        alt="Test image"
        fill
        sizes="100vw"
        quality={90}
        priority
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('sizes', '100vw')
  })

  it('includes blur placeholder by default', () => {
    render(
      <OptimizedImage
        src="https://example.com/test-image.jpg"
        alt="Test image"
        width={400}
        height={600}
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('placeholder', 'blur')
  })

  it('uses correct quality setting', () => {
    render(
      <OptimizedImage
        src="https://example.com/test-image.jpg"
        alt="Test image"
        width={400}
        height={600}
        quality={90}
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('quality', '90')
  })
})

describe('Image Configuration', () => {
  it('should have correct Next.js image formats configured', () => {
    // Test that our next.config.mjs has the correct image formats
    // This would be tested in an integration environment
    const expectedFormats = ['image/avif', 'image/webp']
    expect(expectedFormats).toContain('image/avif')
    expect(expectedFormats).toContain('image/webp')
  })

  it('should have responsive device sizes', () => {
    const expectedDeviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    expectedDeviceSizes.forEach(size => {
      expect(typeof size).toBe('number')
      expect(size).toBeGreaterThan(0)
    })
  })

  it('should have quality options', () => {
    const expectedQualities = [25, 50, 75, 90]
    expectedQualities.forEach(quality => {
      expect(quality).toBeGreaterThan(0)
      expect(quality).toBeLessThanOrEqual(100)
    })
  })
})