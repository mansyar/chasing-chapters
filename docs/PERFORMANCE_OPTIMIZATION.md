# ⚡ Performance Optimization

## Overview

This document outlines comprehensive performance optimization strategies for Chasing Chapters, covering SEO, Core Web Vitals, caching, and user experience enhancements.

## Core Web Vitals Targets

### Performance Benchmarks

| Metric | Target | Good | Poor |
|--------|--------|------|------|
| **LCP** (Largest Contentful Paint) | <2.5s | <2.5s | >4.0s |
| **FID** (First Input Delay) | <100ms | <100ms | >300ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | <0.1 | >0.25 |
| **TTFB** (Time to First Byte) | <600ms | <800ms | >1.8s |
| **FCP** (First Contentful Paint) | <1.8s | <1.8s | >3.0s |

## Next.js Performance Optimizations

### App Router Configuration

```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    ppr: true, // Partial Pre-rendering
    reactCompiler: true, // React Compiler
    after: true, // After middleware
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compress responses
  compress: true,

  // Bundle analyzer in development
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Optimize fonts
  optimizeFonts: true,

  // Remove unused CSS
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
```

### Static Generation Strategy

```typescript
// app/(frontend)/reviews/page.tsx
import { Metadata } from 'next';
import { ReviewsList } from '@/components/reviews/ReviewsList';

// Static generation with ISR
export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Book Reviews | Chasing Chapters',
    description: 'Discover thoughtful book reviews and find your next great read.',
  };
}

export default function ReviewsPage() {
  return <ReviewsList />;
}

// app/(frontend)/reviews/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getReviewBySlug, getAllReviewSlugs } from '@/lib/api';

// Generate static params for all reviews
export async function generateStaticParams() {
  const slugs = await getAllReviewSlugs();
  
  return slugs.map((slug) => ({
    slug,
  }));
}

// Static generation with dynamic revalidation
export const revalidate = 86400; // Revalidate daily

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const review = await getReviewBySlug(params.slug);
  
  if (!review) {
    return {
      title: 'Review Not Found',
    };
  }

  return {
    title: `${review.title} by ${review.author} - Review`,
    description: review.excerpt,
    openGraph: {
      title: review.title,
      description: review.excerpt,
      images: review.coverImage ? [review.coverImage.url] : [],
    },
  };
}

export default async function ReviewPage({ params }: { params: { slug: string } }) {
  const review = await getReviewBySlug(params.slug);
  
  if (!review) {
    notFound();
  }

  return <ReviewDetail review={review} />;
}
```

### Component Optimization

```tsx
// components/ReviewCard.tsx
import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Review } from '@/types/review';

interface ReviewCardProps {
  review: Review;
  priority?: boolean;
}

export const ReviewCard = memo<ReviewCardProps>(({ review, priority = false }) => {
  return (
    <article className="review-card">
      <Link href={`/reviews/${review.slug}`} prefetch={false}>
        {review.coverImage && (
          <Image
            src={review.coverImage.sizes?.card?.url || review.coverImage.url}
            alt={review.coverImage.alt}
            width={300}
            height={400}
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            className="rounded-lg object-cover"
          />
        )}
        
        <div className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2">{review.title}</h3>
          <p className="text-gray-600 text-sm">by {review.author}</p>
          <p className="text-gray-700 text-sm mt-2 line-clamp-3">{review.excerpt}</p>
        </div>
      </Link>
    </article>
  );
});

ReviewCard.displayName = 'ReviewCard';
```

### Dynamic Imports and Code Splitting

```tsx
// components/SearchModal.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const SearchFilters = lazy(() => import('./SearchFilters'));
const AdvancedSearch = lazy(() => import('./AdvancedSearch'));

export const SearchModal = () => {
  return (
    <div className="search-modal">
      <Suspense fallback={<div className="skeleton h-20" />}>
        <SearchFilters />
      </Suspense>
      
      <Suspense fallback={<div className="skeleton h-32" />}>
        <AdvancedSearch />
      </Suspense>
    </div>
  );
};

// lib/lazy-components.ts
import { ComponentType, lazy } from 'react';

// Utility for creating lazy components with better error handling
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 rounded" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
```

## Database Performance

### Query Optimization

