import type { CollectionConfig } from 'payload'
import { BookSearchField } from '../components/BookSearch'
import { BookMetadataFields } from '../components/BookMetadata'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'rating', 'status', 'publishedDate'],
    preview: (doc) => {
      return `${process.env.NEXT_PUBLIC_SERVER_URL}/${doc.slug}`
    },
    description: 'Manage book reviews and content',
    group: 'Content',
    listSearchableFields: ['title', 'author', 'excerpt'],
  },
  access: {
    // Admins and authors can create reviews
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'author'
    },
    // Public can read published reviews, authenticated users can read all their own reviews
    read: ({ req: { user }, data }) => {
      // Published reviews are public
      if (data?.status === 'published') return true
      // Authenticated users can read their own reviews
      if (user && data?.createdBy === user.id) return true
      // Admins can read all reviews
      if (user?.role === 'admin') return true
      // Deny access to unpublished reviews by default
      return false
    },
    // Admins can update all reviews, authors can update their own reviews
    update: ({ req: { user }, data }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'author' && data?.createdBy === user.id) return true
      return false
    },
    // Only admins can delete reviews
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    // Book Search Section
    {
      type: 'collapsible',
      label: 'Book Selection',
      admin: {
        initCollapsed: false,
        description: 'Search for a book or enter book details manually',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            components: {
              Field: BookSearchField as any,
            },
            description: 'Search for a book using Google Books API or enter manually',
          },
        },
        {
          name: 'bookMetadataHelper',
          type: 'ui',
          admin: {
            components: {
              Field: BookMetadataFields as any,
            },
          },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly version of the title',
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.title && !data?.slug) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return data?.slug
          },
        ],
      },
    },
    {
      name: 'author',
      type: 'text',
      required: true,
      admin: {
        description: 'Book author name',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: {
        description: 'Short review summary (max 300 characters)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Full review content',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: {
        description: 'Rating from 1 to 5 stars',
        step: 0.5,
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      admin: {
        position: 'sidebar',
        description: 'Publication date of the review',
        date: {
          displayFormat: 'MMM dd, yyyy',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'Publication status',
      },
    },
    // Reading Progress Section
    {
      type: 'collapsible',
      label: 'Reading Progress',
      fields: [
        {
          name: 'readingStatus',
          type: 'select',
          required: true,
          defaultValue: 'finished',
          options: [
            {
              label: 'Want to Read',
              value: 'want-to-read',
            },
            {
              label: 'Currently Reading',
              value: 'currently-reading',
            },
            {
              label: 'Finished',
              value: 'finished',
            },
          ],
          admin: {
            description: 'Current reading status',
          },
        },
        {
          name: 'dateStarted',
          type: 'date',
          admin: {
            description: 'Date when you started reading',
            date: {
              displayFormat: 'MMM dd, yyyy',
            },
            condition: (data) => data?.readingStatus !== 'want-to-read',
          },
        },
        {
          name: 'dateFinished',
          type: 'date',
          admin: {
            description: 'Date when you finished reading',
            date: {
              displayFormat: 'MMM dd, yyyy',
            },
            condition: (data) => data?.readingStatus === 'finished',
          },
        },
      ],
    },
    // Book Metadata Section
    {
      type: 'collapsible',
      label: 'Book Metadata',
      fields: [
        {
          name: 'pageCount',
          type: 'number',
          min: 1,
          admin: {
            description: 'Number of pages in the book',
          },
        },
        {
          name: 'genre',
          type: 'text',
          admin: {
            description: 'Book genre or category',
          },
        },
        {
          name: 'publishYear',
          type: 'number',
          min: 1000,
          max: new Date().getFullYear() + 1,
          admin: {
            description: 'Year the book was published',
          },
        },
        {
          name: 'isbn',
          type: 'text',
          admin: {
            description: 'ISBN number (for future API integration)',
          },
        },
        {
          name: 'googleBooksId',
          type: 'text',
          admin: {
            description: 'Google Books API ID (for future integration)',
            position: 'sidebar',
          },
        },
      ],
    },
    // Relationships Section
    {
      type: 'collapsible',
      label: 'Media & Tags',
      fields: [
        {
          name: 'coverImage',
          type: 'relationship',
          relationTo: 'media',
          admin: {
            description: 'Book cover image',
          },
        },
        {
          name: 'tags',
          type: 'relationship',
          relationTo: 'tags',
          hasMany: true,
          admin: {
            description: 'Review tags for categorization',
          },
        },
        {
          name: 'createdBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Review author',
            position: 'sidebar',
            readOnly: true,
          },
          hooks: {
            beforeChange: [
              ({ req, operation, value }) => {
                // Auto-assign current user on create
                if (operation === 'create' && req.user && !value) {
                  return req.user.id
                }
                return value
              },
            ],
          },
        },
      ],
    },
  ],
  timestamps: true,
}