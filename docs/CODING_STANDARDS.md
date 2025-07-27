# 📝 Coding Standards

## Overview

This document establishes coding conventions, best practices, and quality standards for the Chasing Chapters project using Next.js, TypeScript, and Payload CMS.

## Project Structure

### Directory Organization

```
src/
├── app/                        # Next.js App Router
│   ├── (frontend)/            # Public website routes
│   │   ├── page.tsx           # Homepage
│   │   ├── layout.tsx         # Frontend layout
│   │   ├── reviews/           # Review pages
│   │   ├── tags/              # Tag pages
│   │   └── globals.css        # Global styles
│   └── (payload)/             # Payload CMS routes
│       ├── admin/             # Admin panel
│       └── api/               # API routes
├── collections/               # Payload collections
│   ├── Users.ts
│   ├── Reviews.ts
│   ├── Tags.ts
│   └── Media.ts
├── components/                # Reusable UI components
│   ├── ui/                    # Base UI components
│   ├── forms/                 # Form components
│   ├── layout/                # Layout components
│   └── reviews/               # Review-specific components
├── lib/                       # Utility libraries
│   ├── api.ts                 # API helpers
│   ├── utils.ts               # General utilities
│   ├── validations.ts         # Validation schemas
│   └── constants.ts           # App constants
├── types/                     # TypeScript type definitions
│   ├── api.ts                 # API types
│   ├── review.ts              # Review types
│   └── global.ts              # Global types
├── hooks/                     # Custom React hooks
├── utilities/                 # Payload utilities
│   ├── formatSlug.ts
│   └── generateExcerpt.ts
├── admin/                     # Payload admin customizations
│   └── components/            # Custom admin components
├── styles/                    # Stylesheets
│   ├── globals.css
│   └── admin.css
└── payload.config.ts          # Payload configuration
```

## TypeScript Standards

### Type Definitions

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// types/review.ts
export interface Review {
  id: string;
  title: string;
  slug: string;
  author: string;
  excerpt: string;
  content: any; // Lexical JSON
  rating: number;
  tags: Tag[];
  coverImage?: Media;
  readingStatus: ReadingStatus;
  dateStarted?: string;
  dateFinished?: string;
  publishedDate?: string;
  status: PublishStatus;
  bookMetadata: BookMetadata;
  createdAt: string;
  updatedAt: string;
}

export type ReadingStatus = 'want-to-read' | 'currently-reading' | 'finished';
export type PublishStatus = 'draft' | 'published';

export interface BookMetadata {
  pageCount?: number;
  genre?: string;
  publishYear?: number;
  isbn?: string;
  googleBooksId?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  status: 'active' | 'inactive';
}

export interface Media {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  sizes?: {
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
    card?: {
      url: string;
      width: number;
      height: number;
    };
  };
}
```

### Naming Conventions

#### Variables and Functions
```typescript
// Use camelCase
const reviewCount = 10;
const isPublished = true;
const getUserReviews = async () => {};

// Use descriptive names
const publishedReviews = reviews.filter(r => r.status === 'published');
const averageRating = calculateAverageRating(reviews);

// Boolean variables should be questions
const isLoading = false;
const hasError = true;
const canEdit = user?.role === 'admin';
```

#### Constants
```typescript
// Use SCREAMING_SNAKE_CASE for constants
const MAX_REVIEW_LENGTH = 5000;
const DEFAULT_PAGE_SIZE = 20;
const API_ENDPOINTS = {
  REVIEWS: '/api/reviews',
  TAGS: '/api/tags',
  BOOKS_SEARCH: '/api/books/search',
} as const;

// Use const assertions for type safety
const READING_STATUSES = ['want-to-read', 'currently-reading', 'finished'] as const;
type ReadingStatus = typeof READING_STATUSES[number];
```

#### Types and Interfaces
```typescript
// Use PascalCase for types and interfaces
interface ReviewFormData {
  title: string;
  author: string;
  rating: number;
}

type ReviewStatus = 'draft' | 'published';

// Use descriptive suffixes
interface CreateReviewRequest {
  title: string;
  author: string;
}

interface ReviewResponse {
  review: Review;
  message: string;
}

