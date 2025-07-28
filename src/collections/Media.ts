import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'usageContext'],
    description: 'Upload and manage media files',
    group: 'Content',
    listSearchableFields: ['filename', 'alt', 'caption'],
  },
  access: {
    // Admins and authors can upload media
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'author'
    },
    // Public read access for all media
    read: () => true,
    // Admins can update all media, authors can update their own uploads
    update: ({ req: { user }, data }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'author' && data?.uploadedBy === user.id) return true
      return false
    },
    // Only admins can delete media
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      minLength: 10,
      admin: {
        description: 'Alternative text for accessibility (minimum 10 characters)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional image caption',
      },
    },
    {
      name: 'usageContext',
      type: 'select',
      options: [
        {
          label: 'Book Cover',
          value: 'book-cover',
        },
        {
          label: 'Profile Avatar',
          value: 'avatar',
        },
        {
          label: 'Content Image',
          value: 'content',
        },
        {
          label: 'General',
          value: 'general',
        },
      ],
      admin: {
        description: 'Context where this image is used',
        position: 'sidebar',
      },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who uploaded this file',
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
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 150,
        position: 'centre',
      },
      {
        name: 'small',
        width: 300,
        height: 400,
        position: 'centre',
      },
      {
        name: 'medium',
        width: 600,
        height: 800,
        position: 'centre',
      },
      {
        name: 'large',
        width: 900,
        height: 1200,
        position: 'centre',
      },
      {
        name: 'cover',
        width: 400,
        height: 600,
        position: 'centre',
        crop: 'cover',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
}
