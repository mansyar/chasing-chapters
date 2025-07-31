# 🚀 Production Deployment Guide

## Overview

This guide covers deploying Chasing Chapters to production using Coolify on a VPS with PostgreSQL database and Cloudflare SSL.

## Prerequisites

- VPS with Coolify installed and configured
- PostgreSQL database server setup
- Cloudflare account with SSL certificates configured
- GitHub repository access
- Cloudflare R2 storage bucket

## 🗄️ Database Setup

### 1. Database Migration

Before deploying, ensure your production database is properly migrated:

```bash
# Check current migration status
pnpm payload:migrate:status

# Run migrations to production database
pnpm payload:migrate

# If needed, create new migrations
pnpm payload:migrate:create

# Refresh migrations (use with caution)
pnpm payload:migrate:refresh
```

### 2. Production Database Connection

Ensure your `DATABASE_URI` environment variable is set correctly:

```
DATABASE_URI=postgresql://username:password@host:port/database_name
```

## 🐳 Coolify Deployment

### 1. Project Configuration

1. **Create New Project in Coolify:**
   - Navigate to your Coolify dashboard
   - Click "New Project"
   - Select "GitHub Repository"
   - Connect your `chasing-chapters` repository

2. **Build Configuration:**
   - **Build Pack:** Docker
   - **Dockerfile Location:** `./Dockerfile`
   - **Build Context:** Root directory
   - **Port:** 3000

3. **Domain Configuration:**
   - Set your custom domain
   - Ensure Cloudflare SSL is configured
   - Enable automatic HTTPS redirect

### 2. Environment Variables

Configure the following environment variables in Coolify:

```bash
# Required Variables
NODE_ENV=production
PAYLOAD_SECRET=your-secure-random-string-min-32-chars
DATABASE_URI=postgresql://user:password@host:port/database

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Optional
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
NEXT_TELEMETRY_DISABLED=1
```

### 3. Build and Deploy

1. **Initial Deployment:**
   - Push your code to the main branch
   - Coolify will automatically trigger a build
   - Monitor the build logs for any errors

2. **Build Process:**
   - Docker builds using multi-stage process
   - Dependencies installed and cached
   - Next.js build with standalone output
   - Health check endpoint configured

## 🔍 Post-Deployment Validation

### 1. Health Check

Verify the application is running correctly:

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-30T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0",
  "database": "connected"
}
```

### 2. Application Functionality

Test critical functionality:

- [ ] Homepage loads properly
- [ ] Admin panel accessible at `/admin`
- [ ] Login to admin panel works
- [ ] Create/edit reviews functionality
- [ ] File uploads to Cloudflare R2
- [ ] Search functionality
- [ ] SSL certificate working

### 3. Performance Verification

Run performance tests:

```bash
# Local performance test
pnpm test:performance

# Load testing (adjust URL)
pnpm test:load:quick
```

## 🔐 Security Checklist

- [ ] All environment variables properly secured
- [ ] Database connection uses SSL (if required)
- [ ] Cloudflare SSL certificates active
- [ ] No sensitive data in logs
- [ ] Admin panel requires authentication
- [ ] File upload restrictions in place

## 📊 Monitoring

### Application Monitoring

- **Health Endpoint:** `https://your-domain.com/api/health`
- **Admin Panel:** `https://your-domain.com/admin`
- **Coolify Dashboard:** Monitor resource usage and logs

### Database Monitoring

Monitor database performance and connections:

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('your_database_name'));
```

## 🔄 Backup and Recovery

### Database Backup

Create automated backup script:

```bash
#!/bin/bash
# backup-db.sh

DB_NAME="chasing_chapters"
DB_USER="your_user"
DB_HOST="your_host"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

### Cloudflare R2 Backup

R2 files are automatically replicated by Cloudflare. For additional backup:

```bash
# Sync R2 bucket to local backup (requires rclone)
rclone sync r2:your-bucket /local/backup/r2/
```

### Application Backup

```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/app

# Backup environment variables (securely)
# Store in encrypted vault or secure location
```

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check environment variables are set
   - Verify DATABASE_URI is accessible
   - Check Docker build logs in Coolify

2. **Database Connection Issues:**
   - Verify DATABASE_URI format
   - Check database server accessibility
   - Run migration status check

3. **File Upload Issues:**
   - Verify R2 credentials
   - Check R2 bucket permissions
   - Test R2 connectivity

4. **SSL/Domain Issues:**
   - Verify Cloudflare SSL configuration
   - Check DNS records
   - Ensure domain points to VPS

### Debug Commands

```bash
# Check application logs
docker logs <container-id>

# Test database connection
psql $DATABASE_URI -c "SELECT 1;"

# Test R2 connectivity
curl -X GET https://your-account-id.r2.cloudflarestorage.com/your-bucket
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`pnpm test`)
- [ ] Production build successful (`pnpm build`)
- [ ] Environment variables prepared
- [ ] Database accessible
- [ ] R2 storage configured

### Deployment
- [ ] Coolify project configured
- [ ] Environment variables set
- [ ] Repository connected and deployed
- [ ] Health check returning healthy status

### Post-Deployment
- [ ] All functionality tested
- [ ] Performance verified
- [ ] Backup procedures documented
- [ ] Monitoring setup confirmed
- [ ] SSL certificate working

## 🚨 Emergency Procedures

### Rollback Process

If deployment fails:

1. **Coolify Rollback:**
   - Access Coolify dashboard
   - Navigate to deployment history
   - Select previous working deployment
   - Click "Redeploy"

2. **Database Rollback:**
   ```bash
   # Restore from backup
   psql $DATABASE_URI < backup_file.sql
   ```

3. **Application Rollback:**
   - Revert to previous Git commit
   - Push to trigger new deployment

### Emergency Contacts

- VPS Provider Support
- Cloudflare Support
- Database Administrator
- Development Team Lead

---

*Last Updated: January 31, 2025*  
*Version: 1.0*  
*Deployment Target: Production VPS with Coolify*