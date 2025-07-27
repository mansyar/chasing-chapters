# ⚙️ Payload CMS Configuration

## Overview

This document provides comprehensive configuration details for Payload CMS in the Chasing Chapters application, including collections setup, admin UI customization, and integration patterns.

## Core Configuration

### Main Config File

```typescript
// src/payload.config.ts
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Reviews } from './collections/Reviews'
import { Tags } from './collections/Tags'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Admin panel configuration
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- Chasing Chapters',
      favicon: '/favicon.ico',
      ogImage: '/images/og-image.jpg',
    },
    css: path.resolve(dirname, 'styles/admin.css'),
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // Custom dashboard
      views: {
        Dashboard: path.resolve(dirname, 'admin/components/Dashboard'),
      },
      // Custom field components
      afterNavLinks: [
        path.resolve(dirname, 'admin/components/QuickActions'),
      ],
    },
  },
  
  // Collections configuration
  collections: [Users, Reviews, Tags, Media],
  
  // Rich text editor
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      // Custom lexical features for book reviews
      BlockquoteFeature(),
      LinkFeature({
        enabledCollections: ['reviews'],
      }),
      RelationshipFeature(),
    ],
  }),
  
  // Environment variables
  secret: process.env.PAYLOAD_SECRET || '',
  
  // TypeScript configuration
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  
  // Database configuration
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  
  // Image processing
  sharp,
  
  // Plugins
  plugins: [
    // Cloudflare R2 storage
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: process.env.R2_ENDPOINT || '',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
      },
    }),
    
    // Cloud plugin for hosting
    payloadCloudPlugin(),
    
    // SEO plugin
    seoPlugin({
      collections: ['reviews'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc.title} - Book Review | Chasing Chapters`,
      generateDescription: ({ doc }) => doc.excerpt,
    }),
    
    // Form builder for contact forms
    formBuilderPlugin({
      fields: {
        payment: false,
        message: true,
      },
      formSubmissionOverrides: {
        fields: [
          {
            name: 'submittedOn',
            type: 'date',
            admin: {
              readOnly: true,
            },
          },
        ],
      },
    }),
  ],
  
  // Global settings
  globals: [
    {
      slug: 'settings',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          defaultValue: 'Chasing Chapters',
        },
        {
          name: 'siteDescription',
          type: 'textarea',
          defaultValue: 'Personal book reviews and reading journey',
        },
        {
          name: 'socialLinks',
          type: 'group',
          fields: [
            {
              name: 'instagram',
              type: 'text',
            },
            {
              name: 'twitter',
              type: 'text',
            },
            {
              name: 'goodreads',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
  
  // CORS configuration
  cors: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ],
  
  // CSRF protection
  csrf: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ],
})
```

## Collection Configurations

### Reviews Collection (Complete)

```typescript
// src/collections/Reviews.ts
import type { CollectionConfig } from 'payload'
import { formatSlug } from '../utilities/formatSlug'
import { generateExcerpt } from '../utilities/generateExcerpt'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'rating', 'status', 'publishedDate'],
    group: 'Content',
    pagination: {
      defaultLimit: 25,
      limits: [10, 25, 50, 100],
    },
    preview: (doc) => {
      return `${process.env.FRONTEND_URL}/reviews/${doc.slug}`;
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: { equals: 'published' }
      };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // Hero Tab
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            // Basic Information
            {
              name: 'title',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                placeholder: 'Enter book title...',
              },
            },
            {
              name: 'slug',
              type: 'text',
              index: true,
              unique: true,
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
              hooks: {
                beforeValidate: [formatSlug('title')],
              },
            },
            {
              name: 'author',
              type: 'text',
              required: true,
              index: true,
              admin: {
                placeholder: 'Book author name...',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 300,
              admin: {
                placeholder: 'Brief review summary for listings and SEO...',
                description: 'This will be used in review listings and meta descriptions',
              },
              hooks: {
                beforeValidate: [
                  ({ data, value }) => {
                    if (!value && data.content) {
                      return generateExcerpt(data.content);
                    }
                    return value;
                  },
                ],
              },
            },
            
            // Review Content
            {
              name: 'content',
              type: 'richText',
              required: true,
              admin: {
                placeholder: 'Write your book review...',
              },
            },
            
            // Rating and Tags
            {
              type: 'row',
              fields: [
                {
                  name: 'rating',
                  type: 'number',
                  min: 0,
                  max: 5,
                  step: 0.5,
                  required: true,
                  admin: {
                    width: '50%',
                    placeholder: '0.0',
                    description: 'Rating from 0 to 5 stars (half increments allowed)',
                  },
                },
                {
                  name: 'tags',
                  type: 'relationship',
                  relationTo: 'tags',
                  hasMany: true,
                  index: true,
                  admin: {
                    width: '50%',
                    sortOptions: 'name',
                  },
                  filterOptions: {
                    status: { equals: 'active' },
                  },
                },
              ],
            },
            
            // Cover Image
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              required: false,
              admin: {
                description: 'Book cover image (will use Google Books image if not provided)',
              },
            },
          ],
        },
        {
          label: 'Reading Progress',
          fields: [
            {
              name: 'readingStatus',
              type: 'select',
              options: [
                { label: 'Want to Read', value: 'want-to-read' },
                { label: 'Currently Reading', value: 'currently-reading' },
                { label: 'Finished', value: 'finished' },
              ],
              required: true,
              index: true,
              defaultValue: 'finished',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'dateStarted',
                  type: 'date',
                  admin: {
                    width: '50%',
                    condition: (data) => ['currently-reading', 'finished'].includes(data.readingStatus),
                    description: 'When you started reading this book',
                  },
                },
                {
                  name: 'dateFinished',
                  type: 'date',
                  admin: {
                    width: '50%',
                    condition: (data) => data.readingStatus === 'finished',
                    description: 'When you finished reading this book',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Book Details',
          fields: [
            // Google Books Integration
            {
              name: 'googleBooksSearch',
              type: 'ui',
              admin: {
                components: {
                  Field: path.resolve(dirname, 'admin/components/GoogleBooksSearch'),
                },
                description: 'Search and auto-populate book metadata from Google Books',
              },
            },
            
            // Book Metadata
            {
              name: 'bookMetadata',
              type: 'group',
              label: 'Book Information',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'pageCount',
                      type: 'number',
                      min: 1,
                      admin: {
                        width: '33%',
                        placeholder: 'Number of pages',
                      },
                    },
                    {
                      name: 'publishYear',
                      type: 'number',
                      min: 1000,
                      max: new Date().getFullYear() + 1,
                      admin: {
                        width: '33%',
                        placeholder: 'Publication year',
                      },
                    },
                    {
                      name: 'genre',
                      type: 'text',
                      index: true,
                      admin: {
                        width: '34%',
                        placeholder: 'Primary genre',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'isbn',
                      type: 'text',
                      index: true,
                      admin: {
                        width: '50%',
                        placeholder: 'ISBN (10 or 13 digits)',
                      },
                      validate: (val) => {
                        if (!val) return true;
                        const cleanISBN = val.replace(/[-\s]/g, '');
                        if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
                          return 'ISBN must be 10 or 13 digits';
                        }
                        return true;
                      },
                    },
                    {
                      name: 'googleBooksId',
                      type: 'text',
                      index: true,
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Auto-populated from Google Books',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Publishing',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                  ],
                  defaultValue: 'draft',
                  required: true,
                  index: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'publishedDate',
                  type: 'date',
                  admin: {
                    width: '50%',
                    condition: (data) => data.status === 'published',
                    description: 'Auto-set when status changes to published',
                  },
                },
              ],
            },
            
            // SEO Preview
            {
              name: 'seoPreview',
              type: 'ui',
              admin: {
                components: {
                  Field: path.resolve(dirname, 'admin/components/SEOPreview'),
                },
                description: 'Preview how this review will appear in search results',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Auto-generate slug from title
        if (data.title && (!data.slug || operation === 'create')) {
          data.slug = formatSlug(data.title);
        }
        
        // Auto-generate excerpt from content if not provided
        if (data.content && !data.excerpt) {
          data.excerpt = generateExcerpt(data.content);
        }
        
        return data;
      },
    ],
    beforeChange: [
      ({ data, operation }) => {
        // Set published date when status changes to published
        if (data.status === 'published' && !data.publishedDate) {
          data.publishedDate = new Date().toISOString();
        }
        
        // Validate reading progress dates
        if (data.dateStarted && data.dateFinished) {
          if (new Date(data.dateFinished) < new Date(data.dateStarted)) {
            throw new Error('Finish date must be after start date');
          }
        }
        
        return data;
      },
    ],
    afterChange: [
      ({ doc, operation }) => {
        // Trigger webhook for published reviews
        if (doc.status === 'published' && operation === 'update') {
          // Future: Trigger Instagram post
          console.log(`Review published: ${doc.title}`);
        }
      },
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
```

### Tags Collection

```typescript
// src/collections/Tags.ts
import type { CollectionConfig } from 'payload'
import { formatSlug } from '../utilities/formatSlug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'color', 'status'],
    group: 'Content',
    pagination: {
      defaultLimit: 50,
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: { equals: 'active' }
      };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'Tag name (e.g., Science Fiction)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [formatSlug('name')],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 200,
      admin: {
        placeholder: 'Brief description of this tag...',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'color',
          type: 'text',
          required: true,
          defaultValue: '#3B82F6',
          admin: {
            width: '50%',
            description: 'Hex color code for tag display',
            components: {
              Field: path.resolve(dirname, 'admin/components/ColorPicker'),
            },
          },
          validate: (val) => {
            if (!/^#[0-9A-F]{6}$/i.test(val)) {
              return 'Color must be a valid hex code (e.g., #3B82F6)';
            }
            return true;
          },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
          defaultValue: 'active',
          required: true,
          index: true,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    
    // Usage statistics
    {
      name: 'usageStats',
      type: 'ui',
      admin: {
        components: {
          Field: path.resolve(dirname, 'admin/components/TagUsageStats'),
        },
        description: 'Shows how many reviews use this tag',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-generate slug from name
        if (data.name && !data.slug) {
          data.slug = formatSlug(data.name);
        }
        return data;
      },
    ],
  },
}
```

### Enhanced Media Collection

```typescript
// src/collections/Media.ts
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Media',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 80,
          },
        },
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
      {
        name: 'hero',
        width: 1200,
        height: 630,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 90,
          },
        },
      },
    ],
    crop: true,
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Descriptive alt text for accessibility',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        placeholder: 'Optional caption for display',
      },
    },
    {
      name: 'usage',
      type: 'select',
      options: [
        { label: 'Book Cover', value: 'book-cover' },
        { label: 'Blog Image', value: 'blog-image' },
        { label: 'Profile Image', value: 'profile' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'general',
      admin: {
        description: 'How this image is intended to be used',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Auto-generate alt text for book covers if not provided
        if (!data.alt && data.usage === 'book-cover' && req.body) {
          const filename = req.body.filename || '';
          data.alt = `Book cover for ${filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}`;
        }
        return data;
      },
    ],
  },
}
```

## Admin UI Customizations

### Custom Dashboard

```tsx
// src/admin/components/Dashboard.tsx
import React from 'react'
import { Banner, Button } from 'payload/components/elements'
import { useConfig } from 'payload/components/utilities'

