import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'email', 'role'],
    description: 'Manage user accounts and permissions',
    group: 'Administration',
  },
  auth: true,
  access: {
    // Only admins can create new users
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Only admins can view user list
    read: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Admins can update all users, authors can update their own profile
    update: ({ req: { user }, id }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'author' && user?.id === id) return true
      return false
    },
    // Only admins can delete users
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    // Email added by default
    {
      name: 'firstName',
      type: 'text',
      admin: {
        description: 'First name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      admin: {
        description: 'Last name',
      },
    },
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description: 'Display name (auto-generated from first/last name or email)',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            // Generate display name from firstName + lastName or fallback to email
            if (data?.firstName || data?.lastName) {
              return `${data?.firstName || ''} ${data?.lastName || ''}`.trim()
            }
            return data?.email?.split('@')[0] || 'User'
          },
        ],
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'author',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Author',
          value: 'author',
        },
      ],
      admin: {
        description: 'User role and permissions level',
      },
    },
    {
      name: 'avatar',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: 'Profile avatar image',
      },
    },
  ],
}