```typescript
// lib/optimized-queries.ts
import { database } from './database';

export class OptimizedQueries {
  // Efficient pagination with cursor-based approach
  static async getReviewsPaginated(
    cursor?: string,
    limit = 20,
    filters: {
      status?: string;
      tags?: string[];
      search?: string;
    } = {}
  ) {
    let query = `
      SELECT 
        r.id, r.title, r.slug, r.author, r.excerpt, r.rating,
        r.published_date, r.cover_image,
        array_agg(DISTINCT t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL) as tags,
        COUNT(*) OVER() as total_count
      FROM reviews r
      LEFT JOIN reviews_rels rr ON r.id = rr.parent_id AND rr.path = 'tags'
      LEFT JOIN tags t ON rr.tags_id = t.id AND t.status = 'active'
      WHERE r.status = 'published'
    `;

    const params: any[] = ['published'];
    let paramCount = 1;

    // Add filters
    if (filters.search) {
      paramCount++;
      query += ` AND (r.title ILIKE $${paramCount} OR r.author ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    if (filters.tags && filters.tags.length > 0) {
      paramCount++;
      query += ` AND t.slug = ANY($${paramCount})`;
      params.push(filters.tags);
    }

    // Cursor pagination
    if (cursor) {
      paramCount++;
      query += ` AND r.published_date < $${paramCount}`;
      params.push(cursor);
    }

    query += `
      GROUP BY r.id, r.title, r.slug, r.author, r.excerpt, r.rating, r.published_date, r.cover_image
      ORDER BY r.published_date DESC
      LIMIT $${paramCount + 1}
    `;
    params.push(limit);

    return await database.query(query, params);
  }

  // Optimized search with full-text search
  static async searchReviews(searchTerm: string, limit = 10) {
    const query = `
      SELECT 
        r.*,
        ts_rank(
          setweight(to_tsvector('english', r.title), 'A') ||
          setweight(to_tsvector('english', r.author), 'B') ||
          setweight(to_tsvector('english', r.excerpt), 'C'),
          plainto_tsquery('english', $1)
        ) as rank
      FROM reviews r
      WHERE r.status = 'published'
        AND (
          to_tsvector('english', r.title || ' ' || r.author || ' ' || r.excerpt) 
          @@ plainto_tsquery('english', $1)
        )
      ORDER BY rank DESC, r.published_date DESC
      LIMIT $2
    `;

    return await database.query(query, [searchTerm, limit]);
  }

  // Cache frequently accessed data
  static async getPopularTags(limit = 20) {
    const query = `
      SELECT 
        t.id, t.name, t.slug, t.color,
        COUNT(rr.parent_id) as review_count
      FROM tags t
      LEFT JOIN reviews_rels rr ON t.id = rr.tags_id
      LEFT JOIN reviews r ON rr.parent_id = r.id AND r.status = 'published'
      WHERE t.status = 'active'
      GROUP BY t.id, t.name, t.slug, t.color
      HAVING COUNT(rr.parent_id) > 0
      ORDER BY review_count DESC
      LIMIT $1
    `;

    return await database.query(query, [limit]);
  }
}
```

### Database Indexing Strategy

```sql
-- Essential indexes for performance
-- reviews table
CREATE INDEX CONCURRENTLY idx_reviews_status_published_date 
ON reviews(status, published_date DESC) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY idx_reviews_search_vector 
ON reviews USING GIN(to_tsvector('english', title || ' ' || author || ' ' || excerpt));

CREATE INDEX CONCURRENTLY idx_reviews_author_published 
ON reviews(author, published_date DESC) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY idx_reviews_rating_published 
ON reviews(rating DESC, published_date DESC) 
WHERE status = 'published';

-- tags table
CREATE INDEX CONCURRENTLY idx_tags_status_name 
ON tags(status, name) 
WHERE status = 'active';

-- reviews_rels table
CREATE INDEX CONCURRENTLY idx_reviews_rels_tags_parent 
ON reviews_rels(tags_id, parent_id) 
WHERE path = 'tags';

-- Composite index for tag filtering
CREATE INDEX CONCURRENTLY idx_reviews_tags_published 
ON reviews_rels(tags_id, parent_id) 
INCLUDE (path)
WHERE path = 'tags';
```

## Caching Strategy

### Redis Caching Implementation

```typescript
// lib/cache.ts
import Redis from 'ioredis';

class CacheManager {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl = this.defaultTTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Cache-aside pattern for reviews
  async getReviews(page: number, filters: any): Promise<any> {
    const cacheKey = `reviews:${page}:${JSON.stringify(filters)}`;
    
    let reviews = await this.get(cacheKey);
    if (!reviews) {
      reviews = await OptimizedQueries.getReviewsPaginated(undefined, 20, filters);
      await this.set(cacheKey, reviews, 1800); // 30 minutes
    }
    
    return reviews;
  }

  // Cache popular content longer
  async getPopularTags(): Promise<any> {
    const cacheKey = 'tags:popular';
    
    let tags = await this.get(cacheKey);
    if (!tags) {
      tags = await OptimizedQueries.getPopularTags();
      await this.set(cacheKey, tags, 7200); // 2 hours
    }
    
    return tags;
  }
}

