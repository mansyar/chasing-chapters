# 🔗 Integration Specifications

## Overview

This document details all third-party service integrations for Chasing Chapters, including setup procedures, implementation patterns, and troubleshooting guides.

## Google Books API Integration

### Setup and Configuration

#### API Key Setup
```bash
# 1. Go to Google Cloud Console
# 2. Enable Books API
# 3. Create credentials (API Key)
# 4. Add to environment variables

GOOGLE_BOOKS_API_KEY=your_api_key_here
```

#### Rate Limits and Quotas
- **Daily Limit**: 1,000 requests per day
- **Per-second Limit**: 100 requests per 100 seconds
- **Burst Limit**: 10 requests per second

### Implementation

#### API Client

```typescript
// lib/google-books.ts
interface GoogleBooksConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

class GoogleBooksClient {
  private config: GoogleBooksConfig;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.config = {
      apiKey: process.env.GOOGLE_BOOKS_API_KEY || '',
      baseUrl: 'https://www.googleapis.com/books/v1',
      timeout: 10000,
    };
  }

  async searchBooks(query: string, options: SearchOptions = {}): Promise<GoogleBooksResponse> {
    const {
      maxResults = 10,
      startIndex = 0,
      orderBy = 'relevance',
      printType = 'books',
      langRestrict,
    } = options;

    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    
    // Check cache first (1 hour TTL)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }
    }

    const params = new URLSearchParams({
      q: query,
      key: this.config.apiKey,
      maxResults: maxResults.toString(),
      startIndex: startIndex.toString(),
      orderBy,
      printType,
      ...(langRestrict && { langRestrict }),
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(
        `${this.config.baseUrl}/volumes?${params}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Chasing-Chapters/1.0',
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new GoogleBooksError(
          `API request failed: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      
      // Cache successful response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new GoogleBooksError('Request timeout', 408);
      }
      throw error;
    }
  }

  async getBookDetails(volumeId: string): Promise<GoogleBook> {
    const cacheKey = `book:${volumeId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 86400000) { // 24 hours
        return cached.data;
      }
    }

    const url = `${this.config.baseUrl}/volumes/${volumeId}?key=${this.config.apiKey}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Chasing-Chapters/1.0',
        },
      });

      if (!response.ok) {
        throw new GoogleBooksError(
          `Failed to fetch book details: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error('Error fetching book details:', error);
      throw error;
    }
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 86400000) { // 24 hours
        this.cache.delete(key);
      }
    }
  }
}

export class GoogleBooksError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'GoogleBooksError';
  }
}

export const googleBooksClient = new GoogleBooksClient();
```

#### API Route Implementation

```typescript
// app/api/books/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { googleBooksClient } from '@/lib/google-books';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit 500 users per minute
});

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await limiter.check(request, 10, 'SEARCH_BOOKS'); // 10 requests per minute per user

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const startIndex = parseInt(searchParams.get('startIndex') || '0');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (maxResults > 40) {
      return NextResponse.json(
        { error: 'maxResults cannot exceed 40' },
        { status: 400 }
      );
    }

    const results = await googleBooksClient.searchBooks(query, {
      maxResults,
      startIndex,
    });

    // Transform the response to include only necessary fields
    const transformedResults = {
      ...results,
      items: results.items?.map(book => ({
        id: book.id,
        volumeInfo: {
          title: book.volumeInfo.title,
          authors: book.volumeInfo.authors,
          publishedDate: book.volumeInfo.publishedDate,
          description: book.volumeInfo.description,
          pageCount: book.volumeInfo.pageCount,
          categories: book.volumeInfo.categories,
          imageLinks: book.volumeInfo.imageLinks,
          industryIdentifiers: book.volumeInfo.industryIdentifiers,
          language: book.volumeInfo.language,
        },
      })) || [],
    };

    return NextResponse.json(transformedResults);
  } catch (error) {
    console.error('Google Books API error:', error);

    if (error instanceof GoogleBooksError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
```

#### Frontend Integration

```tsx
// hooks/useGoogleBooks.ts
import { useState } from 'react';

interface UseGoogleBooksReturn {
  searchBooks: (query: string) => Promise<void>;
  getBookDetails: (id: string) => Promise<GoogleBook | null>;
  results: GoogleBook[];
  loading: boolean;
  error: string | null;
}

export function useGoogleBooks(): UseGoogleBooksReturn {
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBooks = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(query)}&maxResults=20`
      );

      if (!response.ok) {
        throw new Error('Failed to search books');
      }

      const data = await response.json();
      setResults(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getBookDetails = async (id: string): Promise<GoogleBook | null> => {
    try {
      const response = await fetch(`/api/books/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching book details:', error);
      return null;
    }
  };

  return {
    searchBooks,
    getBookDetails,
    results,
    loading,
    error,
  };
}
```

## Cloudflare R2 Storage Integration

### Setup and Configuration

#### R2 Bucket Setup
```bash
# 1. Create R2 bucket in Cloudflare dashboard
# 2. Generate API tokens with R2:Edit permissions
# 3. Configure CORS policy

