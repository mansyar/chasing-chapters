// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Set up test environment variables
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test'
}
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret-key'
process.env.DATABASE_URI = process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:7482/chasing-chapters'
