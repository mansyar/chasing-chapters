# 🔄 Database Migration Guide

## Overview

This guide covers database migration procedures for Chasing Chapters, including initial setup, migrations, and troubleshooting.

## Prerequisites

- Access to production database server
- `DATABASE_URI` environment variable configured
- Application dependencies installed (`pnpm install`)

## Migration Commands

### Check Migration Status

```bash
# Check current migration status
pnpm payload:migrate:status

# Expected output shows applied migrations
```

### Run Migrations

```bash
# Apply all pending migrations
pnpm payload:migrate

# This will:
# - Connect to the database using DATABASE_URI
# - Apply any pending migrations
# - Update the migration tracking table
```

### Create New Migration

```bash
# Create a new migration file
pnpm payload:migrate:create

# Follow prompts to name your migration
# Edit the generated migration file as needed
```

### Migration Management

```bash
# Refresh all migrations (WARNING: Destructive!)
pnpm payload:migrate:refresh

# Rollback the last migration
pnpm payload:migrate:down

# Reset all migrations (WARNING: Destructive!)
pnpm payload:migrate:reset
```

## Production Migration Procedure

### 1. Pre-Migration Checklist

- [ ] Create database backup
- [ ] Verify application is not running
- [ ] Confirm DATABASE_URI is correct
- [ ] Test database connectivity

```bash
# Create backup before migration
./scripts/backup-db.sh pre_migration_$(date +%Y%m%d_%H%M%S)

# Test database connection
psql $DATABASE_URI -c "SELECT 1;"
```

### 2. Run Migration

```bash
# Set production environment
export NODE_ENV=production

# Check current status
pnpm payload:migrate:status

# Apply migrations
pnpm payload:migrate
```

### 3. Post-Migration Verification

```bash
# Verify tables exist
psql $DATABASE_URI -c "\dt"

# Check collections
psql $DATABASE_URI -c "SELECT COUNT(*) FROM reviews;"
psql $DATABASE_URI -c "SELECT COUNT(*) FROM tags;"
psql $DATABASE_URI -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URI -c "SELECT COUNT(*) FROM media;"

# Verify Payload tables
psql $DATABASE_URI -c "SELECT COUNT(*) FROM payload_migrations;"
```

### 4. Start Application

```bash
# Start application and verify functionality
pnpm start

# Test health endpoint
curl http://localhost:3000/api/health

# Test admin panel
# Navigate to http://localhost:3000/admin
```

## Migration Troubleshooting

### Common Issues

#### 1. Connection Refused

```
Error: connect ECONNREFUSED
```

**Solutions:**
- Verify DATABASE_URI format
- Check database server is running
- Verify network connectivity
- Check firewall settings

#### 2. Authentication Failed

```
Error: password authentication failed
```

**Solutions:**
- Verify username/password in DATABASE_URI
- Check database user permissions
- Ensure user has CREATE/ALTER privileges

#### 3. Migration Already Applied

```
Error: Migration has already been applied
```

**Solutions:**
- Check migration status: `pnpm payload:migrate:status`
- Skip if already applied
- Force refresh if needed (destructive)

#### 4. Table Already Exists

```
Error: relation "table_name" already exists
```

**Solutions:**
- Check if previous migration partially completed
- Use migration rollback if safe
- Manual cleanup may be required

### Manual Migration Recovery

If migrations fail partially:

```bash
# 1. Check migration table
psql $DATABASE_URI -c "SELECT * FROM payload_migrations ORDER BY batch DESC;"

# 2. Identify failed migration
# 3. Manual cleanup if needed
psql $DATABASE_URI -c "DROP TABLE IF EXISTS problematic_table;"

# 4. Reset migration status if necessary
psql $DATABASE_URI -c "DELETE FROM payload_migrations WHERE name = 'failed_migration_name';"

# 5. Re-run migration
pnpm payload:migrate
```

## Database Schema Verification

### Expected Tables

After successful migration, verify these tables exist:

```sql
-- Core Payload tables
payload_migrations
payload_preferences
payload_locked_documents

-- Application tables
users
reviews
tags
media

-- Relationship tables
reviews_tags (many-to-many relationship)
```

### Schema Verification Script

```bash
#!/bin/bash
# verify-schema.sh

echo "Verifying database schema..."

TABLES=(
    "payload_migrations"
    "payload_preferences" 
    "payload_locked_documents"
    "users"
    "reviews"
    "tags"
    "media"
    "reviews_tags"
)

for table in "${TABLES[@]}"; do
    COUNT=$(psql $DATABASE_URI -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table';" | xargs)
    if [ "$COUNT" -eq 1 ]; then
        echo "✅ $table exists"
    else
        echo "❌ $table missing"
    fi
done

echo "Schema verification complete"
```

## Backup Before Migration

Always create a backup before running migrations:

```bash
# Using our backup script
./scripts/backup-db.sh pre_migration_backup

# Manual backup
pg_dump $DATABASE_URI > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Rollback Procedure

If migration fails and rollback is needed:

```bash
# 1. Stop application
# 2. Restore from backup
./scripts/restore-db.sh ./backups/pre_migration_backup.sql

# 3. Verify restoration
psql $DATABASE_URI -c "SELECT COUNT(*) FROM reviews;"

# 4. Investigate migration issue
# 5. Fix and retry
```

## Environment-Specific Notes

### Development

```bash
# Use development database
DATABASE_URI=postgresql://postgres:postgres@localhost:7482/chasing-chapters
pnpm payload:migrate
```

### Staging

```bash
# Use staging database
DATABASE_URI=postgresql://user:pass@staging-db:5432/chasing_chapters_staging
pnpm payload:migrate
```

### Production

```bash
# Use production database with SSL
DATABASE_URI=postgresql://user:pass@prod-db:5432/chasing_chapters?sslmode=require
pnpm payload:migrate
```

---

*Last Updated: January 31, 2025*  
*Version: 1.0*  
*For: Chasing Chapters Production Deployment*