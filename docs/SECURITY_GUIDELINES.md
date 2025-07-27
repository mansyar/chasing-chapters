# 🔒 Security Guidelines

## Overview

This document outlines comprehensive security practices, authentication patterns, and vulnerability mitigation strategies for the Chasing Chapters application.

## Security Architecture

### Defense in Depth Strategy

```typescript
// Security layers implementation
const securityLayers = {
  network: ['HTTPS', 'HSTS', 'CORS'],
  application: ['Input validation', 'Output encoding', 'Authentication'],
  data: ['Encryption at rest', 'Encryption in transit', 'Access controls'],
  infrastructure: ['WAF', 'Rate limiting', 'DDoS protection'],
}
```

### Threat Model

#### Assets
- User authentication data
- Book review content
- Admin access credentials
- API keys and secrets
- User personal information

#### Threats
- **Data Breaches**: Unauthorized access to sensitive data
- **Injection Attacks**: SQL injection, XSS, CSRF
- **Authentication Bypass**: Unauthorized admin access
- **DDoS Attacks**: Service availability disruption
- **Data Integrity**: Unauthorized content modification

## Authentication & Authorization

### Payload CMS Authentication

```typescript
// Enhanced user collection with security features
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 30 * 60 * 1000, // 30 minutes
    useAPIKey: false,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.COOKIE_DOMAIN,
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      required: true,
      defaultValue: 'editor',
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'loginAttempts',
      type: 'number',
      admin: {
        readOnly: true,
      },
      defaultValue: 0,
    },
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'twoFactorSecret',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Hash password with strong settings
        if (data.password && operation === 'create') {
          const bcrypt = await import('bcryptjs');
          const salt = await bcrypt.genSalt(12);
          data.password = await bcrypt.hash(data.password, salt);
        }
        
        // Update last login
        if (operation === 'update' && req.user) {
          data.lastLogin = new Date();
        }
        
        return data;
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        // Log successful login
        console.log(`User login: ${user.email} at ${new Date().toISOString()}`);
        
        // Reset login attempts on successful login
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: {
            loginAttempts: 0,
            lastLogin: new Date(),
          },
        });
      },
    ],
    afterLoginAttemptFailure: [
      async ({ req, email }) => {
        // Log failed login attempt
        console.warn(`Failed login attempt for: ${email} at ${new Date().toISOString()}`);
        
        // Increment login attempts
        try {
          const user = await req.payload.find({
            collection: 'users',
            where: { email: { equals: email } },
            limit: 1,
          });
          
          if (user.docs.length > 0) {
            await req.payload.update({
              collection: 'users',
              id: user.docs[0].id,
              data: {
                loginAttempts: (user.docs[0].loginAttempts || 0) + 1,
              },
            });
          }
        } catch (error) {
          console.error('Error updating login attempts:', error);
        }
      },
    ],
  },
}
```

### Two-Factor Authentication

```typescript
// lib/two-factor.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorAuth {
  static generateSecret(email: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `Chasing Chapters (${email})`,
      issuer: 'Chasing Chapters',
      length: 32,
    });

    return {
      secret: secret.base32!,
      qrCode: secret.otpauth_url!,
    };
  }

  static async generateQRCode(otpauthUrl: string): Promise<string> {
    return await QRCode.toDataURL(otpauthUrl);
  }

  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of variance
    });
  }
}

// API route for 2FA setup
// app/api/auth/2fa/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TwoFactorAuth } from '@/lib/two-factor';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, qrCode } = TwoFactorAuth.generateSecret(user.email);
    const qrCodeDataUrl = await TwoFactorAuth.generateQRCode(qrCode);

    // Store secret temporarily (don't activate 2FA yet)
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        twoFactorSecret: secret,
      },
    });

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      secret, // For manual entry
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
```

### Session Security

