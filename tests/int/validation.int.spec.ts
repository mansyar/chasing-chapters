import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

let payload: Payload

// Helper function to recursively find fields in nested structures
function findFieldRecursively(fields: any[], name: string): any {
  for (const field of fields) {
    if (field.name === name) {
      return field
    }
    if (field.type === 'collapsible' && field.fields) {
      const found = findFieldRecursively(field.fields, name)
      if (found) return found
    }
    if (field.fields) {
      const found = findFieldRecursively(field.fields, name)
      if (found) return found
    }
  }
  return null
}

// Helper function to get all field names recursively
function getAllFieldNames(fields: any[]): string[] {
  const names: string[] = []
  for (const field of fields) {
    if (field.name) {
      names.push(field.name)
    }
    if (field.type === 'collapsible' && field.fields) {
      names.push(...getAllFieldNames(field.fields))
    }
    if (field.fields) {
      names.push(...getAllFieldNames(field.fields))
    }
  }
  return names
}

describe('Collections Validation & Structure Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  describe('Collections Registration', () => {
    it('should have all required collections registered', () => {
      const collectionSlugs = Object.keys(payload.collections)
      
      expect(collectionSlugs).toContain('users')
      expect(collectionSlugs).toContain('reviews')
      expect(collectionSlugs).toContain('tags')
      expect(collectionSlugs).toContain('media')
    })

    it('should have reviews collection properly configured', () => {
      const reviewsCollection = payload.collections.reviews
      expect(reviewsCollection).toBeDefined()
      
      const fields = getAllFieldNames(reviewsCollection.config.fields)
      expect(fields).toContain('title')
      expect(fields).toContain('author')
      expect(fields).toContain('excerpt')
      expect(fields).toContain('content')
      expect(fields).toContain('rating')
      expect(fields).toContain('readingStatus')
      expect(fields).toContain('tags')
      expect(fields).toContain('createdBy')
    })

    it('should have tags collection properly configured', () => {
      const tagsCollection = payload.collections.tags
      expect(tagsCollection).toBeDefined()
      
      const fields = tagsCollection.config.fields.map(f => f.name || f.type)
      expect(fields).toContain('name')
      expect(fields).toContain('slug')
      expect(fields).toContain('color')
    })

    it('should have users collection with enhanced fields', () => {
      const usersCollection = payload.collections.users
      expect(usersCollection).toBeDefined()
      expect(usersCollection.config.auth).toBeTruthy()
      
      const fields = usersCollection.config.fields.map(f => f.name || f.type)
      expect(fields).toContain('firstName')
      expect(fields).toContain('lastName')
      expect(fields).toContain('role')
    })

    it('should have media collection with upload configuration', () => {
      const mediaCollection = payload.collections.media
      expect(mediaCollection).toBeDefined()
      expect(mediaCollection.config.upload).toBeTruthy()
      
      const imageSizes = mediaCollection.config.upload.imageSizes
      expect(imageSizes).toBeDefined()
      expect(imageSizes.length).toBeGreaterThan(0)
      
      // Check for specific image sizes
      const sizeNames = imageSizes.map(size => size.name)
      expect(sizeNames).toContain('thumbnail')
      expect(sizeNames).toContain('cover')
    })
  })

  describe('Field Validation Rules', () => {
    it('should have proper validation for reviews rating field', () => {
      const reviewsCollection = payload.collections.reviews
      const ratingField = reviewsCollection.config.fields.find(f => f.name === 'rating')
      
      expect(ratingField).toBeDefined()
      expect(ratingField.type).toBe('number')
      expect(ratingField.min).toBe(1)
      expect(ratingField.max).toBe(5)
      expect(ratingField.required).toBe(true)
    })

    it('should have proper validation for tags name field', () => {
      const tagsCollection = payload.collections.tags
      const nameField = tagsCollection.config.fields.find(f => f.name === 'name')
      
      expect(nameField).toBeDefined()
      expect(nameField.type).toBe('text')
      expect(nameField.required).toBe(true)
      expect(nameField.unique).toBe(true)
    })

    it('should have reading status field with proper options', () => {
      const reviewsCollection = payload.collections.reviews
      const statusField = findFieldRecursively(reviewsCollection.config.fields, 'readingStatus')
      
      expect(statusField).toBeDefined()
      expect(statusField.type).toBe('select')
      expect(statusField.options).toBeDefined()
      
      const optionValues = statusField.options.map(opt => opt.value)
      expect(optionValues).toContain('want-to-read')
      expect(optionValues).toContain('currently-reading')
      expect(optionValues).toContain('finished')
    })

    it('should have user role field with admin and author options', () => {
      const usersCollection = payload.collections.users
      const roleField = usersCollection.config.fields.find(f => f.name === 'role')
      
      expect(roleField).toBeDefined()
      expect(roleField.type).toBe('select')
      
      const optionValues = roleField.options.map(opt => opt.value)
      expect(optionValues).toContain('admin')
      expect(optionValues).toContain('author')
    })
  })

  describe('Relationship Configuration', () => {
    it('should have proper reviews-tags relationship', () => {
      const reviewsCollection = payload.collections.reviews
      const tagsField = findFieldRecursively(reviewsCollection.config.fields, 'tags')
      
      expect(tagsField).toBeDefined()
      expect(tagsField.type).toBe('relationship')
      expect(tagsField.relationTo).toBe('tags')
      expect(tagsField.hasMany).toBe(true)
    })

    it('should have proper reviews-users relationship', () => {
      const reviewsCollection = payload.collections.reviews
      const createdByField = findFieldRecursively(reviewsCollection.config.fields, 'createdBy')
      
      expect(createdByField).toBeDefined()
      expect(createdByField.type).toBe('relationship')
      expect(createdByField.relationTo).toBe('users')
      expect(createdByField.hasMany).toBeFalsy()
    })

    it('should have proper reviews-media relationship for cover image', () => {
      const reviewsCollection = payload.collections.reviews
      const coverImageField = findFieldRecursively(reviewsCollection.config.fields, 'coverImage')
      
      expect(coverImageField).toBeDefined()
      expect(coverImageField.type).toBe('relationship')
      expect(coverImageField.relationTo).toBe('media')
      expect(coverImageField.hasMany).toBeFalsy()
    })
  })

  describe('Access Control Configuration', () => {
    it('should have access control configured for reviews', () => {
      const reviewsCollection = payload.collections.reviews
      expect(reviewsCollection.config.access).toBeDefined()
      expect(reviewsCollection.config.access.create).toBeDefined()
      expect(reviewsCollection.config.access.read).toBeDefined()
      expect(reviewsCollection.config.access.update).toBeDefined()
      expect(reviewsCollection.config.access.delete).toBeDefined()
    })

    it('should have access control configured for tags', () => {
      const tagsCollection = payload.collections.tags
      expect(tagsCollection.config.access).toBeDefined()
      expect(tagsCollection.config.access.create).toBeDefined()
      expect(tagsCollection.config.access.read).toBeDefined()
    })

    it('should have access control configured for users', () => {
      const usersCollection = payload.collections.users
      expect(usersCollection.config.access).toBeDefined()
      expect(usersCollection.config.access.create).toBeDefined()
      expect(usersCollection.config.access.read).toBeDefined()
    })
  })

  describe('Admin Configuration', () => {
    it('should have proper admin grouping configured', () => {
      const reviewsCollection = payload.collections.reviews
      const tagsCollection = payload.collections.tags
      const mediaCollection = payload.collections.media
      const usersCollection = payload.collections.users
      
      expect(reviewsCollection.config.admin?.group).toBe('Content')
      expect(tagsCollection.config.admin?.group).toBe('Content')
      expect(mediaCollection.config.admin?.group).toBe('Content')
      expect(usersCollection.config.admin?.group).toBe('Administration')
    })

    it('should have search fields configured for admin', () => {
      const reviewsCollection = payload.collections.reviews
      expect(reviewsCollection.config.admin?.listSearchableFields).toBeDefined()
      expect(reviewsCollection.config.admin.listSearchableFields).toContain('title')
      expect(reviewsCollection.config.admin.listSearchableFields).toContain('author')
    })
  })

  describe('Hook Configuration', () => {
    it('should have beforeChange hooks for auto-generation', () => {
      const reviewsCollection = payload.collections.reviews
      const tagsCollection = payload.collections.tags
      const usersCollection = payload.collections.users
      
      expect(reviewsCollection.config.hooks?.beforeChange).toBeDefined()
      expect(tagsCollection.config.hooks?.beforeChange).toBeDefined()
      expect(usersCollection.config.hooks?.beforeChange).toBeDefined()
    })
  })

  describe('TypeScript Types Integration', () => {
    it('should have proper payload types available', async () => {
      // This tests that the types are properly generated and accessible
      const types = await import('@/payload-types')
      
      // Check that the module contains the expected type definitions
      expect(types).toBeDefined()
      expect(typeof types).toBe('object')
      
      // Since these are TypeScript interfaces, we can't check them at runtime
      // Instead, we check that the types file imports without error
      expect(true).toBe(true) // Types imported successfully
    })
  })
})