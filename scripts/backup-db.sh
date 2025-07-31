#!/bin/bash

# Chasing Chapters - Database Backup Script
# Usage: ./backup-db.sh [backup_name]

set -e

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup_$DATE}"
MAX_BACKUPS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate environment
if [ -z "$DATABASE_URI" ]; then
    error "DATABASE_URI environment variable is not set"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting database backup: $BACKUP_NAME"

# Extract database details from DATABASE_URI
# Format: postgresql://user:password@host:port/dbname
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)"

if [[ $DATABASE_URI =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    error "Invalid DATABASE_URI format. Expected: postgresql://user:password@host:port/dbname"
    exit 1
fi

# Set PostgreSQL password environment variable
export PGPASSWORD="$DB_PASS"

# Create backup
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql"

log "Creating backup: $BACKUP_FILE"
log "Database: $DB_NAME@$DB_HOST:$DB_PORT"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --no-password \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_FILE.custom" > /dev/null 2>&1; then
    
    log "Custom format backup created: $BACKUP_FILE.custom"
    
    # Also create plain SQL backup for easier inspection
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --file="$BACKUP_FILE" > /dev/null 2>&1; then
        
        log "Plain SQL backup created: $BACKUP_FILE"
    else
        warning "Failed to create plain SQL backup, but custom format backup succeeded"
    fi
    
else
    error "Database backup failed"
    exit 1
fi

# Compress backups
if command -v gzip &> /dev/null; then
    log "Compressing backups..."
    gzip -f "$BACKUP_FILE" 2>/dev/null || warning "Failed to compress plain SQL backup"
    BACKUP_FILE="$BACKUP_FILE.gz"
fi

# Calculate backup size
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup completed successfully!"
    log "File: $BACKUP_FILE"
    log "Size: $BACKUP_SIZE"
fi

if [ -f "$BACKUP_FILE.custom" ]; then
    CUSTOM_SIZE=$(du -h "$BACKUP_FILE.custom" | cut -f1)
    log "Custom backup: $BACKUP_FILE.custom"
    log "Size: $CUSTOM_SIZE"
fi

# Clean up old backups
log "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql*" -type f | sort | head -n -$MAX_BACKUPS)

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r old_backup; do
        rm -f "$old_backup"
        log "Removed old backup: $(basename "$old_backup")"
    done
else
    log "No old backups to clean up"
fi

# List current backups
log "Current backups:"
ls -lah "$BACKUP_DIR"/backup_* 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || log "No backups found"

log "Backup process completed successfully!"

# Unset password
unset PGPASSWORD