```typescript
// lib/session-security.ts
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

interface SessionData {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export class SessionManager {
  private static secretKey = new TextEncoder().encode(
    process.env.PAYLOAD_SECRET || 'fallback-secret-key'
  );

  static async createSession(user: any): Promise<string> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours
      iat: Math.floor(Date.now() / 1000),
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(this.secretKey);
  }

  static async verifySession(token: string): Promise<SessionData | null> {
    try {
      const { payload } = await jwtVerify(token, this.secretKey);
      return payload as SessionData;
    } catch (error) {
      console.error('Session verification failed:', error);
      return null;
    }
  }

  static setSecureCookie(name: string, value: string, maxAge: number = 7200): void {
    const cookieStore = cookies();
    cookieStore.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
      domain: process.env.COOKIE_DOMAIN,
    });
  }

  static deleteCookie(name: string): void {
    const cookieStore = cookies();
    cookieStore.delete(name);
  }

  static async refreshSession(currentToken: string): Promise<string | null> {
    const session = await this.verifySession(currentToken);
    if (!session) return null;

    // Only refresh if less than 30 minutes left
    const timeLeft = session.exp - Math.floor(Date.now() / 1000);
    if (timeLeft > 30 * 60) return currentToken;

    // Create new session
    return await this.createSession({
      id: session.userId,
      email: session.email,
      role: session.role,
    });
  }
}
```

## Input Validation & Sanitization

### Request Validation Middleware

```typescript
// lib/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Review validation schema
export const reviewSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .refine(val => !/<script|javascript:/i.test(val), 'Invalid characters in title'),
  
  author: z
    .string()
    .min(1, 'Author is required')
    .max(255, 'Author name must be less than 255 characters'),
  
  excerpt: z
    .string()
    .min(1, 'Excerpt is required')
    .max(300, 'Excerpt must be less than 300 characters'),
  
  rating: z
    .number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating must be at most 5'),
  
  content: z.any(), // Rich text content (validated separately)
  
  readingStatus: z.enum(['want-to-read', 'currently-reading', 'finished']),
  
  status: z.enum(['draft', 'published']),
  
  tags: z.array(z.string()).optional(),
  
  bookMetadata: z.object({
    pageCount: z.number().positive().optional(),
    genre: z.string().max(100).optional(),
    publishYear: z.number().min(1000).max(new Date().getFullYear() + 1).optional(),
    isbn: z.string().regex(/^[\d-]{10,17}$/).optional(),
    googleBooksId: z.string().max(50).optional(),
  }).optional(),
});

// Input sanitization
export class InputSanitizer {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'blockquote'],
      ALLOWED_ATTR: [],
    });
  }

  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}

// Validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest): Promise<T> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid input', error.errors);
      }
      throw new ValidationError('Invalid JSON format');
    }
  };
}

export class ValidationError extends Error {
  constructor(message: string, public errors?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### SQL Injection Prevention

```typescript
// lib/safe-query.ts
import { database } from './database';

