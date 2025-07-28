import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'color'],
    description: 'Organize content with tags and categories',
    group: 'Content',
    listSearchableFields: ['name', 'description'],
  },
  access: {
    // Only admins can create tags
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Public read access for all tags
    read: () => true,
    // Only admins can update tags
    update: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Only admins can delete tags
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Tag name (must be unique)',
      },
      minLength: 2,
      maxLength: 50,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the tag name',
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.name && !data?.slug) {
              return data.name
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
      name: 'description',
      type: 'textarea',
      maxLength: 200,
      admin: {
        description: 'Optional description of the tag (max 200 characters)',
      },
    },
    {
      name: 'color',
      type: 'text',
      defaultValue: '#3B82F6',
      admin: {
        description: 'Hex color for UI theming',
        components: {
          Field: '@/components/ColorPicker', // TODO: Create color picker component
        },
      },
    },
  ],
  timestamps: true,
}