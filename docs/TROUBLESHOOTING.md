# 🔧 Troubleshooting Guide

## Overview

This guide provides solutions to common issues, debugging procedures, and maintenance tasks for the Chasing Chapters application.

## Quick Diagnostics

### Health Check Commands

```bash
# Check application status
curl -f http://localhost:3000/api/health

# Check database connection
sudo -u postgres psql -d chasing_chapters -c "SELECT 1;"

# Check PM2 processes
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top -n1 | head -20
```

### Log Locations

```bash
# Application logs
tail -f /var/log/chasing-chapters/combined.log
tail -f /var/log/chasing-chapters/error.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log

# System logs
journalctl -f -u nginx
journalctl -f -u postgresql
```

## Common Issues

### Application Won't Start

#### Symptom: PM2 shows app as errored or offline

**Diagnostic Steps:**
```bash
# Check PM2 logs
pm2 logs chasing-chapters

# Check environment variables
pm2 env 0

# Check if port is available
lsof -i :3000

# Check database connection
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URI });
  pool.query('SELECT 1').then(() => console.log('DB OK')).catch(console.error);
"
```

**Common Solutions:**

1. **Missing Environment Variables**
```bash
# Check .env.local file exists and has required variables
cat /var/www/chasing-chapters/.env.local

# Required variables checklist:
# - NODE_ENV
# - DATABASE_URI
# - PAYLOAD_SECRET
# - R2_ACCESS_KEY_ID
# - R2_SECRET_ACCESS_KEY
# - R2_BUCKET
# - R2_ENDPOINT
# - GOOGLE_BOOKS_API_KEY
```

2. **Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URI -c "SELECT version();"

# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL if needed
sudo systemctl restart postgresql
```

3. **Port Already in Use**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>

# Restart application
pm2 restart chasing-chapters
```

4. **Build Issues**
```bash
# Clean and rebuild
cd /var/www/chasing-chapters
rm -rf .next
pnpm build

# Check for TypeScript errors
pnpm run type-check

# Check for linting errors
pnpm run lint
```

### Database Issues

#### Symptom: Database connection timeouts or errors

**Diagnostic Steps:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -d chasing_chapters -c "
  SELECT pg_size_pretty(pg_database_size('chasing_chapters'));
"

# Check for locks
sudo -u postgres psql -d chasing_chapters -c "
  SELECT pid, usename, state, query 
  FROM pg_stat_activity 
  WHERE state != 'idle';
"
```

**Common Solutions:**

1. **Connection Pool Exhaustion**
```bash
# Check active connections
sudo -u postgres psql -c "
  SELECT count(*), state 
  FROM pg_stat_activity 
  GROUP BY state;
"

# Restart application to reset connections
pm2 restart chasing-chapters

# Adjust connection pool settings in payload.config.ts
# max: 20 (default) -> lower if needed
```

2. **Database Disk Space**
```bash
# Check disk space
df -h /var/lib/postgresql/

# Clean up old logs if needed
sudo find /var/log/postgresql/ -name "*.log" -mtime +7 -delete

# Vacuum database
sudo -u postgres psql -d chasing_chapters -c "VACUUM ANALYZE;"
```

3. **Slow Queries**
```bash
# Enable slow query logging
sudo nano /etc/postgresql/14/main/postgresql.conf
# Add: log_min_duration_statement = 1000

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check slow queries
sudo tail -f /var/log/postgresql/postgresql-14-main.log | grep "duration:"
```

#### Symptom: Migration errors

**Diagnostic Steps:**
```bash
# Check migration status
cd /var/www/chasing-chapters
npm run payload -- migrate:status

# Check migration files
ls -la migrations/

# Check database schema
sudo -u postgres psql -d chasing_chapters -c "\dt"
```

**Solutions:**
```bash
# Reset migrations (CAUTION: Only in development)
npm run payload -- migrate:reset

# Run specific migration
npm run payload -- migrate:up <migration-name>

# Rollback migration
npm run payload -- migrate:down <migration-name>

# Fresh migration
npm run payload -- migrate:fresh
```

### File Upload Issues

#### Symptom: Images not uploading or displaying

**Diagnostic Steps:**
```bash
# Check R2 configuration
curl -v https://$R2_ENDPOINT

# Test R2 credentials
aws s3 ls s3://$R2_BUCKET --endpoint-url=$R2_ENDPOINT

# Check upload directory permissions
ls -la /var/www/chasing-chapters/uploads/

# Check nginx file size limits
grep client_max_body_size /etc/nginx/sites-available/chasing-chapters
```

**Common Solutions:**

1. **R2 Connection Issues**
```bash
# Test R2 connectivity
curl -I $R2_ENDPOINT

# Verify credentials in .env.local
cat /var/www/chasing-chapters/.env.local | grep R2_

# Test upload manually
aws s3 cp test.txt s3://$R2_BUCKET/test.txt --endpoint-url=$R2_ENDPOINT
```

2. **File Size Limits**
```nginx
# Update nginx.conf
client_max_body_size 10M;