export class SafeQuery {
  // Parameterized queries only
  static async findReviews(filters: {
    status?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = `
      SELECT r.*, array_agg(t.name) as tag_names
      FROM reviews r
      LEFT JOIN reviews_rels rr ON r.id = rr.parent_id
      LEFT JOIN tags t ON rr.tags_id = t.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    if (filters.status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (r.title ILIKE $${paramCount} OR r.author ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    if (filters.tag) {
      paramCount++;
      query += ` AND t.slug = $${paramCount}`;
      params.push(filters.tag);
    }

    query += ` GROUP BY r.id ORDER BY r.published_date DESC`;

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    return await database.query(query, params);
  }

  // Never allow dynamic query construction
  static sanitizeOrderBy(orderBy: string): string {
    const allowedColumns = ['title', 'author', 'published_date', 'rating', 'created_at'];
    const allowedDirections = ['ASC', 'DESC'];
    
    const [column, direction] = orderBy.split(' ');
    
    if (!allowedColumns.includes(column) || !allowedDirections.includes(direction?.toUpperCase())) {
      return 'published_date DESC'; // Safe default
    }
    
    return `${column} ${direction.toUpperCase()}`;
  }
}
```

## Cross-Site Scripting (XSS) Prevention

### Content Security Policy

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' https://www.googleapis.com https://www.google-analytics.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Output Encoding

```tsx
// components/SafeHtml.tsx
import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface SafeHtmlProps {
  content: string;
  className?: string;
  allowedTags?: string[];
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({
  content,
  className,
  allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'blockquote'],
}) => {
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['href', 'target'], // Only for links if allowed
      ALLOW_DATA_ATTR: false,
    });
  }, [content, allowedTags]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

// Safe text display
export const SafeText: React.FC<{ children: string }> = ({ children }) => {
  const safeText = children
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .trim();

  return <>{safeText}</>;
};
```

## Cross-Site Request Forgery (CSRF) Protection

```typescript
// lib/csrf.ts
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly COOKIE_NAME = '__Host-csrf-token';

  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  static createTokenHash(token: string, secret: string): string {
    return createHash('sha256')
      .update(`${token}:${secret}`)
      .digest('hex');
  }

  static setCSRFCookie(token: string): void {
    const cookieStore = cookies();
    cookieStore.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });
  }

  static getCSRFToken(): string | null {
    const cookieStore = cookies();
    return cookieStore.get(this.COOKIE_NAME)?.value || null;
  }

  static validateCSRFToken(submittedToken: string, cookieToken: string): boolean {
    if (!submittedToken || !cookieToken) return false;
    
    // Use timing-safe comparison
    return this.safeCompare(submittedToken, cookieToken);
  }

  private static safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}

// CSRF middleware for API routes
export function withCSRFProtection(handler: Function) {
  return async (req: NextRequest) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method!)) {
      const submittedToken = req.headers.get('x-csrf-token');
      const cookieToken = CSRFProtection.getCSRFToken();

      if (!CSRFProtection.validateCSRFToken(submittedToken || '', cookieToken || '')) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }

    return handler(req);
  };
}
```

## File Upload Security

```typescript
// lib/secure-upload.ts
import { createHash } from 'crypto';
import sharp from 'sharp';

interface UploadValidation {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

export class SecureUpload {
  private static readonly DEFAULT_CONFIG: UploadValidation = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  };

  static async validateFile(
    file: File,
    config: Partial<UploadValidation> = {}
  ): Promise<{ valid: boolean; error?: string; hash?: string }> {
    const validation = { ...this.DEFAULT_CONFIG, ...config };

    // Size validation
    if (file.size > validation.maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${validation.maxSize / (1024 * 1024)}MB limit`,
      };
    }

    // MIME type validation
    if (!validation.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} not allowed`,
      };
    }

    // Extension validation
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validation.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} not allowed`,
      };
    }

    // File content validation for images
    if (file.type.startsWith('image/')) {
      try {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        // Validate image headers
        const isValidImage = await this.validateImageContent(uint8Array);
        if (!isValidImage) {
          return {
            valid: false,
            error: 'Invalid image file content',
          };
        }

        // Generate file hash for duplicate detection
        const hash = createHash('sha256').update(uint8Array).digest('hex');

        return { valid: true, hash };
      } catch (error) {
        return {
          valid: false,
          error: 'Failed to validate file content',
        };
      }
    }

    return { valid: true };
  }

  private static async validateImageContent(buffer: Uint8Array): Promise<boolean> {
    try {
      // Use sharp to validate image
      const metadata = await sharp(buffer).metadata();
      
      // Check if metadata was successfully extracted
      if (!metadata.width || !metadata.height) {
        return false;
      }

      // Additional checks
      if (metadata.width > 10000 || metadata.height > 10000) {
        return false; // Prevent decompression bombs
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars
      .replace(/_{2,}/g, '_') // Remove multiple underscores
      .toLowerCase()
      .substring(0, 100); // Limit length
  }

  static generateSecureFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const sanitizedBase = this.sanitizeFileName(
      originalName.replace(/\.[^/.]+$/, '')
    );
    
    return `${sanitizedBase}_${timestamp}_${randomString}.${extension}`;
  }
}
```

## Rate Limiting & DDoS Protection

```typescript
// lib/advanced-rate-limit.ts
import { NextRequest } from 'next/server';

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  skipSuccessful?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitConfig {
  global: RateLimitRule;
  perIP: RateLimitRule;
  perUser?: RateLimitRule;
  endpoints: Record<string, RateLimitRule>;
}

