# 🗄️ Database Schema

## Overview

This document defines the complete database schema for Chasing Chapters, including Payload CMS collections and PostgreSQL table structures.

## Database Configuration

- **Database**: PostgreSQL 14+
- **Adapter**: `@payloadcms/db-postgres`
- **Connection**: Via `DATABASE_URI` environment variable
- **Migrations**: Automatic via Payload CMS

## Core Collections

### Users Collection

**Purpose**: Admin authentication and user management

```typescript
// src/collections/Users.ts
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: 'editor',
      required: true,
    },
  ],
}
```

**Database Table**: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(30) | PRIMARY KEY | Auto-generated ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| name | VARCHAR(255) | NOT NULL | Display name |
| role | VARCHAR(50) | NOT NULL | User role |
| salt | VARCHAR(255) | | Password salt |
| hash | VARCHAR(255) | | Password hash |
| loginAttempts | INTEGER | DEFAULT 0 | Failed login count |
| lockUntil | TIMESTAMP | | Account lock expiry |
| resetPasswordToken | VARCHAR(255) | | Password reset token |
| resetPasswordExpiration | TIMESTAMP | | Token expiry |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

### Reviews Collection

**Purpose**: Book reviews with metadata and content

```typescript
// src/collections/Reviews.ts
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'rating', 'status', 'publishedDate'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: { equals: 'published' }
      };
    },
  },
  fields: [
    // Basic Information
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      unique: true,
      admin: {
        position: 'sidebar',
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
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
    },
    
    // Review Content
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      min: 0,
      max: 5,
      step: 0.5,
      required: true,
    },
    
    // Relationships
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      index: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    
    // Reading Progress
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
    },
    {
      name: 'dateStarted',
      type: 'date',
      admin: {
        condition: (data) => ['currently-reading', 'finished'].includes(data.readingStatus),
      },
    },
    {
      name: 'dateFinished',
      type: 'date',
      admin: {
        condition: (data) => data.readingStatus === 'finished',
      },
    },
    
    // Publishing
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
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        condition: (data) => data.status === 'published',
      },
    },
    
    // Book Metadata (from Google Books API)
    {
      name: 'bookMetadata',
      type: 'group',
      fields: [
        {
          name: 'pageCount',
          type: 'number',
          min: 1,
        },
        {
          name: 'genre',
          type: 'text',
          index: true,
        },
        {
          name: 'publishYear',
          type: 'number',
          min: 1000,
          max: new Date().getFullYear() + 1,
        },
        {
          name: 'isbn',
          type: 'text',
          index: true,
        },
        {
          name: 'googleBooksId',
          type: 'text',
          unique: true,
          index: true,
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' || operation === 'update') {
          if (data.status === 'published' && !data.publishedDate) {
            data.publishedDate = new Date().toISOString();
          }
        }
        return data;
      },
    ],
  },
}
```

**Database Table**: `reviews`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(30) | PRIMARY KEY | Auto-generated ID |
| title | VARCHAR(255) | UNIQUE, NOT NULL | Book title |
| slug | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | URL slug |
| author | VARCHAR(255) | NOT NULL, INDEX | Book author |
| excerpt | TEXT | NOT NULL | Review excerpt |
| content | JSONB | NOT NULL | Rich text content |
| rating | DECIMAL(2,1) | NOT NULL | Rating (0-5) |
| readingStatus | VARCHAR(50) | NOT NULL, INDEX | Reading status |
| dateStarted | DATE | | Reading start date |
| dateFinished | DATE | | Reading finish date |
| status | VARCHAR(20) | NOT NULL, INDEX | Publish status |
| publishedDate | TIMESTAMP | INDEX | Publish timestamp |
| pageCount | INTEGER | | Number of pages |
| genre | VARCHAR(100) | INDEX | Book genre |
| publishYear | INTEGER | | Publication year |
| isbn | VARCHAR(20) | INDEX | ISBN number |
| googleBooksId | VARCHAR(50) | UNIQUE, INDEX | Google Books ID |
| coverImage | VARCHAR(30) | FK → media.id | Cover image reference |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

### Tags Collection

**Purpose**: Categorization and filtering system

```typescript
// src/collections/Tags.ts
export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'color', 'status'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: { equals: 'active' }
      };
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('name')],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 200,
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      defaultValue: '#3B82F6',
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
    },
  ],
}
```

**Database Table**: `tags`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(30) | PRIMARY KEY | Auto-generated ID |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Tag name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL, INDEX | URL slug |
| description | TEXT | | Tag description |
| color | CHAR(7) | NOT NULL | Hex color code |
| status | VARCHAR(20) | NOT NULL, INDEX | Active status |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

### Media Collection

**Purpose**: File uploads and image management

```typescript
// src/collections/Media.ts (Enhanced)
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
```

**Database Table**: `media`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(30) | PRIMARY KEY | Auto-generated ID |
| alt | VARCHAR(255) | NOT NULL | Alt text |
| caption | TEXT | | Image caption |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| mimeType | VARCHAR(100) | NOT NULL | MIME type |
| filesize | INTEGER | NOT NULL | File size in bytes |
| width | INTEGER | | Image width |
| height | INTEGER | | Image height |
| focalX | DECIMAL(3,2) | | Focal point X |
| focalY | DECIMAL(3,2) | | Focal point Y |
| sizes | JSONB | | Generated sizes |
| url | VARCHAR(500) | | File URL |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

## Relationship Tables

### Reviews-Tags Relationship

