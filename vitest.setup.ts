// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'
import { vi } from 'vitest'

// Set up test environment variables
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test'
}
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret-key'
process.env.DATABASE_URI = process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:7482/chasing-chapters'
process.env.GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || 'test-api-key'

// Set up global fetch mock
Object.defineProperty(globalThis, 'fetch', {
  value: vi.fn(),
  writable: true,
})

// Mock window object for client-side code
Object.defineProperty(globalThis, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
  writable: true,
})

// Mock CSS imports
vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))
vi.mock('*.sass', () => ({}))

// Specifically mock react-image-crop CSS
vi.mock('react-image-crop/dist/ReactCrop.css', () => ({}))

// Import jest-dom matchers with vitest-specific import
import '@testing-library/jest-dom/vitest'

// Set up automatic cleanup after each test
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Silence React 18 warnings in tests
const originalError = console.error
const originalWarn = console.warn
beforeEach(() => {
  console.error = (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : ''
    
    // Suppress specific React warnings in tests
    if (
      (message.includes('Warning: An update to') && message.includes('was not wrapped in act')) ||
      (message.includes('Received `true` for a non-boolean attribute')) ||
      (message.includes('If you want to write it to the DOM, pass a string instead'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : ''
    
    // Suppress specific React warnings in tests
    if (
      (message.includes('Warning: An update to') && message.includes('was not wrapped in act')) ||
      (message.includes('Received `true` for a non-boolean attribute'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterEach(() => {
  console.error = originalError
  console.warn = originalWarn
})