export class AdvancedRateLimit {
  private static readonly config: RateLimitConfig = {
    global: { windowMs: 15 * 60 * 1000, maxRequests: 10000 }, // 10k requests per 15 min globally
    perIP: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 min per IP
    perUser: { windowMs: 15 * 60 * 1000, maxRequests: 1000 }, // 1k requests per 15 min per user
    endpoints: {
      '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // Login attempts
      '/api/books/search': { windowMs: 60 * 1000, maxRequests: 30 }, // Google Books API
      '/api/reviews': { windowMs: 60 * 1000, maxRequests: 100 }, // Review operations
    },
  };

  private static storage = new Map<string, { count: number; resetTime: number }>();

  static async checkLimit(
    request: NextRequest,
    endpoint?: string,
    userId?: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const ip = this.getClientIP(request);
    const path = endpoint || new URL(request.url).pathname;

    // Check endpoint-specific limits
    if (this.config.endpoints[path]) {
      const endpointKey = `endpoint:${path}:${ip}`;
      const endpointLimit = this.config.endpoints[path];
      
      if (!await this.checkRule(endpointKey, endpointLimit, now)) {
        return {
          allowed: false,
          retryAfter: Math.ceil((this.getResetTime(endpointKey) - now) / 1000),
        };
      }
    }

    // Check per-IP limits
    const ipKey = `ip:${ip}`;
    if (!await this.checkRule(ipKey, this.config.perIP, now)) {
      return {
        allowed: false,
        retryAfter: Math.ceil((this.getResetTime(ipKey) - now) / 1000),
      };
    }

    // Check per-user limits (if authenticated)
    if (userId) {
      const userKey = `user:${userId}`;
      if (!await this.checkRule(userKey, this.config.perUser!, now)) {
        return {
          allowed: false,
          retryAfter: Math.ceil((this.getResetTime(userKey) - now) / 1000),
        };
      }
    }

    // Check global limits
    const globalKey = 'global';
    if (!await this.checkRule(globalKey, this.config.global, now)) {
      return {
        allowed: false,
        retryAfter: Math.ceil((this.getResetTime(globalKey) - now) / 1000),
      };
    }

    return { allowed: true };
  }

  private static async checkRule(key: string, rule: RateLimitRule, now: number): Promise<boolean> {
    const current = this.storage.get(key);

    if (!current || now > current.resetTime) {
      // New window
      this.storage.set(key, {
        count: 1,
        resetTime: now + rule.windowMs,
      });
      return true;
    }

    if (current.count >= rule.maxRequests) {
      return false;
    }

    // Increment counter
    current.count++;
    return true;
  }

  private static getResetTime(key: string): number {
    return this.storage.get(key)?.resetTime || 0;
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const cloudflare = request.headers.get('cf-connecting-ip');
    
    return cloudflare || real || forwarded?.split(',')[0] || 'unknown';
  }

  // Cleanup old entries
  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.storage.entries()) {
      if (now > value.resetTime) {
        this.storage.delete(key);
      }
    }
  }
}

// Initialize cleanup
setInterval(() => AdvancedRateLimit.cleanup(), 60000); // Every minute
```

## Environment Security

### Secrets Management

```typescript
// lib/secrets.ts
import { z } from 'zod';

