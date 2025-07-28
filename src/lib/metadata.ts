import { Metadata } from 'next'

interface SiteMetadata {
  title: string
  description: string
  siteName: string
  url: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'article'
  publishedTime?: string
  authors?: string[]
  section?: string
  tags?: string[]
}

/**
 * Generates comprehensive metadata including Open Graph and Twitter Card tags
 */
export function generateSiteMetadata({
  title,
  description,
  siteName,
  url,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  authors,
  section,
  tags
}: SiteMetadata): Metadata {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
  const canonicalUrl = url.startsWith('http') ? url : `https://chasingchapters.com${url}`
  
  // Base metadata
  const metadata: Metadata = {
    title: fullTitle,
    description,
    
    // Open Graph
    openGraph: {
      title: title,
      description,
      url: canonicalUrl,
      siteName,
      type: type as any,
      locale: 'en_US',
      ...(image && {
        images: [{
          url: image,
          width: image.includes('cover') ? 400 : 1200,
          height: image.includes('cover') ? 600 : 630,
          alt: imageAlt || title,
        }]
      }),
      ...(type === 'article' && publishedTime && {
        publishedTime,
        ...(authors && { authors }),
        ...(section && { section }),
        ...(tags && { tags })
      })
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: title,
      description,
      site: '@chasingchapters', // Replace with actual Twitter handle if available
      creator: '@chasingchapters',
      ...(image && {
        images: [{
          url: image,
          alt: imageAlt || title,
        }]
      })
    },
    
    // Additional metadata
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
  
  return metadata
}

/**
 * Default site configuration
 */
export const siteConfig = {
  name: 'Chasing Chapters',
  description: 'A personal book review blog where literature comes alive through thoughtful reviews and reading adventures.',
  url: 'https://chasingchapters.com',
  ogImage: '/og-default.jpg', // Default fallback image
  author: 'Chasing Chapters',
  twitterHandle: '@chasingchapters',
}

/**
 * Generates metadata for book review pages
 */
export function generateReviewMetadata({
  title,
  author,
  excerpt,
  slug,
  coverImage,
  publishedDate,
  rating,
  tags,
  genre
}: {
  title: string
  author: string
  excerpt: string
  slug: string
  coverImage?: { url?: string; alt?: string; width?: number; height?: number }
  publishedDate: string
  rating: number
  tags?: Array<{ name: string }>
  genre?: string
}): Metadata {
  const reviewTitle = `${title} by ${author} - Review`
  const reviewDescription = excerpt || `Read my ${rating}/5 star review of "${title}" by ${author}. ${genre ? `A ${genre.toLowerCase()} book ` : ''}that's worth your time.`
  
  return generateSiteMetadata({
    title: reviewTitle,
    description: reviewDescription,
    siteName: siteConfig.name,
    url: `/reviews/${slug}`,
    image: coverImage?.url,
    imageAlt: coverImage?.alt || `Cover of ${title} by ${author}`,
    type: 'article',
    publishedTime: publishedDate,
    authors: [siteConfig.author],
    section: 'Book Reviews',
    tags: tags?.map(tag => tag.name)
  })
}

/**
 * Generates metadata for homepage
 */
export function generateHomeMetadata(): Metadata {
  return generateSiteMetadata({
    title: 'Welcome to Chasing Chapters',
    description: siteConfig.description,
    siteName: siteConfig.name,
    url: '/',
    image: siteConfig.ogImage,
    imageAlt: 'Chasing Chapters - Book Reviews & Reading Adventures'
  })
}

/**
 * Generates metadata for static pages
 */
export function generatePageMetadata({
  title,
  description,
  slug,
  image
}: {
  title: string
  description: string
  slug: string
  image?: string
}): Metadata {
  return generateSiteMetadata({
    title,
    description,
    siteName: siteConfig.name,
    url: `/${slug}`,
    image: image || siteConfig.ogImage,
    imageAlt: title
  })
}