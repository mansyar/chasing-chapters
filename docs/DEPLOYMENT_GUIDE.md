# 🚀 Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Chasing Chapters to production environments, including VPS setup, containerization, and CI/CD pipeline configuration.

## Prerequisites

- Node.js 18.20.2+ or 20.9.0+
- PostgreSQL 14+
- Domain name with DNS access
- SSL certificate (Let's Encrypt or custom)
- Cloudflare R2 bucket configured
- Google Books API key

## Production Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │       VPS        │    │  Cloudflare R2  │
│   (DNS + CDN)   │────│   Next.js App    │────│   (File Storage) │
└─────────────────┘    │   PostgreSQL     │    └─────────────────┘
                       │   Nginx          │
                       └──────────────────┘
```

## VPS Deployment

### Server Requirements

**Minimum Specifications:**
- CPU: 2 vCPUs
- RAM: 4GB
- Storage: 50GB SSD
- Bandwidth: 1TB/month
- OS: Ubuntu 22.04 LTS or newer

**Recommended Specifications:**
- CPU: 4 vCPUs
- RAM: 8GB
- Storage: 100GB SSD
- Bandwidth: 2TB/month

### Initial Server Setup

```bash
#!/bin/bash
# server-setup.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 for process management
npm install -g pm2

# Create application user
sudo adduser --system --group --home /var/www/chasing-chapters appuser

echo "✅ Server setup completed"
```

### PostgreSQL Configuration

```bash
# Configure PostgreSQL
sudo -u postgres psql <<EOF
CREATE USER chasingchapters WITH PASSWORD 'your_secure_password';
CREATE DATABASE chasing_chapters OWNER chasingchapters;
GRANT ALL PRIVILEGES ON DATABASE chasing_chapters TO chasingchapters;
\q
EOF

# Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment and modify:
# listen_addresses = 'localhost'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add line:
# host    chasing_chapters    chasingchapters    127.0.0.1/32    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### Application Deployment

```bash
#!/bin/bash
# deploy-app.sh

# Switch to application user
sudo -u appuser -i

# Clone repository
cd /var/www
git clone https://github.com/your-username/chasing-chapters.git
cd chasing-chapters

# Install dependencies
pnpm install --frozen-lockfile

# Copy environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### Environment Configuration

```bash
# .env.local (Production)

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Payload CMS
PAYLOAD_SECRET=your-32-character-secret-key-here
DATABASE_URI=postgres://chasingchapters:your_secure_password@localhost:5432/chasing_chapters

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=chasing-chapters-prod
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://cdn.yourdomain.com

# Google Books API
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# Security
COOKIE_DOMAIN=.yourdomain.com

# Email (Optional)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-mailgun-password
FROM_EMAIL=noreply@yourdomain.com
NOTIFICATION_EMAIL=admin@yourdomain.com
```

### Build and Start Application

```bash
# Build the application
pnpm build

# Generate Payload types
pnpm generate:types

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Application deployed"
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'chasing-chapters',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/chasing-chapters',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/chasing-chapters/error.log',
      out_file: '/var/log/chasing-chapters/out.log',
      log_file: '/var/log/chasing-chapters/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096',
      
      // Health monitoring
      health_check_url: 'http://localhost:3000/api/health',
      health_check_grace_period: 3000,
      
      // Auto restart on crashes
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Log rotation
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
  
  deploy: {
    production: {
      user: 'appuser',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/chasing-chapters.git',
      path: '/var/www/chasing-chapters',
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git',
    },
  },
};
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/chasing-chapters
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

    # Main application
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin login rate limiting
    location /admin/api/users/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }

    # Media files
    location /media/ {
        expires 1y;
        add_header Cache-Control "public";
        proxy_pass http://localhost:3000;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
        return 404;
    }

    location ~ /(\.env|\.git|node_modules) {
        deny all;
        return 404;
    }

    # Health check
    location /api/health {
        access_log off;
        proxy_pass http://localhost:3000;
    }
}
```

### SSL Certificate Setup

```bash
# Generate SSL certificate with Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add line:
# 0 12 * * * /usr/bin/certbot renew --quiet

# Test auto-renewal
sudo certbot renew --dry-run
```

### Enable and Start Services

```bash
# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/chasing-chapters /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx

# Create log directory
sudo mkdir -p /var/log/chasing-chapters
sudo chown appuser:appuser /var/log/chasing-chapters
```

## Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build application
RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URI=postgres://chasingchapters:${DB_PASSWORD}@db:5432/chasing_chapters
      - PAYLOAD_SECRET=${PAYLOAD_SECRET}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - R2_BUCKET=${R2_BUCKET}
      - R2_ENDPOINT=${R2_ENDPOINT}
      - GOOGLE_BOOKS_API_KEY=${GOOGLE_BOOKS_API_KEY}
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    networks:
      - app-network

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=chasing_chapters
      - POSTGRES_USER=chasingchapters
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/private
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Environment File for Docker

```bash
# .env.docker
DB_PASSWORD=your_secure_database_password
PAYLOAD_SECRET=your-32-character-secret-key-here
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=chasing-chapters-prod
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
```

### Docker Deployment Commands

```bash
# Build and start services
docker-compose --env-file .env.docker up -d --build

# View logs
docker-compose logs -f app

# Database backup
docker-compose exec db pg_dump -U chasingchapters chasing_chapters > backup.sql

# Database restore
docker-compose exec -T db psql -U chasingchapters chasing_chapters < backup.sql

# Update application
git pull
docker-compose --env-file .env.docker up -d --build app
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type check
        run: pnpm run type-check

      - name: Run linting
        run: pnpm run lint

      - name: Run tests
        run: pnpm run test
        env:
          DATABASE_URI: postgres://postgres:test@localhost:5432/test

      - name: Build application
        run: pnpm run build
        env:
          PAYLOAD_SECRET: test-secret-for-build-only
          DATABASE_URI: postgres://postgres:test@localhost:5432/test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/chasing-chapters
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm build
            pm2 reload ecosystem.config.js
            
      - name: Health check
        run: |
          sleep 30
          curl -f https://yourdomain.com/api/health || exit 1
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/chasing-chapters"
DB_NAME="chasing_chapters"
DB_USER="chasingchapters"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Application files backup (if needed)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www chasing-chapters --exclude=node_modules --exclude=.next

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Crontab for Automated Tasks

```bash
# Setup cron jobs
sudo crontab -u appuser -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup.sh

# PM2 log rotation weekly
0 0 * * 0 pm2 flush

# SSL certificate renewal check (runs twice daily)
0 */12 * * * certbot renew --quiet
```

## Monitoring & Maintenance

### Health Monitoring Script

```bash
#!/bin/bash
# health-check.sh

DOMAIN="https://yourdomain.com"
EMAIL="admin@yourdomain.com"
LOG_FILE="/var/log/health-check.log"

# Function to send alert
send_alert() {
    echo "$(date): ALERT - $1" >> $LOG_FILE
    # Send email alert (configure with your email service)
    # echo "$1" | mail -s "Chasing Chapters Alert" $EMAIL
}

# Check website availability
check_website() {
    if ! curl -f -s $DOMAIN/api/health > /dev/null; then
        send_alert "Website is down"
        return 1
    fi
    return 0
}

# Check database connection
check_database() {
    if ! sudo -u postgres psql -d chasing_chapters -c "SELECT 1;" > /dev/null 2>&1; then
        send_alert "Database connection failed"
        return 1
    fi
    return 0
}

# Check disk space
check_disk_space() {
    USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        send_alert "Disk space usage is ${USAGE}%"
        return 1
    fi
    return 0
}

# Check PM2 processes
check_pm2() {
    if ! pm2 jlist | jq '.[0].pm2_env.status' | grep -q "online"; then
        send_alert "PM2 process is not running"
        return 1
    fi
    return 0
}

# Run all checks
echo "$(date): Starting health check" >> $LOG_FILE

check_website
check_database
check_disk_space
check_pm2

echo "$(date): Health check completed" >> $LOG_FILE
```

### Log Rotation Configuration

```bash
# /etc/logrotate.d/chasing-chapters
/var/log/chasing-chapters/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 appuser appuser
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Security Hardening

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Fail2ban for SSH protection
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### System Updates

```bash
#!/bin/bash
# update-system.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/chasing-chapters
sudo -u appuser pnpm update

# Restart services
sudo systemctl reload nginx
pm2 restart all

echo "System updated successfully"
```

## Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check PM2 status
pm2 status
pm2 logs

# Check database connection
sudo -u postgres psql -d chasing_chapters -c "SELECT 1;"

# Check environment variables
pm2 env 0
```

**High memory usage:**
```bash
# Monitor memory
htop
pm2 monit

# Restart application
pm2 restart all
```

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test nginx configuration
sudo nginx -t
```

This comprehensive deployment guide provides everything needed to successfully deploy Chasing Chapters to production with proper security, monitoring, and maintenance procedures.