# Environment variables
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET=chasing-chapters
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-custom-domain.com # Optional custom domain
```

#### CORS Configuration
```json
{
  "cors": [
    {
      "allowedOrigins": [
        "https://yourdomain.com",
        "http://localhost:3000"
      ],
      "allowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "allowedHeaders": ["*"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

### Implementation

#### Storage Adapter Configuration

```typescript
// payload.config.ts
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          generateFileURL: ({ filename, prefix }) => {
            const baseUrl = process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT;
            return `${baseUrl}/${prefix}/${filename}`;
          },
        },
      },
      bucket: process.env.R2_BUCKET!,
      config: {
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        region: 'auto',
        forcePathStyle: true,
      },
    }),
  ],
})
```

#### Direct Upload Implementation

```typescript
// lib/r2-client.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class R2Client {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET!;
    this.client = new S3Client({
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      region: 'auto',
    });
  }

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
      CacheControl: 'public, max-age=31536000', // 1 year
    });

    await this.client.send(command);

    const baseUrl = process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT;
    return `${baseUrl}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }
}

export const r2Client = new R2Client();
```

#### Image Processing Pipeline

```typescript
// lib/image-processing.ts
import sharp from 'sharp';

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export class ImageProcessor {
  async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<{ buffer: Buffer; info: sharp.OutputInfo }> {
    let processor = sharp(buffer);

    // Resize if dimensions provided
    if (options.width || options.height) {
      processor = processor.resize(options.width, options.height, {
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Convert format if specified
    if (options.format) {
      switch (options.format) {
        case 'webp':
          processor = processor.webp({ quality: options.quality || 80 });
          break;
        case 'jpeg':
          processor = processor.jpeg({ quality: options.quality || 85 });
          break;
        case 'png':
          processor = processor.png({ quality: options.quality || 90 });
          break;
      }
    }

    // Auto-orient and strip metadata
    processor = processor.rotate().withMetadata(false);

    const { data, info } = await processor.toBuffer({ resolveWithObject: true });

    return { buffer: data, info };
  }

  async generateImageSizes(
    originalBuffer: Buffer,
    sizes: Array<{ name: string; width?: number; height?: number }>
  ): Promise<Map<string, { buffer: Buffer; info: sharp.OutputInfo }>> {
    const results = new Map();

    for (const size of sizes) {
      const processed = await this.processImage(originalBuffer, {
        width: size.width,
        height: size.height,
        format: 'webp',
        quality: 80,
      });

      results.set(size.name, processed);
    }

    return results;
  }
}

export const imageProcessor = new ImageProcessor();
```

## PostgreSQL Database Integration

### Connection Configuration

```typescript
// lib/database.ts
import { Pool, PoolConfig } from 'pg';

interface DatabaseConfig extends PoolConfig {
  connectionString?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseManager {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString || process.env.DATABASE_URI,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.close());
    process.on('SIGTERM', () => this.close());
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const database = new DatabaseManager({
  connectionString: process.env.DATABASE_URI,
});
```

### Migration System

```typescript
// lib/migrations.ts
import { database } from './database';
import fs from 'fs/promises';
import path from 'path';

interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

class MigrationManager {
  private migrationsPath: string;

  constructor(migrationsPath: string) {
    this.migrationsPath = migrationsPath;
  }

  async ensureMigrationsTable(): Promise<void> {
    await database.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await database.query(
      'SELECT id FROM migrations ORDER BY executed_at'
    );
    return result.rows.map((row: any) => row.id);
  }

  async loadMigrations(): Promise<Migration[]> {
    const files = await fs.readdir(this.migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of migrationFiles) {
      const content = await fs.readFile(
        path.join(this.migrationsPath, file),
        'utf-8'
      );

      const [up, down] = content.split('-- DOWN');
      const id = file.replace('.sql', '');
      const name = id.replace(/^\d+_/, '').replace(/_/g, ' ');

      migrations.push({
        id,
        name,
        up: up.replace('-- UP', '').trim(),
        down: down ? down.trim() : '',
      });
    }

    return migrations;
  }

  async runMigrations(): Promise<void> {
    await this.ensureMigrationsTable();

    const allMigrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.id)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    for (const migration of pendingMigrations) {
      console.log(`Running migration: ${migration.name}`);

      await database.transaction(async (client) => {
        await client.query(migration.up);
        await client.query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );
      });

      console.log(`Completed migration: ${migration.name}`);
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    const allMigrations = await this.loadMigrations();
    const migration = allMigrations.find(m => m.id === migrationId);

    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${migrationId} has no rollback script`);
    }

    await database.transaction(async (client) => {
      await client.query(migration.down);
      await client.query(
        'DELETE FROM migrations WHERE id = $1',
        [migrationId]
      );
    });

    console.log(`Rolled back migration: ${migration.name}`);
  }
}

export const migrationManager = new MigrationManager(
  path.join(process.cwd(), 'migrations')
);
```

## Email Integration (Optional)

### SMTP Configuration

```typescript
// lib/email.ts
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(config: EmailConfig, fromAddress: string) {
    this.transporter = nodemailer.createTransporter(config);
    this.from = fromAddress;
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || this.extractTextFromHtml(html),
    });
  }

  async sendReviewNotification(review: any): Promise<void> {
    const html = `
      <h2>New Review Published: ${review.title}</h2>
      <p>by ${review.author}</p>
      <p>Rating: ${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5 - Math.floor(review.rating))}</p>
      <p>${review.excerpt}</p>
      <a href="${process.env.FRONTEND_URL}/reviews/${review.slug}">Read Full Review</a>
    `;

    await this.sendEmail(
      process.env.NOTIFICATION_EMAIL!,
      `New Review: ${review.title}`,
      html
    );
  }

  private extractTextFromHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService(
  {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  },
  process.env.FROM_EMAIL!
);
```

## Rate Limiting Implementation

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Number of unique tokens per interval
}

interface RateLimitResult {
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private config: RateLimitConfig;
  private requests: Map<string, number[]> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async check(
    request: NextRequest,
    limit: number,
    token?: string
  ): Promise<RateLimitResult> {
    const identifier = token || this.getIdentifier(request);
    const now = Date.now();
    const windowStart = now - this.config.interval;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    const validRequests = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= limit) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + this.config.interval;
      
      throw new Error(`Rate limit exceeded. Try again at ${new Date(resetTime).toISOString()}`);
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      limit,
      remaining: limit - validRequests.length,
      reset: now + this.config.interval,
    };
  }

  private getIdentifier(request: NextRequest): string {
    // Use IP address as identifier
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    return ip;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.interval;

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

export function rateLimit(config: RateLimitConfig) {
  return new RateLimiter(config);
}
```

## Environment Variables

### Complete Environment Configuration

```bash
# .env.local

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Payload CMS
PAYLOAD_SECRET=your-payload-secret-32-characters-long
DATABASE_URI=postgres://user:password@localhost:5432/chasing_chapters

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=chasing-chapters
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-custom-domain.com

# Google Books API
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@chasingchapters.com
NOTIFICATION_EMAIL=admin@chasingchapters.com

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
PLAUSIBLE_DOMAIN=chasingchapters.com

# Development
NODE_ENV=development
```

### Environment Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URI: z.string().url(),
  PAYLOAD_SECRET: z.string().min(32),
  
  // R2 Storage
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET: z.string(),
  R2_ENDPOINT: z.string().url(),
  R2_PUBLIC_URL: z.string().url().optional(),
  
  // Google Books
  GOOGLE_BOOKS_API_KEY: z.string(),
  
  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // URLs
  NEXT_PUBLIC_APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}

// Validate on startup
export const env = validateEnv();
```

## Health Checks and Monitoring

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { googleBooksClient } from '@/lib/google-books';
import { r2Client } from '@/lib/r2-client';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

export async function GET() {
  const checks: HealthCheck[] = [];
  let overallStatus = 'healthy';

  // Database check
  const dbStart = Date.now();
  try {
    await database.healthCheck();
    checks.push({
      service: 'database',
      status: 'healthy',
      latency: Date.now() - dbStart,
    });
  } catch (error) {
    checks.push({
      service: 'database',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    overallStatus = 'unhealthy';
  }

  // Google Books API check
  const googleStart = Date.now();
  try {
    await googleBooksClient.searchBooks('test', { maxResults: 1 });
    checks.push({
      service: 'google-books',
      status: 'healthy',
      latency: Date.now() - googleStart,
    });
  } catch (error) {
    checks.push({
      service: 'google-books',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't mark overall as unhealthy for Google Books issues
  }

  // R2 Storage check (simple ping)
  const r2Start = Date.now();
  try {
    // Try to list objects (with limit 1) to test connectivity
    await r2Client.listObjects({ maxKeys: 1 });
    checks.push({
      service: 'r2-storage',
      status: 'healthy',
      latency: Date.now() - r2Start,
    });
  } catch (error) {
    checks.push({
      service: 'r2-storage',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    overallStatus = 'unhealthy';
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  return NextResponse.json(
    response,
    { status: overallStatus === 'healthy' ? 200 : 503 }
  );
}
```

This comprehensive integration specification provides detailed implementation guidance for all third-party services and infrastructure components in the Chasing Chapters application.