**Table**: `reviews_rels`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Relationship ID |
| order | INTEGER | | Relationship order |
| parent_id | VARCHAR(30) | FK → reviews.id | Review reference |
| path | VARCHAR(50) | | Relationship path |
| tags_id | VARCHAR(30) | FK → tags.id | Tag reference |

## Indexes

### Performance Indexes

```sql
-- Reviews table indexes
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_published_date ON reviews(publishedDate);
CREATE INDEX idx_reviews_reading_status ON reviews(readingStatus);
CREATE INDEX idx_reviews_author ON reviews(author);
CREATE INDEX idx_reviews_genre ON reviews(genre);
CREATE INDEX idx_reviews_isbn ON reviews(isbn);
CREATE INDEX idx_reviews_google_books_id ON reviews(googleBooksId);
CREATE INDEX idx_reviews_slug ON reviews(slug);

-- Tags table indexes
CREATE INDEX idx_tags_status ON tags(status);
CREATE INDEX idx_tags_slug ON tags(slug);

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Relationship table indexes
CREATE INDEX idx_reviews_rels_parent ON reviews_rels(parent_id);
CREATE INDEX idx_reviews_rels_tags ON reviews_rels(tags_id);
CREATE INDEX idx_reviews_rels_path ON reviews_rels(path);
```

### Full-Text Search Indexes

```sql
-- Full-text search on reviews
CREATE INDEX idx_reviews_search ON reviews USING GIN(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(author, '') || ' ' || 
    COALESCE(excerpt, '') || ' ' ||
    COALESCE(genre, '')
  )
);

-- Full-text search on tags
CREATE INDEX idx_tags_search ON tags USING GIN(
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '')
  )
);
```

## Data Validation Rules

### Reviews Validation

```typescript
// Custom validation hooks
const validateReview = {
  beforeValidate: [
    ({ data, operation }) => {
      // Ensure dateFinished is after dateStarted
      if (data.dateStarted && data.dateFinished) {
        if (new Date(data.dateFinished) < new Date(data.dateStarted)) {
          throw new Error('Finish date must be after start date');
        }
      }
      
      // Validate reading status consistency
      if (data.readingStatus === 'finished' && !data.dateFinished) {
        throw new Error('Finished books must have a finish date');
      }
      
      // Validate rating
      if (data.rating < 0 || data.rating > 5) {
        throw new Error('Rating must be between 0 and 5');
      }
      
      return data;
    },
  ],
}
```

### ISBN Validation

```typescript
const validateISBN = (isbn: string): boolean => {
  // Remove hyphens and spaces
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  if (cleanISBN.length === 10) {
    // ISBN-10 validation
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanISBN[i]) * (10 - i);
    }
    const checkDigit = cleanISBN[9] === 'X' ? 10 : parseInt(cleanISBN[9]);
    return (sum + checkDigit) % 11 === 0;
  } else if (cleanISBN.length === 13) {
    // ISBN-13 validation
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanISBN[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleanISBN[12]);
  }
  
  return false;
};
```

## Migration Strategy

### Initial Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE reading_status AS ENUM ('want-to-read', 'currently-reading', 'finished');
CREATE TYPE publish_status AS ENUM ('draft', 'published');
CREATE TYPE tag_status AS ENUM ('active', 'inactive');
CREATE TYPE user_role AS ENUM ('admin', 'editor');
```

### Payload Migrations

Payload CMS handles automatic migrations, but manual migrations may be needed for:

1. **Complex data transformations**
2. **Performance optimizations**
3. **Custom indexes**
4. **Data seeding**

```typescript
// migrations/001_initial_seed.ts
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Create default admin user
  await payload.create({
    collection: 'users',
    data: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'changeme',
      name: 'Admin User',
      role: 'admin',
    },
  });

  // Create default tags
  const defaultTags = [
    { name: 'Fiction', color: '#3B82F6' },
    { name: 'Non-Fiction', color: '#10B981' },
    { name: 'Science Fiction', color: '#8B5CF6' },
    { name: 'Fantasy', color: '#F59E0B' },
    { name: 'Biography', color: '#EF4444' },
    { name: 'History', color: '#6B7280' },
  ];

  for (const tag of defaultTags) {
    await payload.create({
      collection: 'tags',
      data: {
        ...tag,
        status: 'active',
      },
    });
  }
}
```

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup-database.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="chasing_chapters_backup_$DATE.sql"

pg_dump $DATABASE_URI > /backups/$BACKUP_FILE
gzip /backups/$BACKUP_FILE

# Keep only last 30 days
find /backups -name "*.gz" -mtime +30 -delete
```

### Restore Procedure

```bash
# Restore from backup
gunzip chasing_chapters_backup_20240126_120000.sql.gz
psql $DATABASE_URI < chasing_chapters_backup_20240126_120000.sql
```

## Performance Considerations

### Query Optimization

```sql
-- Efficient review listing with tags
SELECT 
  r.id, r.title, r.author, r.excerpt, r.rating, r.publishedDate,
  array_agg(t.name) as tag_names,
  array_agg(t.color) as tag_colors
FROM reviews r
LEFT JOIN reviews_rels rr ON r.id = rr.parent_id AND rr.path = 'tags'
LEFT JOIN tags t ON rr.tags_id = t.id AND t.status = 'active'
WHERE r.status = 'published'
GROUP BY r.id, r.title, r.author, r.excerpt, r.rating, r.publishedDate
ORDER BY r.publishedDate DESC
LIMIT 20;
```

### Connection Pooling

```typescript
// payload.config.ts
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI,
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
})
```

This schema provides a robust foundation for the Chasing Chapters platform with proper relationships, indexing, and validation rules.