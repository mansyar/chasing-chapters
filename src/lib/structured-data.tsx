import React from 'react'
import { Review, Tag, Media } from '@/payload-types'

/**
 * Schema.org structured data utilities for SEO optimization
 */

// Website schema for organization
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Chasing Chapters',
    description: 'A personal book review blog where literature comes alive through thoughtful reviews and reading adventures.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    author: {
      '@type': 'Person',
      name: 'Chasing Chapters',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chasing Chapters',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com',
    },
  }
}

// Organization schema
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Chasing Chapters',
    description: 'A personal book review blog where literature comes alive through thoughtful reviews and reading adventures.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'}/logo.png`,
    sameAs: [
      // Add social media URLs here when available
    ],
  }
}

// Blog schema for the website
export function generateBlogSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Chasing Chapters',
    description: 'A personal book review blog where literature comes alive through thoughtful reviews and reading adventures.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com',
    author: {
      '@type': 'Person',
      name: 'Chasing Chapters',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chasing Chapters',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com',
    },
  }
}

// Book schema for individual books
export function generateBookSchema(review: Review & {
  coverImage?: Media
  tags?: (number | Tag)[]
}) {
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: review.title,
    author: {
      '@type': 'Person',
      name: review.author,
    },
    ...(review.isbn && { isbn: review.isbn }),
    ...(review.pageCount && { numberOfPages: review.pageCount }),
    ...(review.publishYear && { datePublished: review.publishYear.toString() }),
    ...(review.genre && { genre: review.genre }),
    ...(review.coverImage?.url && {
      image: {
        '@type': 'ImageObject',
        url: review.coverImage.url,
        ...(review.coverImage.alt && { caption: review.coverImage.alt }),
      }
    }),
    ...(review.googleBooksId && { 
      sameAs: `https://books.google.com/books?id=${review.googleBooksId}` 
    }),
  }

  return bookSchema
}

// Review schema for individual book reviews
export function generateReviewSchema(review: Review & {
  coverImage?: Media
  tags?: (number | Tag)[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${baseUrl}/reviews/${review.slug}`,
    headline: `${review.title} by ${review.author} - Review`,
    description: review.excerpt || `Read my ${review.rating}/5 star review of "${review.title}" by ${review.author}.`,
    author: {
      '@type': 'Person',
      name: 'Chasing Chapters',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chasing Chapters',
      url: baseUrl,
    },
    datePublished: review.publishedDate,
    dateModified: review.updatedAt,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    itemReviewed: generateBookSchema(review),
    reviewBody: review.excerpt,
    url: `${baseUrl}/reviews/${review.slug}`,
    ...(review.coverImage?.url && {
      image: {
        '@type': 'ImageObject',
        url: review.coverImage.url,
        ...(review.coverImage.alt && { caption: review.coverImage.alt }),
      }
    }),
    // Add reading status as additional property
    ...(review.readingStatus && {
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'readingStatus',
        value: review.readingStatus,
      }
    }),
    // Add tags as keywords
    ...(review.tags && review.tags.length > 0 && {
      keywords: review.tags
        .filter((tag): tag is Tag => typeof tag === 'object' && tag !== null)
        .map(tag => tag.name)
        .join(', ')
    }),
  }
}

// Article schema for blog posts/reviews (alternative to Review schema)
export function generateArticleSchema(review: Review & {
  coverImage?: Media
  tags?: (number | Tag)[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${baseUrl}/reviews/${review.slug}`,
    headline: `${review.title} by ${review.author} - Review`,
    description: review.excerpt || `Read my ${review.rating}/5 star review of "${review.title}" by ${review.author}.`,
    author: {
      '@type': 'Person',
      name: 'Chasing Chapters',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chasing Chapters',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 200,
        height: 60,
      }
    },
    datePublished: review.publishedDate,
    dateModified: review.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/reviews/${review.slug}`,
    },
    ...(review.coverImage?.url && {
      image: {
        '@type': 'ImageObject',
        url: review.coverImage.url,
        width: 400,
        height: 600,
        ...(review.coverImage.alt && { caption: review.coverImage.alt }),
      }
    }),
    articleSection: 'Book Reviews',
    wordCount: review.excerpt ? review.excerpt.length : 0,
    // Add tags as keywords
    ...(review.tags && review.tags.length > 0 && {
      keywords: review.tags
        .filter((tag): tag is Tag => typeof tag === 'object' && tag !== null)
        .map(tag => tag.name)
        .join(', ')
    }),
  }
}

// Breadcrumb schema for navigation
export function generateBreadcrumbSchema(items: Array<{
  name: string
  url: string
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }
}

// FAQ schema for common questions (can be used on about/contact pages)
export function generateFAQSchema(faqs: Array<{
  question: string
  answer: string
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// ItemList schema for review listings
export function generateItemListSchema(
  reviews: Array<Review & { coverImage?: Media; tags?: (number | Tag)[] }>,
  listType: 'recent' | 'popular' | 'category' = 'recent'
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${listType.charAt(0).toUpperCase() + listType.slice(1)} Book Reviews`,
    description: `A list of ${listType} book reviews from Chasing Chapters`,
    numberOfItems: reviews.length,
    itemListElement: reviews.map((review, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Review',
        '@id': `${baseUrl}/reviews/${review.slug}`,
        name: `${review.title} by ${review.author} - Review`,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
        },
        itemReviewed: {
          '@type': 'Book',
          name: review.title,
          author: {
            '@type': 'Person',
            name: review.author,
          },
        },
      },
    })),
  }
}

/**
 * Utility to inject structured data into HTML head
 */
export function generateStructuredDataScript(schema: object): string {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
}

/**
 * React component for structured data injection
 */
export function StructuredData({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}