const Dashboard: React.FC = () => {
  const { collections } = useConfig()
  
  return (
    <div>
      <h1>Welcome to Chasing Chapters</h1>
      
      <Banner type="success">
        <p>Your book review platform is ready!</p>
      </Banner>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <h3>Quick Actions</h3>
          <Button
            el="link"
            to="/admin/collections/reviews/create"
            buttonStyle="primary"
          >
            Add New Review
          </Button>
          <Button
            el="link"
            to="/admin/collections/tags/create"
            buttonStyle="secondary"
            style={{ marginLeft: '10px' }}
          >
            Create Tag
          </Button>
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <h3>Recent Activity</h3>
          <p>Your latest reviews and updates will appear here.</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
```

### Google Books Search Component

```tsx
// src/admin/components/GoogleBooksSearch.tsx
import React, { useState } from 'react'
import { Button, useFieldType } from 'payload/components/forms'

interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    publishedDate?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
  }
}

const GoogleBooksSearch: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GoogleBook[]>([])
  const [loading, setLoading] = useState(false)
  
  const { setValue } = useFieldType()
  
  const searchBooks = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setResults(data.items || [])
    } catch (error) {
      console.error('Error searching books:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const selectBook = (book: GoogleBook) => {
    const { volumeInfo } = book
    
    // Auto-populate form fields
    setValue('title', volumeInfo.title)
    setValue('author', volumeInfo.authors?.[0] || '')
    setValue('bookMetadata.googleBooksId', book.id)
    setValue('bookMetadata.pageCount', volumeInfo.pageCount)
    setValue('bookMetadata.genre', volumeInfo.categories?.[0] || '')
    setValue('bookMetadata.publishYear', volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate) : undefined)
    
    // Set ISBN if available
    const isbn = volumeInfo.industryIdentifiers?.find(id => 
      id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )
    if (isbn) {
      setValue('bookMetadata.isbn', isbn.identifier)
    }
    
    // Clear search results
    setResults([])
    setQuery('')
  }
  
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a book..."
          style={{ flex: 1, padding: '8px' }}
          onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
        />
        <Button
          onClick={searchBooks}
          disabled={loading || !query.trim()}
          buttonStyle="primary"
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      {results.length > 0 && (
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
          {results.map((book) => (
            <div
              key={book.id}
              style={{
                display: 'flex',
                padding: '15px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f9f9f9' }
              }}
              onClick={() => selectBook(book)}
            >
              {book.volumeInfo.imageLinks?.thumbnail && (
                <img
                  src={book.volumeInfo.imageLinks.thumbnail}
                  alt={book.volumeInfo.title}
                  style={{ width: '60px', height: '80px', objectFit: 'cover', marginRight: '15px' }}
                />
              )}
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{book.volumeInfo.title}</h4>
                <p style={{ margin: '0 0 5px 0', color: '#666' }}>
                  by {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
                  {book.volumeInfo.publishedDate} • {book.volumeInfo.pageCount} pages
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GoogleBooksSearch
```

### Color Picker Component

```tsx
// src/admin/components/ColorPicker.tsx
import React, { useState } from 'react'
import { useFieldType } from 'payload/components/forms'

const predefinedColors = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#6B7280', '#EC4899', '#14B8A6',
  '#F97316', '#84CC16', '#6366F1', '#EAB308'
]

const ColorPicker: React.FC = () => {
  const { value, setValue } = useFieldType<string>()
  const [customColor, setCustomColor] = useState(value || '#3B82F6')
  
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '15px' }}>
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: color,
              border: value === color ? '3px solid #000' : '1px solid #e5e5e5',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => setValue(color)}
          />
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="color"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value)
            setValue(e.target.value)
          }}
          style={{ width: '50px', height: '40px' }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#3B82F6"
          style={{ flex: 1, padding: '8px' }}
        />
      </div>
    </div>
  )
}

