# ✅ Production Deployment Checklist

## Overview

Complete checklist for deploying Chasing Chapters to production using Coolify.

## 📋 Pre-Deployment Requirements

### 1. Infrastructure Requirements
- [ ] VPS with Coolify installed and running
- [ ] Production PostgreSQL database accessible
- [ ] Cloudflare R2 storage bucket configured
- [ ] Domain registered and DNS configured
- [ ] SSL certificates configured in Cloudflare

### 2. Application Requirements
- [ ] All tests passing (`pnpm test`)
  ```bash
  pnpm test:int    # Integration tests
  pnpm test:e2e    # End-to-end tests
  ```
- [ ] Production build successful (`pnpm build`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Security audit passed (`pnpm test:security`)

### 3. Environment Configuration
- [ ] Production environment variables prepared
- [ ] Database migration scripts ready
- [ ] Backup procedures documented
- [ ] Health check endpoint functional

## 🚀 Deployment Steps

### Step 1: Coolify Project Setup
- [ ] Create new application in Coolify
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - Build Pack: Docker
  - Dockerfile: `./Dockerfile`
  - Port: 3000
- [ ] Set custom domain
- [ ] Enable health checks

### Step 2: Environment Variables Configuration

#### Required Variables ✅
- [ ] `NODE_ENV=production`
- [ ] `PAYLOAD_SECRET` (32+ character secure string)
- [ ] `DATABASE_URI` (PostgreSQL connection string)

#### Storage Configuration ✅
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_BUCKET`
- [ ] `R2_ENDPOINT`

#### Optional Variables ⚡
- [ ] `GOOGLE_BOOKS_API_KEY`
- [ ] `NEXT_TELEMETRY_DISABLED=1`

### Step 3: Initial Deployment
- [ ] Trigger first deployment in Coolify
- [ ] Monitor build logs for errors
- [ ] Verify container starts successfully
- [ ] Check health endpoint returns 200

### Step 4: Database Setup
- [ ] Run database migrations:
  ```bash
  pnpm prod:migrate
  ```
- [ ] Verify migration status:
  ```bash
  pnpm payload:migrate:status
  ```
- [ ] Create initial admin user (via admin panel)

### Step 5: Application Verification

#### Core Functionality ✅
- [ ] Homepage loads (`https://your-domain.com`)
- [ ] Admin panel accessible (`https://your-domain.com/admin`)
- [ ] Admin login works
- [ ] Create new review works
- [ ] File upload to R2 works
- [ ] Search functionality works
- [ ] SSL certificate active

#### Performance Checks ⚡
- [ ] Health check responds < 500ms
- [ ] Homepage loads < 3s
- [ ] Admin panel loads < 5s
- [ ] Image optimization working
- [ ] Gzip compression enabled

#### SEO & Analytics 📊
- [ ] Meta tags working
- [ ] Open Graph tags present
- [ ] Sitemap accessible (`/sitemap.xml`)
- [ ] Robots.txt accessible (`/robots.txt`)
- [ ] Structured data validated

## 🔍 Post-Deployment Validation

### Automated Health Check
```bash
# Run comprehensive health check
pnpm prod:health

# Or manually test endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/sitemap.xml
curl https://your-domain.com/robots.txt
```

### Manual Testing Checklist

#### Frontend Testing ✅
- [ ] Homepage displays recent reviews
- [ ] Review pages load with proper content
- [ ] Search returns relevant results
- [ ] Tag filtering works
- [ ] Mobile responsiveness works
- [ ] Social sharing buttons work

#### Admin Panel Testing ✅
- [ ] Login/logout functionality
- [ ] Create new review
- [ ] Edit existing review
- [ ] Upload cover images
- [ ] Create and assign tags
- [ ] Google Books search integration
- [ ] Rich text editor functionality
- [ ] Bulk operations work

#### Integration Testing ✅
- [ ] Google Books API integration
- [ ] Cloudflare R2 file uploads
- [ ] Database operations
- [ ] Search indexing
- [ ] Cache invalidation

## 🔒 Security Verification

### Security Checklist
- [ ] All secrets stored securely in Coolify
- [ ] Database connections use SSL (if required)
- [ ] No sensitive data in logs
- [ ] Admin panel requires authentication
- [ ] File upload restrictions enforced
- [ ] HTTPS enforced (no HTTP access)

### Security Testing
```bash
# Run security audit
pnpm test:security

# Check for vulnerabilities
pnpm audit --audit-level moderate
```

## 📊 Performance Verification

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

### Performance Testing
```bash
# Run performance tests
pnpm test:performance

# Lighthouse audit
pnpm lighthouse

# Load testing
pnpm test:load:quick
```

## 🔄 Backup & Recovery Setup

### Backup Procedures
- [ ] Database backup script tested:
  ```bash
  pnpm prod:backup
  ```
- [ ] Backup restoration tested:
  ```bash
  pnpm prod:restore backup_file.sql
  ```
- [ ] Automated backup schedule configured
- [ ] Backup storage verified (offsite recommended)

### Recovery Testing
- [ ] Database restore procedure tested
- [ ] Application rollback procedure tested
- [ ] Emergency contact list updated

## 📈 Monitoring Setup

### Application Monitoring
- [ ] Health endpoint monitored (`/api/health`)
- [ ] Application logs accessible via Coolify
- [ ] Resource usage monitoring active
- [ ] Error tracking configured (optional)

### Database Monitoring
- [ ] Database connection monitoring
- [ ] Query performance monitoring
- [ ] Storage usage alerts
- [ ] Backup success monitoring

## 🚨 Emergency Procedures

### Rollback Plan
- [ ] Previous deployment identified in Coolify
- [ ] Rollback procedure documented
- [ ] Database rollback plan prepared
- [ ] Communication plan for downtime

### Emergency Contacts
- [ ] VPS provider support contact
- [ ] Database administrator contact
- [ ] Cloudflare support access
- [ ] Development team contacts

## 📚 Documentation

### Required Documentation
- [ ] Deployment guide updated
- [ ] Environment variables documented
- [ ] Backup procedures documented
- [ ] Troubleshooting guide updated
- [ ] Change log maintained

### User Documentation
- [ ] Admin user guide created
- [ ] Content management procedures
- [ ] Common tasks documented
- [ ] FAQ updated

## 🎯 Go-Live Checklist

### Final Pre-Launch
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Backup verified and tested
- [ ] Monitoring active
- [ ] Documentation complete

### Launch Day
- [ ] Final deployment successful
- [ ] All functionality verified
- [ ] Performance monitoring active
- [ ] Support team notified
- [ ] Launch announcement ready

### Post-Launch (24 hours)
- [ ] No critical errors in logs
- [ ] Performance metrics within acceptable range
- [ ] User feedback collected
- [ ] Backup completed successfully
- [ ] Monitoring alerts configured

## 🔧 Maintenance Schedule

### Daily
- [ ] Health check status
- [ ] Error log review
- [ ] Performance metrics check

### Weekly
- [ ] Database backup verification
- [ ] Security updates check
- [ ] Performance analysis

### Monthly
- [ ] Full system health review
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Documentation updates

---

## 📊 Deployment Summary

**Project:** Chasing Chapters  
**Platform:** Coolify on VPS  
**Database:** PostgreSQL  
**Storage:** Cloudflare R2  
**SSL:** Cloudflare Origin Certificates  
**Monitoring:** Built-in health checks  

**Key URLs:**
- Production: `https://your-domain.com`
- Admin Panel: `https://your-domain.com/admin`
- Health Check: `https://your-domain.com/api/health`
- Sitemap: `https://your-domain.com/sitemap.xml`

**Support:**
- Documentation: `/docs/`
- Scripts: `/scripts/`
- Backups: `/backups/`

---

*Last Updated: January 31, 2025*  
*Version: 1.0*  
*Milestone 9: Deployment & Production Setup*