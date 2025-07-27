# 🔗 API Specification

## Overview

This document outlines the API structure for Chasing Chapters, including Payload CMS REST/GraphQL APIs and custom endpoints for Google Books integration.

## Base Configuration

- **Base URL**: `https://yourdomain.com`
- **API Prefix**: `/api`
- **Authentication**: JWT-based via Payload CMS
- **Content Type**: `application/json`

## Payload CMS APIs

### Authentication Endpoints

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Auth Passed",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "collection": "users"
  },
  "token": "jwt_token_string",
  "exp": 1640995200
}
```

#### Logout
```http
POST /api/users/logout
Authorization: Bearer <jwt_token>
```

#### Current User
```http
GET /api/users/me
Authorization: Bearer <jwt_token>
```

### Reviews Collection API

#### Get All Reviews
```http
GET /api/reviews
```

**Query Parameters:**
- `depth` (number): Relationship depth (0-10)
- `limit` (number): Number of results (default: 10)
- `page` (number): Page number
- `sort` (string): Sort field (-field for desc)
- `where` (object): Filter conditions

**Example:**
```http
GET /api/reviews?where[status][equals]=published&sort=-publishedDate&limit=20
```

**Response:**
```json
{
  "docs": [
    {
      "id": "review_id",
      "title": "The Great Gatsby",
      "slug": "the-great-gatsby",
      "author": "F. Scott Fitzgerald",
      "excerpt": "A masterpiece of American literature...",
      "rating": 4.5,
      "tags": [
        {
          "id": "tag_id",
          "name": "Classic Literature",
          "slug": "classic-literature",
          "color": "#3B82F6"
        }
      ],
      "coverImage": {
        "id": "media_id",
        "url": "https://r2.example.com/covers/gatsby.jpg",
        "alt": "The Great Gatsby cover"
      },
      "content": "Rich text content...",
      "readingStatus": "finished",
      "dateStarted": "2024-01-15T00:00:00.000Z",
      "dateFinished": "2024-01-25T00:00:00.000Z",
      "publishedDate": "2024-01-26T00:00:00.000Z",
      "status": "published",
      "pageCount": 180,
      "genre": "Fiction",
      "publishYear": 1925,
      "isbn": "9780743273565",
      "googleBooksId": "iJZqAAAAMAAJ",
      "createdAt": "2024-01-26T10:00:00.000Z",
      "updatedAt": "2024-01-26T10:00:00.000Z"
    }
  ],
  "totalDocs": 50,
  "limit": 20,
  "totalPages": 3,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2
}
```

#### Get Single Review
```http
GET /api/reviews/:id
GET /api/reviews/slug/:slug
```

#### Create Review
```http
POST /api/reviews
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Book Title",
  "author": "Book Author",
  "excerpt": "Brief description...",
  "rating": 4.5,
  "tags": ["tag_id_1", "tag_id_2"],
  "content": "Full review content...",
  "readingStatus": "finished",
  "dateStarted": "2024-01-15T00:00:00.000Z",
  "dateFinished": "2024-01-25T00:00:00.000Z",
  "status": "published",
  "pageCount": 180,
  "genre": "Fiction",
  "publishYear": 1925,
  "isbn": "9780743273565",
  "googleBooksId": "iJZqAAAAMAAJ"
}
```

#### Update Review
```http
PATCH /api/reviews/:id
Authorization: Bearer <jwt_token>
```

#### Delete Review
```http
DELETE /api/reviews/:id
Authorization: Bearer <jwt_token>
```

### Tags Collection API

#### Get All Tags
```http
GET /api/tags
```

**Response:**
```json
{
  "docs": [
    {
      "id": "tag_id",
      "name": "Classic Literature",
      "slug": "classic-literature",
      "description": "Timeless works of literature",
      "color": "#3B82F6",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Tag
```http
POST /api/tags
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Science Fiction",
  "description": "Futuristic and speculative fiction",
  "color": "#10B981",
  "status": "active"
}
```

### Media Collection API

#### Upload File
```http
POST /api/media
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

file: <binary_data>
alt: "Image description"
```

#### Get Media
```http
GET /api/media/:id
```

## Custom API Endpoints

### Google Books Integration

#### Search Books
```http
GET /api/books/search?q=gatsby&maxResults=10
```

**Query Parameters:**
- `q` (string, required): Search query
- `maxResults` (number): Number of results (1-40, default: 10)
- `startIndex` (number): Starting index for pagination

**Response:**
```json
{
  "kind": "books#volumes",
  "totalItems": 1000,
  "items": [
    {
      "id": "iJZqAAAAMAAJ",
      "volumeInfo": {
        "title": "The Great Gatsby",
        "authors": ["F. Scott Fitzgerald"],
        "publishedDate": "1925",
        "description": "The story of the fabulously wealthy Jay Gatsby...",
        "pageCount": 180,
        "categories": ["Fiction"],
        "imageLinks": {
          "thumbnail": "http://books.google.com/books/content?id=iJZqAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
          "smallThumbnail": "http://books.google.com/books/content?id=iJZqAAAAMAAJ&printsec=frontcover&img=1&zoom=5&source=gbs_api"
        },
        "industryIdentifiers": [
          {
            "type": "ISBN_13",
            "identifier": "9780743273565"
          }
        ]
      }
    }
  ]
}
```

#### Get Book Details
```http
GET /api/books/:googleBooksId
```

**Response:**
```json
{
  "id": "iJZqAAAAMAAJ",
  "volumeInfo": {
    "title": "The Great Gatsby",
    "authors": ["F. Scott Fitzgerald"],
    "publishedDate": "1925",
    "description": "Complete book description...",
    "pageCount": 180,
    "categories": ["Fiction"],
    "imageLinks": {
      "thumbnail": "http://books.google.com/books/content?id=iJZqAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
    },
    "industryIdentifiers": [
      {
        "type": "ISBN_13",
        "identifier": "9780743273565"
      }
    ]
  }
}
```

## GraphQL API

### Endpoint
```http
POST /api/graphql
Content-Type: application/json
```

### Queries

#### Get Reviews
```graphql
query GetReviews($limit: Int, $where: ReviewWhereInput) {
  Reviews(limit: $limit, where: $where) {
    docs {
      id
      title
      slug
      author
      excerpt
      rating
      tags {
        name
        slug
        color
      }
      coverImage {
        url
        alt
      }
      readingStatus
      publishedDate
      status
    }
    totalDocs
    hasNextPage
  }
}
```

#### Get Single Review
```graphql
query GetReview($id: String!) {
  Review(id: $id) {
    id
    title
    slug
    author
    excerpt
    rating
    content
    tags {
      id
      name
      slug
      color
    }
    coverImage {
      url
      alt
    }
    readingStatus
    dateStarted
    dateFinished
    publishedDate
    pageCount
    genre
    publishYear
    isbn
    googleBooksId
  }
}
```

### Mutations

#### Create Review
```graphql
mutation CreateReview($data: mutationReviewInput!) {
  createReview(data: $data) {
    id
    title
    slug
    status
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "errors": [
    {
      "message": "Validation failed",
      "data": [
        {
          "field": "title",
          "message": "Title is required"
        }
      ]
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Google Books API Errors
```json
{
  "error": {
    "code": 400,
    "message": "Invalid query parameter",
    "details": "The 'q' parameter is required"
  }
}
```

## Rate Limiting

### Payload CMS APIs
- **Rate Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1640995200

### Google Books API
- **Rate Limit**: 1000 requests per day per API key
- **Burst Limit**: 100 requests per 100 seconds
- **Caching**: 1 hour for search results, 24 hours for book details

## Authentication Examples

### Using JWT Token
```javascript
// JavaScript example
const response = await fetch('/api/reviews', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reviewData)
});
```

### Login and Store Token
```javascript
// Login and get token
const loginResponse = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();
localStorage.setItem('authToken', token);
```

## Webhook Events

### Review Published
```http
POST /api/webhooks/review-published
Content-Type: application/json

{
  "event": "review.published",
  "data": {
    "id": "review_id",
    "title": "Book Title",
    "slug": "book-title",
    "publishedDate": "2024-01-26T10:00:00.000Z"
  }
}
```

### Media Uploaded
```http
POST /api/webhooks/media-uploaded
Content-Type: application/json

{
  "event": "media.uploaded",
  "data": {
    "id": "media_id",
    "url": "https://r2.example.com/uploads/image.jpg",
    "alt": "Image description"
  }
}
```

## Development Examples

### Frontend Data Fetching
```typescript
// types/api.ts
export interface Review {
  id: string;
  title: string;
  slug: string;
  author: string;
  excerpt: string;
  rating: number;
  tags: Tag[];
  coverImage?: Media;
  content: string;
  readingStatus: 'want-to-read' | 'currently-reading' | 'finished';
  publishedDate: string;
  status: 'draft' | 'published';
}

// lib/api.ts
export async function getReviews(limit = 10): Promise<Review[]> {
  const response = await fetch(`/api/reviews?limit=${limit}&where[status][equals]=published&sort=-publishedDate`);
  const data = await response.json();
  return data.docs;
}

export async function getReviewBySlug(slug: string): Promise<Review | null> {
  const response = await fetch(`/api/reviews/slug/${slug}`);
  if (!response.ok) return null;
  return response.json();
}
```

### Google Books Integration
```typescript
// lib/google-books.ts
export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

export async function searchBooks(query: string): Promise<GoogleBook[]> {
  const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.items || [];
}
```

This API specification provides a comprehensive guide for both frontend development and third-party integrations with the Chasing Chapters platform.