export default ColorPicker
```

## Utility Functions

### Slug Generation

```typescript
// src/utilities/formatSlug.ts
export const formatSlug = (fallback: string) => 
  ({ value, data }: { value: string; data: any }) => {
    if (typeof value === 'string') {
      return value
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '')
        .toLowerCase()
    }
    
    const fallbackData = data[fallback]
    
    if (fallbackData && typeof fallbackData === 'string') {
      return fallbackData
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '')
        .toLowerCase()
    }
    
    return value
  }
```

### Excerpt Generation

```typescript
// src/utilities/generateExcerpt.ts
export const generateExcerpt = (richTextContent: any, maxLength = 250): string => {
  if (!richTextContent || !richTextContent.root) {
    return ''
  }
  
  // Extract plain text from Lexical rich text
  const extractText = (node: any): string => {
    if (node.type === 'text') {
      return node.text || ''
    }
    
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    
    return ''
  }
  
  const plainText = extractText(richTextContent.root)
  
  if (plainText.length <= maxLength) {
    return plainText
  }
  
  // Find the last complete word within the limit
  const truncated = plainText.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}
```

## Environment Variables

```bash
# .env.local
# Payload CMS
PAYLOAD_SECRET=your-super-secret-jwt-secret-here
DATABASE_URI=postgres://user:password@localhost:5432/chasing_chapters

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET=chasing-chapters
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com

# Google Books API
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Admin credentials (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

This comprehensive Payload CMS configuration provides a robust foundation for the Chasing Chapters book review platform with enhanced admin experience and automated workflows.