// Secret validation schema
const secretsSchema = z.object({
  PAYLOAD_SECRET: z.string().min(32, 'Payload secret must be at least 32 characters'),
  DATABASE_URI: z.string().url('Invalid database URI'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2 access key required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2 secret key required'),
  GOOGLE_BOOKS_API_KEY: z.string().min(1, 'Google Books API key required'),
});

export class SecretsManager {
  private static validated = false;

  static validateSecrets(): void {
    if (this.validated) return;

    try {
      secretsSchema.parse(process.env);
      this.validated = true;
      console.log('✅ All secrets validated successfully');
    } catch (error) {
      console.error('❌ Secret validation failed:', error);
      process.exit(1);
    }
  }

  static maskSecret(secret: string): string {
    if (secret.length <= 8) return '***';
    return secret.slice(0, 4) + '*'.repeat(secret.length - 8) + secret.slice(-4);
  }

  static getSecret(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Secret ${key} not found`);
    }
    return value;
  }

  // Never log sensitive environment variables
  static getSafeEnvSummary(): Record<string, string> {
    const sensitive = [
      'PAYLOAD_SECRET',
      'DATABASE_URI',
      'R2_SECRET_ACCESS_KEY',
      'GOOGLE_BOOKS_API_KEY',
      'SMTP_PASS',
    ];

    const safe: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (sensitive.some(s => key.includes(s))) {
        safe[key] = this.maskSecret(value || '');
      } else if (value) {
        safe[key] = value;
      }
    }

    return safe;
  }
}

// Validate on startup
SecretsManager.validateSecrets();
```

## Security Monitoring & Logging

```typescript
// lib/security-logger.ts
interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class SecurityLogger {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;

  static logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Log to console based on severity
    const logMessage = `[SECURITY ${event.severity.toUpperCase()}] ${event.type}: ${event.message}`;
    
    switch (event.severity) {
      case 'critical':
        console.error(logMessage, event.metadata);
        break;
      case 'high':
        console.error(logMessage, event.metadata);
        break;
      case 'medium':
        console.warn(logMessage, event.metadata);
        break;
      case 'low':
        console.log(logMessage, event.metadata);
        break;
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && event.severity === 'critical') {
      this.alertSecurityTeam(securityEvent);
    }
  }

  static getRecentEvents(limit = 50): SecurityEvent[] {
    return this.events.slice(0, limit);
  }

  static getEventsByType(type: string, limit = 20): SecurityEvent[] {
    return this.events.filter(e => e.type === type).slice(0, limit);
  }

  private static async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    // Implementation would depend on your alerting system
    // Examples: Slack webhook, email, PagerDuty, etc.
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
  }

  // Common security events
  static logFailedLogin(ip: string, email: string, userAgent?: string): void {
    this.logEvent({
      type: 'failed_login',
      severity: 'medium',
      message: `Failed login attempt for ${email}`,
      ip,
      userAgent,
      metadata: { email },
    });
  }

  static logSuspiciousActivity(type: string, ip: string, details: Record<string, any>): void {
    this.logEvent({
      type: 'suspicious_activity',
      severity: 'high',
      message: `Suspicious activity detected: ${type}`,
      ip,
      metadata: details,
    });
  }

  static logDataAccess(userId: string, resource: string, action: string): void {
    this.logEvent({
      type: 'data_access',
      severity: 'low',
      message: `User accessed ${resource}`,
      userId,
      metadata: { resource, action },
    });
  }

  static logSecurityViolation(violation: string, ip: string, details: Record<string, any>): void {
    this.logEvent({
      type: 'security_violation',
      severity: 'critical',
      message: `Security violation: ${violation}`,
      ip,
      metadata: details,
    });
  }
}
```

## Security Headers & Configuration

```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
  
  // Security-focused configuration
  poweredByHeader: false,
  compress: true,
  
  // Image optimization security
  images: {
    domains: ['books.google.com', process.env.R2_PUBLIC_URL?.replace('https://', '')].filter(Boolean),
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Strict mode for better error detection
  reactStrictMode: true,
  
  // Remove unused code in production
  swcMinify: true,
};

export default nextConfig;
```

## Security Checklist

### Pre-Deployment Security Review

- [ ] All user inputs validated and sanitized
- [ ] SQL injection prevention implemented
- [ ] XSS protection in place (CSP, output encoding)
- [ ] CSRF protection implemented
- [ ] Authentication system secure (strong passwords, session management)
- [ ] Authorization checks on all protected resources
- [ ] File upload security implemented
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Secrets properly managed
- [ ] Error handling doesn't leak sensitive information
- [ ] Security logging implemented
- [ ] Dependencies scanned for vulnerabilities
- [ ] Security tests written and passing

### Ongoing Security Monitoring

- [ ] Regular dependency updates
- [ ] Security event monitoring
- [ ] Failed login attempt tracking
- [ ] Unusual activity detection
- [ ] Performance monitoring for DDoS detection
- [ ] Regular security audits
- [ ] Backup and recovery procedures tested
- [ ] Incident response plan documented

This comprehensive security guideline ensures the Chasing Chapters application follows security best practices and protects against common web application vulnerabilities.