'use client'

import React, { useState, useEffect } from 'react'
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react'

interface SocialShareProps {
  url: string
  title: string
  description?: string
  hashtags?: string[]
  via?: string
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal'
}

export default function SocialShare({
  url,
  title,
  description = '',
  hashtags = [],
  via = 'chasingchapters',
  className = '',
  showLabel = true,
  size = 'md',
  variant = 'default'
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [canShare, setCanShare] = useState(false)

  // Check for native sharing support after component mounts
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // Ensure URL is absolute
  const shareUrl = url.startsWith('http') 
    ? url 
    : typeof window !== 'undefined' 
      ? `${window.location.origin}${url}` 
      : url
  
  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  }
  
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }

  // Share URLs
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}&via=${via}${hashtags.length ? `&hashtags=${hashtags.join(',')}` : ''}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`
  }

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setShareError(null)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      setShareError('Failed to copy link')
      setTimeout(() => setShareError(null), 3000)
    }
  }

  // Handle native sharing (if available)
  const handleNativeShare = async () => {
    if (!navigator.share) return false
    
    try {
      await navigator.share({
        title,
        text: description,
        url: shareUrl
      })
      return true
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Native sharing failed:', error)
        setShareError('Sharing failed')
        setTimeout(() => setShareError(null), 3000)
      }
      return false
    }
  }

  // Handle social media sharing
  const handleShare = (platform: string) => {
    const width = 600
    const height = 400
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    
    window.open(
      shareUrls[platform as keyof typeof shareUrls],
      `share-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )
  }

  // Button base classes
  const baseButtonClasses = `
    inline-flex items-center justify-center
    ${sizeClasses[size]}
    rounded-full
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const buttonVariants = {
    default: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 focus:ring-neutral-500',
    minimal: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:ring-neutral-500'
  }

  // Platform-specific styling
  const platformStyles = {
    twitter: 'hover:bg-blue-50 hover:text-blue-600 focus:ring-blue-500',
    facebook: 'hover:bg-blue-50 hover:text-blue-700 focus:ring-blue-500',
    linkedin: 'hover:bg-blue-50 hover:text-blue-600 focus:ring-blue-500',
    copy: copied ? 'bg-green-50 text-green-600' : ''
  }

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {showLabel && (
        <h3 className="text-sm font-medium text-neutral-700 flex items-center">
          <Share2 className="h-4 w-4 mr-2" />
          Share this review
        </h3>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Native Share Button (mobile) */}
        {canShare && (
          <button
            onClick={handleNativeShare}
            className={`${baseButtonClasses} ${buttonVariants[variant]}`}
            aria-label="Share using device sharing"
            title="Share"
          >
            <Share2 size={iconSize[size]} />
          </button>
        )}

        {/* Twitter/X */}
        <button
          onClick={() => handleShare('twitter')}
          className={`${baseButtonClasses} ${buttonVariants[variant]} ${platformStyles.twitter}`}
          aria-label="Share on Twitter/X"
          title="Share on Twitter/X"
        >
          <Twitter size={iconSize[size]} />
        </button>

        {/* Facebook */}
        <button
          onClick={() => handleShare('facebook')}
          className={`${baseButtonClasses} ${buttonVariants[variant]} ${platformStyles.facebook}`}
          aria-label="Share on Facebook"
          title="Share on Facebook"
        >
          <Facebook size={iconSize[size]} />
        </button>

        {/* LinkedIn */}
        <button
          onClick={() => handleShare('linkedin')}
          className={`${baseButtonClasses} ${buttonVariants[variant]} ${platformStyles.linkedin}`}
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
        >
          <Linkedin size={iconSize[size]} />
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className={`${baseButtonClasses} ${buttonVariants[variant]} ${platformStyles.copy}`}
          aria-label={copied ? 'Link copied!' : 'Copy link'}
          title={copied ? 'Link copied!' : 'Copy link'}
        >
          {copied ? (
            <Check size={iconSize[size]} />
          ) : (
            <Link2 size={iconSize[size]} />
          )}
        </button>
      </div>

      {/* Status Messages */}
      {copied && (
        <p className="text-sm text-green-600 flex items-center animate-fade-in">
          <Check className="h-4 w-4 mr-1" />
          Link copied to clipboard!
        </p>
      )}

      {shareError && (
        <p className="text-sm text-red-600 animate-fade-in">
          {shareError}
        </p>
      )}

      {/* Keyboard Instructions */}
      <div className="sr-only">
        <p>Use Space or Enter to activate sharing buttons</p>
      </div>
    </div>
  )
}

// Simplified version for inline usage
interface SocialShareInlineProps {
  url: string
  title: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SocialShareInline({ 
  url, 
  title, 
  className = '',
  size = 'sm' 
}: SocialShareInlineProps) {
  return (
    <SocialShare
      url={url}
      title={title}
      className={className}
      showLabel={false}
      variant="minimal"
      size={size}
    />
  )
}