# Restart nginx
sudo systemctl reload nginx
```

3. **CORS Issues**
```bash
# Check CORS configuration in R2 dashboard
# Ensure domain is whitelisted
# Add to allowed origins: https://yourdomain.com
```

### Performance Issues

#### Symptom: Slow page loading

**Diagnostic Steps:**
```bash
# Check server resources
htop
iotop
free -h

# Check network latency
ping google.com

# Check database performance
sudo -u postgres psql -d chasing_chapters -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# Check nginx access logs for slow requests
tail -f /var/log/nginx/access.log | grep -E ' [5-9][0-9]{2,} '
```

**Common Solutions:**

1. **High CPU Usage**
```bash
# Check PM2 cluster mode
pm2 reload ecosystem.config.js

# Check for memory leaks
pm2 monit

# Restart application
pm2 restart chasing-chapters
```

2. **Database Performance**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_status_date 
ON reviews(status, published_date DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM reviews WHERE status = 'published' LIMIT 10;

-- Update table statistics
ANALYZE reviews;
```

3. **Caching Issues**
```bash
# Clear application cache (if using Redis)
redis-cli FLUSHALL

# Clear CDN cache (if using Cloudflare)
# Use Cloudflare dashboard to purge cache

# Check if cache is working
curl -I https://yourdomain.com/ | grep -i cache
```

### SSL Certificate Issues

#### Symptom: SSL certificate expired or invalid

**Diagnostic Steps:**
```bash
# Check certificate status
sudo certbot certificates

# Check certificate expiry
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Check nginx SSL configuration
sudo nginx -t
```

**Solutions:**
```bash
# Renew certificate manually
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check auto-renewal cron job
sudo crontab -l | grep certbot

# Add auto-renewal if missing
echo "0 */12 * * * certbot renew --quiet" | sudo crontab -
```

### Google Books API Issues

#### Symptom: Book search not working

**Diagnostic Steps:**
```bash
# Test API key
curl "https://www.googleapis.com/books/v1/volumes?q=test&key=$GOOGLE_BOOKS_API_KEY"

# Check API quota
# Visit Google Cloud Console > APIs & Services > Quotas

# Check application logs for API errors
grep -i "google" /var/log/chasing-chapters/error.log
```

**Solutions:**
```bash
# Verify API key in environment
echo $GOOGLE_BOOKS_API_KEY

# Test with different search terms
curl "https://www.googleapis.com/books/v1/volumes?q=gatsby&key=$GOOGLE_BOOKS_API_KEY"

# Check rate limiting
# Default: 1000 requests per day, 100 per 100 seconds
```

## Debugging Procedures

### Application Debugging

#### Enable Debug Mode
```bash
# Add to .env.local
DEBUG=*
NODE_ENV=development

# Restart application
pm2 restart chasing-chapters
```

#### Memory Leak Detection
```bash
# Install clinic.js for profiling
npm install -g clinic

# Profile application
clinic doctor --on-port 'curl localhost:3000' -- node server.js

# Generate heap snapshot
node --inspect server.js
# Then use Chrome DevTools
```

#### Database Query Debugging
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- View active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Kill long-running query
SELECT pg_cancel_backend(<pid>);
```

### Network Debugging

#### DNS Issues
```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check from different DNS servers
dig @8.8.8.8 yourdomain.com
dig @1.1.1.1 yourdomain.com

# Flush DNS cache (if needed)
sudo systemctl restart systemd-resolved
```

#### Connection Issues
```bash
# Test connectivity
telnet yourdomain.com 80
telnet yourdomain.com 443

# Check firewall
sudo ufw status
sudo iptables -L

# Check nginx configuration
sudo nginx -t
sudo nginx -s reload
```

### Performance Debugging

#### Profiling Tools
```bash
# CPU profiling with perf
sudo perf record -g node server.js
sudo perf report

# Memory profiling
node --max-old-space-size=4096 --inspect server.js

# Network profiling
iftop
netstat -i
```

#### Database Profiling
```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

## Monitoring and Alerts

### System Monitoring Script

```bash
#!/bin/bash
# monitoring.sh

LOGFILE="/var/log/system-monitor.log"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=85
THRESHOLD_DISK=90

# Function to send alert
send_alert() {
    echo "$(date): ALERT - $1" >> $LOGFILE
    # Add your alerting mechanism here (email, Slack, etc.)
}

# Check CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > $THRESHOLD_CPU" | bc -l) )); then
    send_alert "High CPU usage: ${CPU_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", ($3/$2) * 100.0)}')
if (( $(echo "$MEMORY_USAGE > $THRESHOLD_MEMORY" | bc -l) )); then
    send_alert "High memory usage: ${MEMORY_USAGE}%"
fi

# Check disk usage
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt $THRESHOLD_DISK ]; then
    send_alert "High disk usage: ${DISK_USAGE}%"
fi

# Check application status
if ! pm2 jlist | jq -e '.[0].pm2_env.status == "online"' > /dev/null; then
    send_alert "Application is not running"
fi

# Check database connectivity
if ! sudo -u postgres psql -d chasing_chapters -c "SELECT 1;" > /dev/null 2>&1; then
    send_alert "Database connection failed"
fi

echo "$(date): Monitoring check completed" >> $LOGFILE
```

