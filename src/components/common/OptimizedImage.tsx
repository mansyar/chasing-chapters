'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'

interface OptimizedImageProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  sizes?: string
  quality?: number
  priority?: boolean
  loading?: 'lazy' | 'eager'
  fallbackIcon?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes,
  quality = 75,
  priority = false,
  loading = 'lazy',
  fallbackIcon,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Default blur placeholder - a small, blurred neutral image
  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }

  // Show fallback if no src, image error, or still loading with error
  const showFallback = !src || imageError

  const defaultFallback = (
    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
      {fallbackIcon || <BookOpen className="h-12 w-12 text-neutral-400" />}
    </div>
  )

  if (showFallback) {
    return defaultFallback
  }

  const imageProps = {
    src,
    alt,
    className,
    quality,
    priority,
    loading,
    placeholder: 'blur' as const,
    blurDataURL,
    onLoad: handleLoad,
    onError: handleError,
    sizes,
  }

  if (fill) {
    return (
      <>
        <Image
          {...imageProps}
          fill
        />
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}
      </>
    )
  }

  if (width && height) {
    return (
      <div className="relative">
        <Image
          {...imageProps}
          width={width}
          height={height}
        />
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }

  // Fallback to basic Image if neither fill nor dimensions provided
  return (
    <Image
      {...imageProps}
      width={width || 400}
      height={height || 400}
    />
  )
}