import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

let payload: Payload

describe('Functional Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  describe('Collections Existence and Structure', () => {
    it('should have all required collections registered', () => {
      const collectionSlugs = Object.keys(payload.collections)
      
      expect(collectionSlugs).toContain('users')
      expect(collectionSlugs).toContain('reviews')
      expect(collectionSlugs).toContain('tags')
      expect(collectionSlugs).toContain('media')
    })

    it('should have reviews collection with all base fields', () => {
      const reviewsCollection = payload.collections.reviews
      const fields = reviewsCollection.config.fields
        .filter(f => f.name) // Only named fields
        .map(f => f.name)
      
      expect(fields).toContain('title')
      expect(fields).toContain('slug')
      expect(fields).toContain('author')
      expect(fields).toContain('excerpt')
      expect(fields).toContain('content')
      expect(fields).toContain('rating')
      expect(fields).toContain('publishedDate')
      expect(fields).toContain('status')
    })

    it('should have tags collection with required fields', () => {
      const tagsCollection = payload.collections.tags
      const fields = tagsCollection.config.fields
        .filter(f => f.name)
        .map(f => f.name)
      
      expect(fields).toContain('name')
      expect(fields).toContain('slug')
      expect(fields).toContain('description')
      expect(fields).toContain('color')
    })

    it('should have users collection with enhanced fields', () => {
      const usersCollection = payload.collections.users
      const fields = usersCollection.config.fields
        .filter(f => f.name)
        .map(f => f.name)
      
      expect(fields).toContain('firstName')
      expect(fields).toContain('lastName')
      expect(fields).toContain('displayName')
      expect(fields).toContain('role')
      expect(fields).toContain('avatar')
      expect(fields).toContain('email') // Auth field
    })

    it('should have authentication enabled for users', () => {
      const usersCollection = payload.collections.users
      expect(usersCollection.config.auth).toBeTruthy()
      expect(typeof usersCollection.config.auth).toBe('object')
    })

    it('should have media collection with upload configuration', () => {
      const mediaCollection = payload.collections.media
      expect(mediaCollection.config.upload).toBeTruthy()
      expect(mediaCollection.config.upload.imageSizes).toBeDefined()
      expect(mediaCollection.config.upload.imageSizes.length).toBeGreaterThan(0)
    })
  })

  describe('Field Validation Configuration', () => {
    it('should have rating field with proper constraints', () => {
      const reviewsCollection = payload.collections.reviews
      const ratingField = reviewsCollection.config.fields.find(f => 
        f.name === 'rating' && f.type === 'number'
      )
      
      expect(ratingField).toBeDefined()
      expect(ratingField.required).toBe(true)
      expect(ratingField.min).toBe(1)
      expect(ratingField.max).toBe(5)
    })

    it('should have status field with proper options', () => {
      const reviewsCollection = payload.collections.reviews
      const statusField = reviewsCollection.config.fields.find(f => 
        f.name === 'status' && f.type === 'select'
      )
      
      expect(statusField).toBeDefined()
      expect(statusField.options).toBeDefined()
      
      const optionValues = statusField.options.map(opt => opt.value)
      expect(optionValues).toContain('draft')
      expect(optionValues).toContain('published')
    })

    it('should have role field with admin and author options', () => {
      const usersCollection = payload.collections.users
      const roleField = usersCollection.config.fields.find(f => 
        f.name === 'role' && f.type === 'select'
      )
      
      expect(roleField).toBeDefined()
      expect(roleField.options).toBeDefined()
      
      const optionValues = roleField.options.map(opt => opt.value)
      expect(optionValues).toContain('admin')
      expect(optionValues).toContain('author')
    })

    it('should have unique constraint on tag names', () => {
      const tagsCollection = payload.collections.tags
      const nameField = tagsCollection.config.fields.find(f => 
        f.name === 'name' && f.type === 'text'
      )
      
      expect(nameField).toBeDefined()
      expect(nameField.unique).toBe(true)
      expect(nameField.required).toBe(true)
    })
  })

  describe('Access Control Configuration', () => {
    it('should have access control functions defined', () => {
      const reviewsCollection = payload.collections.reviews
      const tagsCollection = payload.collections.tags
      const usersCollection = payload.collections.users
      const mediaCollection = payload.collections.media
      
      expect(reviewsCollection.config.access).toBeDefined()
      expect(tagsCollection.config.access).toBeDefined()
      expect(usersCollection.config.access).toBeDefined()
      expect(mediaCollection.config.access).toBeDefined()
    })

    it('should have CRUD access control for all collections', () => {
      const collections = [
        payload.collections.reviews,
        payload.collections.tags,
        payload.collections.users,
        payload.collections.media
      ]
      
      collections.forEach(collection => {
        expect(collection.config.access.create).toBeDefined()
        expect(collection.config.access.read).toBeDefined()
        expect(collection.config.access.update).toBeDefined()
        expect(collection.config.access.delete).toBeDefined()
      })
    })
  })

  describe('Admin Configuration', () => {
    it('should have proper collection grouping', () => {
      expect(payload.collections.reviews.config.admin?.group).toBe('Content')
      expect(payload.collections.tags.config.admin?.group).toBe('Content')
      expect(payload.collections.media.config.admin?.group).toBe('Content')
      expect(payload.collections.users.config.admin?.group).toBe('Administration')
    })

    it('should have searchable fields configured', () => {
      const reviewsCollection = payload.collections.reviews
      expect(reviewsCollection.config.admin?.listSearchableFields).toBeDefined()
      expect(reviewsCollection.config.admin.listSearchableFields).toContain('title')
      expect(reviewsCollection.config.admin.listSearchableFields).toContain('author')
    })
  })

  describe('Database API Operations', () => {
    it('should be able to query collections', async () => {
      // Test that the collections can be queried (even if empty)
      const reviewsResult = await payload.find({
        collection: 'reviews',
        limit: 1
      })
      
      const tagsResult = await payload.find({
        collection: 'tags',
        limit: 1
      })
      
      const usersResult = await payload.find({
        collection: 'users',
        limit: 1
      })
      
      const mediaResult = await payload.find({
        collection: 'media',
        limit: 1
      })
      
      expect(reviewsResult).toBeDefined()
      expect(reviewsResult.docs).toBeDefined()
      expect(tagsResult).toBeDefined()
      expect(tagsResult.docs).toBeDefined()
      expect(usersResult).toBeDefined()
      expect(usersResult.docs).toBeDefined()
      expect(mediaResult).toBeDefined()
      expect(mediaResult.docs).toBeDefined()
    })

    it('should have proper collection ordering', async () => {
      const collectionOrder = Object.keys(payload.collections)
      const expectedOrder = ['reviews', 'tags', 'media', 'users']
      
      expectedOrder.forEach((collection, index) => {
        expect(collectionOrder[index]).toBe(collection)
      })
    })
  })

  describe('Hook Configuration', () => {
    it('should have beforeChange hooks configured', () => {
      const reviewsCollection = payload.collections.reviews
      const tagsCollection = payload.collections.tags
      const usersCollection = payload.collections.users
      
      expect(reviewsCollection.config.hooks?.beforeChange).toBeDefined()
      expect(tagsCollection.config.hooks?.beforeChange).toBeDefined()
      expect(usersCollection.config.hooks?.beforeChange).toBeDefined()
    })
  })

  describe('TypeScript Integration', () => {
    it('should generate payload types file', async () => {
      // Check if payload-types.ts exists and has content
      try {
        const types = await import('@/payload-types')
        expect(types).toBeDefined()
        expect(typeof types).toBe('object')
      } catch (error) {
        // If import fails, the types file may not be properly generated
        expect(error).toBeNull()
      }
    })

    it('should have proper TypeScript configuration', () => {
      const config = payload.config
      expect(config.typescript).toBeDefined()
      expect(config.typescript.outputFile).toBeDefined()
    })
  })

  describe('Storage and Editor Configuration', () => {
    it('should have rich text editor configured', () => {
      const config = payload.config
      expect(config.editor).toBeDefined()
    })

    it('should have database adapter configured', () => {
      const config = payload.config
      expect(config.db).toBeDefined()
    })

    it('should have plugins configured', () => {
      const config = payload.config
      expect(config.plugins).toBeDefined()
      expect(Array.isArray(config.plugins)).toBe(true)
      expect(config.plugins.length).toBeGreaterThan(0)
    })
  })
})