### Application Health Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: false,
      memory: false,
      disk: false,
    },
    details: {} as any,
  };

  try {
    // Database check
    await database.query('SELECT 1');
    checks.checks.database = true;
  } catch (error) {
    checks.status = 'unhealthy';
    checks.details.database = error.message;
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.rss / 1024 / 1024);
  checks.checks.memory = memUsedMB < 1000; // Less than 1GB
  checks.details.memory = {
    used: `${memUsedMB}MB`,
    heap: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
  };

  const status = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status });
}
```

## Maintenance Tasks

### Regular Maintenance Checklist

#### Daily Tasks
```bash
# Check application status
pm2 status

# Check error logs
tail -n 100 /var/log/chasing-chapters/error.log

# Check disk space
df -h

# Check backup status
ls -la /var/backups/chasing-chapters/
```

#### Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Rotate logs
sudo logrotate -f /etc/logrotate.d/chasing-chapters

# Vacuum database
sudo -u postgres psql -d chasing_chapters -c "VACUUM ANALYZE;"

# Check SSL certificate
sudo certbot certificates
```

#### Monthly Tasks
```bash
# Update Node.js dependencies
cd /var/www/chasing-chapters
pnpm update

# Check for security vulnerabilities
pnpm audit

# Review and clean old backups
find /var/backups/chasing-chapters/ -name "*.gz" -mtime +30 -delete

# Review performance metrics
# Check Google PageSpeed Insights
# Review server resource usage trends
```

### Automated Maintenance Script

```bash
#!/bin/bash
# maintenance.sh

LOG_FILE="/var/log/maintenance.log"
APP_DIR="/var/www/chasing-chapters"

log() {
    echo "$(date): $1" >> $LOG_FILE
}

log "Starting maintenance tasks"

# Update system packages
log "Updating system packages"
sudo apt update && sudo apt upgrade -y

# Check application status
if ! pm2 jlist | jq -e '.[0].pm2_env.status == "online"' > /dev/null; then
    log "WARNING: Application is not running, attempting restart"
    cd $APP_DIR
    pm2 restart chasing-chapters
fi

# Database maintenance
log "Running database maintenance"
sudo -u postgres psql -d chasing_chapters -c "VACUUM ANALYZE;" >> $LOG_FILE 2>&1

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log "WARNING: Disk usage is at ${DISK_USAGE}%"
    
    # Clean up old logs
    find /var/log/ -name "*.log" -mtime +7 -exec gzip {} \;
    find /var/log/ -name "*.gz" -mtime +30 -delete
fi

# SSL certificate check
CERT_DAYS=$(echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates | grep 'notAfter' | cut -d= -f2 | xargs -I {} date -d {} +%s)
CURRENT_DATE=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (CERT_DAYS - CURRENT_DATE) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    log "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
fi

log "Maintenance tasks completed"
```

## Recovery Procedures

### Application Recovery

#### From Backup
```bash
# Stop application
pm2 stop chasing-chapters

# Restore application files
cd /var/www
sudo rm -rf chasing-chapters
sudo tar -xzf /var/backups/chasing-chapters/app_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore database
gunzip /var/backups/chasing-chapters/db_backup_YYYYMMDD_HHMMSS.sql.gz
sudo -u postgres psql -d chasing_chapters < /var/backups/chasing-chapters/db_backup_YYYYMMDD_HHMMSS.sql

# Reinstall dependencies and restart
cd chasing-chapters
pnpm install --frozen-lockfile
pnpm build
pm2 start ecosystem.config.js
```

#### From Git Repository
```bash
# Stop application
pm2 stop chasing-chapters

# Reset to last known good commit
cd /var/www/chasing-chapters
git fetch origin
git reset --hard origin/main

# Rebuild and restart
pnpm install --frozen-lockfile
pnpm build
pm2 restart chasing-chapters
```

### Database Recovery

#### Point-in-Time Recovery
```bash
# Stop application
pm2 stop chasing-chapters

# Create recovery database
sudo -u postgres createdb chasing_chapters_recovery

# Restore base backup
sudo -u postgres pg_restore -d chasing_chapters_recovery /var/backups/base_backup.tar

# Apply WAL files up to specific point
sudo -u postgres pg_waldump /var/lib/postgresql/14/main/pg_wal/

# Switch databases
sudo -u postgres psql -c "ALTER DATABASE chasing_chapters RENAME TO chasing_chapters_old;"
sudo -u postgres psql -c "ALTER DATABASE chasing_chapters_recovery RENAME TO chasing_chapters;"

# Restart application
pm2 start chasing-chapters
```

This comprehensive troubleshooting guide provides systematic approaches to diagnosing and resolving common issues in the Chasing Chapters application.