export const cache = new CacheManager();
```

### HTTP Caching Headers

```typescript
// lib/cache-headers.ts
import { NextResponse } from 'next/server';

export function setCacheHeaders(
  response: NextResponse,
  cacheControl: string,
  etag?: string
): NextResponse {
  response.headers.set('Cache-Control', cacheControl);
  
  if (etag) {
    response.headers.set('ETag', etag);
  }
  
  return response;
}

// API route example
// app/api/reviews/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  
  // Check ETag for client cache
  const etag = `"reviews-${page}-${Date.now()}"`;
  const clientETag = request.headers.get('if-none-match');
  
  if (clientETag === etag) {
    return new NextResponse(null, { status: 304 });
  }
  
  const reviews = await getReviews(parseInt(page));
  const response = NextResponse.json(reviews);
  
  return setCacheHeaders(
    response,
    'public, max-age=300, stale-while-revalidate=600', // 5 minutes cache, 10 minutes stale
    etag
  );
}
```

## Image Optimization

### Advanced Image Handling

```tsx
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes = '100vw',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    </div>
  );
};
```

### Image Processing Pipeline

```typescript
// lib/image-optimizer.ts
import sharp from 'sharp';

export class ImageOptimizer {
  static async optimizeImage(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg';
    }
  ) {
    let processor = sharp(buffer);

    // Resize if dimensions provided
    if (options.width || options.height) {
      processor = processor.resize(options.width, options.height, {
        fit: 'cover',
        withoutEnlargement: true,
      });
    }

    // Convert to optimal format
    switch (options.format) {
      case 'avif':
        processor = processor.avif({ quality: options.quality || 80 });
        break;
      case 'webp':
        processor = processor.webp({ quality: options.quality || 85 });
        break;
      case 'jpeg':
        processor = processor.jpeg({ 
          quality: options.quality || 90,
          progressive: true,
        });
        break;
    }

    // Optimize metadata
    processor = processor
      .withMetadata(false) // Remove EXIF data
      .sharpen() // Enhance sharpness
      .normalize(); // Improve contrast

    return await processor.toBuffer();
  }

  static async generateSrcSet(
    originalBuffer: Buffer,
    sizes: number[] = [400, 800, 1200, 1600]
  ) {
    const srcSet: { width: number; url: string }[] = [];

    for (const width of sizes) {
      const optimized = await this.optimizeImage(originalBuffer, {
        width,
        format: 'webp',
        quality: 85,
      });

      // Upload to R2 and get URL
      const url = await this.uploadToR2(optimized, `image-${width}w.webp`);
      srcSet.push({ width, url });
    }

    return srcSet;
  }

  private static async uploadToR2(buffer: Buffer, filename: string): Promise<string> {
    // Implementation depends on your R2 upload function
    // This is a placeholder
    return `https://cdn.example.com/${filename}`;
  }
}
```

## SEO Optimization

### Comprehensive SEO Implementation

```tsx
// components/SEOHead.tsx
import Head from 'next/head';
import { Review } from '@/types/review';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: {
    type?: string;
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  };
  jsonLd?: object;
  noindex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Chasing Chapters - Book Reviews & Reading Journey',
  description = 'Discover thoughtful book reviews, reading recommendations, and literary insights.',
  canonical,
  openGraph,
  jsonLd,
  noindex = false,
}) => {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL;
  const fullTitle = title.includes('Chasing Chapters') ? title : `${title} | Chasing Chapters`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:type" content={openGraph?.type || 'website'} />
      <meta property="og:title" content={openGraph?.title || title} />
      <meta property="og:description" content={openGraph?.description || description} />
      <meta property="og:url" content={openGraph?.url || canonical || siteUrl} />
      <meta property="og:site_name" content="Chasing Chapters" />
      {openGraph?.image && <meta property="og:image" content={openGraph.image} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={openGraph?.title || title} />
      <meta name="twitter:description" content={openGraph?.description || description} />
      {openGraph?.image && <meta name="twitter:image" content={openGraph.image} />}
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
};

// Generate structured data for reviews
export function generateReviewJsonLd(review: Review) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewBody: review.excerpt,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 0,
    },
    author: {
      '@type': 'Person',
      name: 'Chasing Chapters',
    },
    itemReviewed: {
      '@type': 'Book',
      name: review.title,
      author: {
        '@type': 'Person',
        name: review.author,
      },
      isbn: review.bookMetadata?.isbn,
      numberOfPages: review.bookMetadata?.pageCount,
      genre: review.bookMetadata?.genre,
      datePublished: review.bookMetadata?.publishYear,
    },
    datePublished: review.publishedDate,
    publisher: {
      '@type': 'Organization',
      name: 'Chasing Chapters',
    },
  };
}
```

### Sitemap Generation

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllReviews, getAllTags } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasingchapters.com';
  
  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Dynamic review routes
  const reviews = await getAllReviews();
  const reviewRoutes = reviews.map((review) => ({
    url: `${baseUrl}/reviews/${review.slug}`,
    lastModified: new Date(review.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Dynamic tag routes
  const tags = await getAllTags();
  const tagRoutes = tags.map((tag) => ({
    url: `${baseUrl}/tags/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...reviewRoutes, ...tagRoutes];
}
```

### Robots.txt Configuration

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasingchapters.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/uploads/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

## Frontend Performance

### Component Virtualization

```tsx
// components/VirtualizedReviewList.tsx
import { FixedSizeList as List } from 'react-window';
import { Review } from '@/types/review';
import { ReviewCard } from './ReviewCard';