// Generic types
interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
}
```

### Function Patterns

#### Component Functions
```typescript
// Use arrow functions for components
const ReviewCard: React.FC<ReviewCardProps> = ({ review, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <article className={cn('review-card', className)}>
      <h3>{review.title}</h3>
      <p>by {review.author}</p>
    </article>
  );
};

// Props interface should be named ComponentNameProps
interface ReviewCardProps {
  review: Review;
  className?: string;
  onEdit?: (id: string) => void;
}
```

#### API Functions
```typescript
// Use descriptive function names with async/await
export async function getPublishedReviews(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Review>> {
  try {
    const response = await fetch(
      `/api/reviews?page=${page}&limit=${limit}&status=published`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
}

// Use proper error handling
export async function createReview(data: CreateReviewRequest): Promise<Review> {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create review');
  }
  
  const result = await response.json();
  return result.data;
}
```

#### Utility Functions
```typescript
// Pure functions with clear inputs/outputs
export function formatRating(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + 
         '☆'.repeat(5 - Math.floor(rating)) + 
         ` (${rating.toFixed(1)})`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

// Use proper type guards
export function isPublishedReview(review: Review): boolean {
  return review.status === 'published' && Boolean(review.publishedDate);
}
```

## React/Next.js Standards

### Component Structure

```tsx
// components/ReviewCard.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Review } from '@/types/review';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';

interface ReviewCardProps {
  review: Review;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
  showExcerpt?: boolean;
  onTagClick?: (tagSlug: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  variant = 'default',
  className,
  showExcerpt = true,
  onTagClick,
}) => {
  const [imageError, setImageError] = useState(false);
  
  const handleTagClick = (tagSlug: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onTagClick?.(tagSlug);
  };
  
  return (
    <article
      className={cn(
        'review-card',
        'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow',
        {
          'p-4': variant === 'compact',
          'p-6': variant === 'default',
          'p-8': variant === 'featured',
        },
        className
      )}
    >
      <div className="flex gap-4">
        {/* Cover Image */}
        {review.coverImage && !imageError && (
          <div className="flex-shrink-0">
            <Image
              src={review.coverImage.sizes?.thumbnail?.url || review.coverImage.url}
              alt={review.coverImage.alt}
              width={80}
              height={120}
              className="rounded object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <header className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              <Link
                href={`/reviews/${review.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {review.title}
              </Link>
            </h3>
            <p className="text-sm text-gray-600">by {review.author}</p>
          </header>
          
          {/* Rating */}
          <div className="mb-3">
            <StarRating rating={review.rating} size="sm" />
          </div>
          
          {/* Excerpt */}
          {showExcerpt && review.excerpt && (
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {review.excerpt}
            </p>
          )}
          
          {/* Tags */}
          {review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {review.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  onClick={(e) => handleTagClick(tag.slug, e)}
                >
                  {tag.name}
                </Badge>
              ))}
              {review.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{review.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
```

### Hooks Patterns

```typescript
// hooks/useReviews.ts
import { useState, useEffect } from 'react';
import { Review, PaginatedResponse } from '@/types/review';
import { getPublishedReviews } from '@/lib/api';

interface UseReviewsOptions {
  page?: number;
  limit?: number;
  tags?: string[];
  sortBy?: 'publishedDate' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  refetch: () => Promise<void>;
}

export function useReviews(options: UseReviewsOptions = {}): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPublishedReviews(options);
      
      setReviews(response.docs);
      setPagination({
        currentPage: response.page,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPrevPage: response.hasPrevPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReviews();
  }, [options.page, options.limit, JSON.stringify(options.tags), options.sortBy, options.sortOrder]);
  
  return {
    reviews,
    loading,
    error,
    pagination,
    refetch: fetchReviews,
  };
}
```

### Page Components

```tsx
// app/(frontend)/reviews/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewsFilters } from '@/components/reviews/ReviewsFilters';
import { PageHeader } from '@/components/layout/PageHeader';

interface ReviewsPageProps {
  searchParams: {
    page?: string;
    tags?: string;
    sort?: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'All Reviews | Chasing Chapters',
    description: 'Browse all book reviews and discover your next great read.',
    openGraph: {
      title: 'All Reviews | Chasing Chapters',
      description: 'Browse all book reviews and discover your next great read.',
      type: 'website',
    },
  };
}

export default function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const selectedTags = searchParams.tags?.split(',').filter(Boolean) || [];
  const sortBy = searchParams.sort || 'publishedDate';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="All Reviews"
        description="Discover book reviews and find your next great read"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1">
          <ReviewsFilters
            selectedTags={selectedTags}
            sortBy={sortBy}
          />
        </aside>
        
        {/* Main Content */}
        <main className="lg:col-span-3">
          <ReviewsList
            page={currentPage}
            tags={selectedTags}
            sortBy={sortBy}
          />
        </main>
      </div>
    </div>
  );
}
```

## CSS/Styling Standards

### Tailwind CSS Conventions

```tsx
// Use semantic class combinations
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium px-4 py-2 rounded-md transition-colors',
  outline: 'border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-4 py-2 rounded-md transition-colors',
};

// Use cn utility for conditional classes
const reviewCardClasses = cn(
  'bg-white rounded-lg shadow-md p-6',
  'hover:shadow-lg transition-shadow duration-200',
  {
    'border-l-4 border-blue-500': featured,
    'opacity-50': draft,
  },
  className
);

// Responsive design patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="col-span-full lg:col-span-2">
    {/* Main content */}
  </div>
  <aside className="lg:col-span-1">
    {/* Sidebar */}
  </aside>
</div>
```

### CSS Custom Properties

```css
/* styles/globals.css */
:root {
  /* Brand Colors */
  --color-brand-primary: #3b82f6;
  --color-brand-secondary: #10b981;
  --color-brand-accent: #f59e0b;
  
  /* Text Colors */
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  
  /* Background Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-muted: #f3f4f6;
  
  /* Spacing Scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Typography Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
}

/* Component-specific styles */
.review-card {
  background: var(--color-bg-primary);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.review-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## Error Handling

### API Error Handling

```typescript
// lib/api.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP Error ${response.status}`,
        response.status,
        errorData
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new ApiError(
      'Network error or invalid response',
      0,
      error
    );
  }
}
```

### Component Error Boundaries

```tsx
// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600 mt-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Standards

### Unit Test Example

```typescript
// __tests__/utils/formatRating.test.ts
import { formatRating } from '@/lib/utils';

describe('formatRating', () => {
  it('should format whole star ratings correctly', () => {
    expect(formatRating(5)).toBe('★★★★★ (5.0)');
    expect(formatRating(3)).toBe('★★★☆☆ (3.0)');
    expect(formatRating(0)).toBe('☆☆☆☆☆ (0.0)');
  });
  
  it('should format decimal ratings correctly', () => {
    expect(formatRating(4.5)).toBe('★★★★☆ (4.5)');
    expect(formatRating(2.3)).toBe('★★☆☆☆ (2.3)');
  });
  
  it('should handle edge cases', () => {
    expect(formatRating(-1)).toBe('☆☆☆☆☆ (-1.0)');
    expect(formatRating(6)).toBe('★★★★★ (6.0)');
  });
});
```

### Component Test Example

```tsx
// __tests__/components/ReviewCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewCard } from '@/components/ReviewCard';
import { mockReview } from '@/test-utils/mocks';

describe('ReviewCard', () => {
  it('renders review information correctly', () => {
    render(<ReviewCard review={mockReview} />);
    
    expect(screen.getByText(mockReview.title)).toBeInTheDocument();
    expect(screen.getByText(`by ${mockReview.author}`)).toBeInTheDocument();
    expect(screen.getByText(mockReview.excerpt)).toBeInTheDocument();
  });
  
  it('calls onTagClick when tag is clicked', () => {
    const onTagClick = jest.fn();
    render(<ReviewCard review={mockReview} onTagClick={onTagClick} />);
    
    const tagButton = screen.getByText(mockReview.tags[0].name);
    fireEvent.click(tagButton);
    
    expect(onTagClick).toHaveBeenCalledWith(mockReview.tags[0].slug);
  });
  
  it('handles image load errors gracefully', () => {
    render(<ReviewCard review={mockReview} />);
    
    const image = screen.getByRole('img');
    fireEvent.error(image);
    
    // Should not crash and image should not be visible
    expect(image).not.toBeInTheDocument();
  });
});
```

## Code Quality Tools

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

This coding standards document ensures consistent, maintainable, and high-quality code across the Chasing Chapters project.