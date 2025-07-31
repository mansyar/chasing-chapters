# 🚀 Coolify Deployment Guide

## Overview

Complete guide for deploying Chasing Chapters to production using Coolify on your VPS.

## Prerequisites

- VPS with Coolify installed and configured
- GitHub repository access
- Production PostgreSQL database
- Cloudflare R2 storage bucket
- Domain with Cloudflare SSL configured

## 📋 Pre-Deployment Checklist

### 1. Environment Preparation

- [ ] Production database server accessible
- [ ] Database migrations ready
- [ ] Cloudflare R2 bucket configured
- [ ] Domain DNS pointing to VPS
- [ ] SSL certificates configured in Cloudflare

### 2. Application Readiness

- [ ] All tests passing (`pnpm test`)
- [ ] Production build successful (`pnpm build`)
- [ ] Health endpoint working (`/api/health`)
- [ ] Environment variables documented

## 🏗️ Coolify Configuration

### Step 1: Create New Project

1. **Access Coolify Dashboard**
   - Navigate to your Coolify instance
   - Login with admin credentials

2. **Create New Application**
   - Click "New" → "Application"
   - Choose "GitHub Repository"
   - Select your `chasing-chapters` repository

### Step 2: Basic Configuration

**General Settings:**
```
Name: chasing-chapters
Repository: https://github.com/your-username/chasing-chapters
Branch: main (or your production branch)
Build Pack: Docker
```

**Build Configuration:**
```
Dockerfile Location: ./Dockerfile
Build Context: /
Port: 3000
```

**Domain Configuration:**
```
Domain: your-domain.com
Generate Domain: false (using custom domain)
HTTPS: true (via Cloudflare)
```

### Step 3: Environment Variables

Configure these environment variables in Coolify:

#### Required Variables

```bash
NODE_ENV=production
PAYLOAD_SECRET=your-secure-random-string-32-chars-minimum
DATABASE_URI=postgresql://username:password@host:port/database_name
```

#### Storage Configuration

```bash
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

#### Optional Variables

```bash
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

### Step 4: Build Settings

**Build Command (if needed):**
```bash
# Usually not needed with Docker, but if required:
pnpm install && pnpm build
```

**Health Check Configuration:**
```
Health Check URL: /api/health
Health Check Method: GET
Health Check Port: 3000
Health Check Interval: 30s
```

### Step 5: Resource Configuration

**Recommended Resource Limits:**
```
CPU: 1-2 cores
Memory: 2-4 GB
Storage: 10-20 GB
```

**Auto-scaling (if available):**
```
Min Instances: 1
Max Instances: 3
CPU Threshold: 80%
Memory Threshold: 85%
```

## 🚀 Deployment Process

### Step 1: Initial Deployment

1. **Trigger First Deployment**
   - Click "Deploy" in Coolify dashboard
   - Monitor build logs for any errors
   - Wait for deployment to complete

2. **Monitor Build Process**
   ```
   ✅ Cloning repository
   ✅ Building Docker image
   ✅ Installing dependencies
   ✅ Building Next.js application
   ✅ Starting container
   ✅ Health check passing
   ```

### Step 2: Database Migration

**After first successful deployment:**

1. **Access Container Terminal** (via Coolify or SSH)
2. **Run Database Migration:**
   ```bash
   cd /app
   npm run prod:migrate
   
   # Or manually:
   NODE_ENV=production npm run payload:migrate
   ```

3. **Verify Migration:**
   ```bash
   npm run payload:migrate:status
   ```

### Step 3: Verification

1. **Health Check:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Application Testing:**
   - Visit homepage: `https://your-domain.com`
   - Access admin: `https://your-domain.com/admin`
   - Test functionality: create/edit reviews
   - Verify file uploads work

## 🔧 Advanced Configuration

### Custom Domain Setup

1. **DNS Configuration:**
   ```
   Type: A
   Name: @ (or subdomain)
   Value: YOUR_VPS_IP
   TTL: Auto/300
   ```

2. **Cloudflare SSL:**
   - Ensure "Full (strict)" SSL mode
   - Enable "Always Use HTTPS"
   - Configure "Minimum TLS Version"

### Database Connection

**PostgreSQL Connection String Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**Common Connection Options:**
```bash
# Standard connection
DATABASE_URI=postgresql://user:pass@db.example.com:5432/chasing_chapters

# With SSL (recommended for production)
DATABASE_URI=postgresql://user:pass@db.example.com:5432/chasing_chapters?sslmode=require

# With connection pooling
DATABASE_URI=postgresql://user:pass@db.example.com:5432/chasing_chapters?sslmode=require&pool_max=20
```

