#!/bin/bash

# Chasing Chapters - Database Restore Script
# Usage: ./restore-db.sh <backup_file> [--force]

set -e

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Configuration
BACKUP_FILE="$1"
FORCE_RESTORE="$2"

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

# Usage function
usage() {
    echo "Usage: $0 <backup_file> [--force]"
    echo ""
    echo "Arguments:"
    echo "  backup_file    Path to the backup file (.sql, .sql.gz, or .custom)"
    echo "  --force        Skip confirmation prompt (use with caution)"
    echo ""
    echo "Examples:"
    echo "  $0 ./backups/backup_20250131_120000.sql"
    echo "  $0 ./backups/backup_20250131_120000.sql.gz --force"
    echo "  $0 ./backups/backup_20250131_120000.sql.custom"
    exit 1
}

# Validate arguments
if [ -z "$BACKUP_FILE" ]; then
    error "Backup file is required"
    usage
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file does not exist: $BACKUP_FILE"
    exit 1
fi

# Validate environment
if [ -z "$DATABASE_URI" ]; then
    error "DATABASE_URI environment variable is not set"
    exit 1
fi

log "Starting database restore from: $BACKUP_FILE"

# Extract database details from DATABASE_URI
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

# Safety confirmation
if [ "$FORCE_RESTORE" != "--force" ]; then
    warning "This will COMPLETELY REPLACE the current database: $DB_NAME"
    warning "Current data will be PERMANENTLY LOST!"
    echo ""
    read -p "Are you sure you want to continue? Type 'yes' to confirm: " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

# Determine backup format
BACKUP_FORMAT="plain"
if [[ "$BACKUP_FILE" == *.custom ]]; then
    BACKUP_FORMAT="custom"
elif [[ "$BACKUP_FILE" == *.gz ]]; then
    BACKUP_FORMAT="compressed"
fi

log "Backup format detected: $BACKUP_FORMAT"
log "Target database: $DB_NAME@$DB_HOST:$DB_PORT"

# Create pre-restore backup
PRE_RESTORE_BACKUP="./backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "./backups"

log "Creating pre-restore backup: $PRE_RESTORE_BACKUP"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-password \
    --format=plain \
    --file="$PRE_RESTORE_BACKUP" > /dev/null 2>&1; then
    log "Pre-restore backup created successfully"
else
    warning "Failed to create pre-restore backup, continuing with restore..."
fi

# Perform restore based on format
log "Starting database restore..."

case $BACKUP_FORMAT in
    "custom")
        log "Restoring from custom format backup..."
        if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --verbose \
            --clean \
            --if-exists \
            --no-password \
            "$BACKUP_FILE"; then
            log "Custom format restore completed successfully"
        else
            error "Custom format restore failed"
            exit 1
        fi
        ;;
    
    "compressed")
        log "Restoring from compressed SQL backup..."
        if gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
            log "Compressed SQL restore completed successfully"
        else
            error "Compressed SQL restore failed"
            exit 1
        fi
        ;;
    
    "plain")
        log "Restoring from plain SQL backup..."
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"; then
            log "Plain SQL restore completed successfully"
        else
            error "Plain SQL restore failed"
            exit 1
        fi
        ;;
    
    *)
        error "Unknown backup format"
        exit 1
        ;;
esac

# Verify restore
log "Verifying database restore..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" > /dev/null 2>&1; then
    
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    log "Database restore verification successful"
    log "Tables found: $TABLE_COUNT"
    
    # Additional verification for Payload tables
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "SELECT COUNT(*) FROM reviews;" > /dev/null 2>&1; then
        
        REVIEW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -t -c "SELECT COUNT(*) FROM reviews;" | xargs)
        log "Reviews found: $REVIEW_COUNT"
    fi
    
else
    error "Database restore verification failed"
    exit 1
fi

log "Database restore completed successfully!"
log "Backup file: $BACKUP_FILE"
log "Pre-restore backup saved: $PRE_RESTORE_BACKUP"

# Cleanup
unset PGPASSWORD

log "Remember to restart your application to ensure all connections are refreshed"