interface VirtualizedReviewListProps {
  reviews: Review[];
  height: number;
  itemHeight: number;
}

export const VirtualizedReviewList: React.FC<VirtualizedReviewListProps> = ({
  reviews,
  height,
  itemHeight,
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ReviewCard review={reviews[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={reviews.length}
      itemSize={itemHeight}
      overscanCount={5}
    >
      {Row}
    </List>
  );
};
```

### Intersection Observer for Lazy Loading

```tsx
// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [options]);

  return { targetRef, isIntersecting };
}

// components/LazyReviewCard.tsx
export const LazyReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const { targetRef, isIntersecting } = useIntersectionObserver();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  return (
    <div ref={targetRef} className="min-h-[300px]">
      {hasLoaded ? (
        <ReviewCard review={review} />
      ) : (
        <div className="bg-gray-200 animate-pulse h-[300px] rounded-lg" />
      )}
    </div>
  );
};
```

## Performance Monitoring

### Web Vitals Tracking

```typescript
// lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export function trackWebVitals() {
  function sendToAnalytics(metric: WebVitalMetric) {
    // Send to your analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Log for debugging
    console.log(metric);
  }

  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { trackWebVitals } from '@/lib/web-vitals';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    trackWebVitals();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Performance Budget Monitoring

```typescript
// lib/performance-budget.ts
interface PerformanceBudget {
  name: string;
  budget: number;
  actual: number;
  status: 'pass' | 'warn' | 'fail';
}

export class PerformanceBudgetMonitor {
  private budgets: PerformanceBudget[] = [];

  checkBudgets() {
    // Check bundle size
    if (typeof window !== 'undefined') {
      this.checkBundleSize();
      this.checkResourceTiming();
      this.checkCoreWebVitals();
    }
  }

  private checkBundleSize() {
    // This would typically be done in a build script
    // For client-side, we can estimate from loaded resources
    const scripts = Array.from(document.scripts);
    const totalSize = scripts.reduce((total, script) => {
      // Estimate size (this is approximate)
      return total + (script.text?.length || 0);
    }, 0);

    this.budgets.push({
      name: 'JavaScript Bundle Size',
      budget: 500 * 1024, // 500KB
      actual: totalSize,
      status: totalSize <= 500 * 1024 ? 'pass' : 'fail',
    });
  }

  private checkResourceTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;

      this.budgets.push(
        {
          name: 'Time to First Byte',
          budget: 600,
          actual: ttfb,
          status: ttfb <= 600 ? 'pass' : ttfb <= 1000 ? 'warn' : 'fail',
        },
        {
          name: 'First Contentful Paint',
          budget: 1800,
          actual: fcp,
          status: fcp <= 1800 ? 'pass' : fcp <= 3000 ? 'warn' : 'fail',
        }
      );
    }
  }

  private checkCoreWebVitals() {
    // Core Web Vitals would be checked via the web-vitals library
    // This is a placeholder for the actual implementation
  }

  getBudgetReport(): PerformanceBudget[] {
    return this.budgets;
  }

  alertOnFailures() {
    const failures = this.budgets.filter(budget => budget.status === 'fail');
    
    if (failures.length > 0) {
      console.warn('Performance budget failures:', failures);
      
      // Send to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        // Send alert to monitoring service
      }
    }
  }
}
```

## Build Optimization

### Webpack Bundle Analysis

```bash
# Package.json scripts
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "build:analyze": "npm run build && npx @next/bundle-analyzer .next",
    "lighthouse": "lighthouse https://localhost:3000 --output json --output html --form-factor=mobile",
    "performance-test": "node scripts/performance-test.js"
  }
}
```

### Custom Webpack Configuration

```javascript
// next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    // Add webpack plugins for optimization
    config.plugins.push(
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      })
    );

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

This comprehensive performance optimization guide ensures Chasing Chapters delivers exceptional user experience with fast loading times, excellent Core Web Vitals scores, and strong SEO performance.