### Build Optimization

**Docker Build Arguments (if needed):**
```dockerfile
ARG NODE_ENV=production
ARG DATABASE_URI
ARG PAYLOAD_SECRET
```

**Build Hooks (Coolify):**
```bash
# Pre-build hook
echo "Starting build process..."

# Post-build hook  
echo "Build completed successfully!"
npm run prod:health
```

## 📊 Monitoring & Maintenance

### Application Monitoring

**Health Monitoring:**
- Coolify dashboard shows application status
- Health check endpoint: `/api/health`
- Resource usage monitoring built-in

**Log Access:**
```bash
# Via Coolify dashboard: Logs tab
# Or via SSH:
docker logs <container-name> -f
```

### Database Monitoring

**Connection Monitoring:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'chasing_chapters';

-- Check database size
SELECT pg_size_pretty(pg_database_size('chasing_chapters'));
```

### Performance Monitoring

**Key Metrics to Monitor:**
- Response time (< 500ms)
- Memory usage (< 80%)
- CPU usage (< 70%)
- Database connections (< 80% of max)
- Storage usage (< 85%)

## 🔄 Deployment Automation

### GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Coolify
        uses: coollabsio/coolify-action@v1
        with:
          webhook_url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

### Webhook Configuration

1. **In Coolify:**
   - Go to your application settings
   - Enable "Webhook deployment"
   - Copy webhook URL

2. **In GitHub:**
   - Add webhook URL to repository secrets
   - Configure webhook for push events

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures

**Docker Build Issues:**
```bash
# Check Dockerfile syntax
docker build -t chasing-chapters .

# Review build logs in Coolify
# Common fixes:
# - Verify package.json scripts
# - Check environment variables
# - Ensure all dependencies are listed
```

#### 2. Database Connection Issues

**Connection Errors:**
```
Error: connect ECONNREFUSED
Error: password authentication failed
```

**Solutions:**
1. Verify DATABASE_URI format
2. Check database server accessibility:
   ```bash
   telnet db-host 5432
   ```
3. Test connection manually:
   ```bash
   psql $DATABASE_URI -c "SELECT 1;"
   ```

#### 3. Environment Variable Issues

**Missing Variables:**
- Check Coolify environment settings
- Verify variable names (case-sensitive)
- Ensure no trailing spaces

#### 4. SSL/Domain Issues

**Common Problems:**
- DNS not propagated (wait 24-48 hours)
- Cloudflare SSL mode incorrect
- Certificate mismatch

**Solutions:**
```bash
# Check DNS propagation
dig your-domain.com

# Test SSL
curl -I https://your-domain.com

# Check Cloudflare settings
# - SSL/TLS mode: Full (strict)
# - Always Use HTTPS: On
```

### Debug Commands

```bash
# Check container status
docker ps

# View application logs
docker logs <container-id> --tail 100

# Access container shell
docker exec -it <container-id> /bin/sh

# Test health endpoint
curl http://localhost:3000/api/health

# Check database connection
npm run payload:migrate:status
```

## 📋 Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Production build successful
- [ ] Environment variables prepared
- [ ] Database accessible from VPS
- [ ] Domain DNS configured
- [ ] SSL certificates ready

### Deployment
- [ ] Coolify project created
- [ ] Environment variables set
- [ ] Repository connected
- [ ] First deployment successful
- [ ] Health check returning 200

### Post-Deployment
- [ ] Database migrations completed
- [ ] Admin panel accessible
- [ ] All functionality tested
- [ ] File uploads working
- [ ] SSL certificate active
- [ ] Backup procedures tested

### Ongoing Maintenance
- [ ] Regular backups scheduled
- [ ] Monitoring alerts configured
- [ ] Update procedures documented
- [ ] Rollback procedures tested

## 🚨 Emergency Procedures

### Rollback Process

1. **Via Coolify Dashboard:**
   - Navigate to "Deployments" tab
   - Select previous working deployment
   - Click "Redeploy"

2. **Via Git:**
   ```bash
   git revert HEAD
   git push origin main
   # Wait for auto-deployment
   ```

### Emergency Database Restore

```bash
# Access production server
ssh your-vps

# Restore from backup
./scripts/restore-db.sh ./backups/latest-backup.sql --force

# Restart application
# Via Coolify: Restart button
# Or via SSH: docker restart <container-id>
```

---

*Last Updated: January 31, 2025*  
*Version: 1.0*  
*For: Chasing Chapters Production Deployment*