#!/bin/bash

# Database Backup Script for Invoice Management System
# This script creates a complete backup of the database including schema and data

# Load environment variables if .env.local exists
if [ -f "../.env.local" ]; then
    source ../.env.local
fi

# Database connection parameters (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-invoice_management}"
DB_USER="${DB_USER:-warrenwiens}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup directory and filename
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Invoice Management Database Backup${NC}"
echo "======================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
echo -n "Checking database connection... "
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed${NC}"
    echo -e "${RED}Error: Cannot connect to database${NC}"
    exit 1
fi
echo -e "${GREEN}OK${NC}"

# Create the backup
echo -n "Creating backup... "
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --verbose \
    --clean \
    --no-owner \
    --no-acl \
    --if-exists \
    --create \
    --encoding=UTF8 \
    -f "$BACKUP_FILE" 2> "${BACKUP_DIR}/backup_${TIMESTAMP}.log"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Success${NC}"
    
    # Get file size
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    
    # Count records in main tables
    echo ""
    echo "Backup Statistics:"
    echo "-----------------"
    
    CLIENTS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM clients" 2>/dev/null)
    INVOICES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM invoices" 2>/dev/null)
    ITEMS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM invoice_items" 2>/dev/null)
    
    echo "  Clients:        ${CLIENTS_COUNT// /}"
    echo "  Invoices:       ${INVOICES_COUNT// /}"
    echo "  Invoice Items:  ${ITEMS_COUNT// /}"
    echo ""
    echo -e "${GREEN}Backup completed successfully!${NC}"
    echo "File: $BACKUP_FILE"
    echo "Size: $FILE_SIZE"
    
    # Create a compressed version
    echo ""
    echo -n "Creating compressed backup... "
    gzip -c "$BACKUP_FILE" > "${BACKUP_FILE}.gz"
    if [ $? -eq 0 ]; then
        COMPRESSED_SIZE=$(ls -lh "${BACKUP_FILE}.gz" | awk '{print $5}')
        echo -e "${GREEN}Done${NC}"
        echo "Compressed file: ${BACKUP_FILE}.gz"
        echo "Compressed size: $COMPRESSED_SIZE"
    else
        echo -e "${YELLOW}Skipped (gzip not available or failed)${NC}"
    fi
    
    # Create a latest symlink for easy access
    ln -sf "$(basename "$BACKUP_FILE")" "${BACKUP_DIR}/latest_backup.sql"
    if [ -f "${BACKUP_FILE}.gz" ]; then
        ln -sf "$(basename "${BACKUP_FILE}.gz")" "${BACKUP_DIR}/latest_backup.sql.gz"
    fi
    
else
    echo -e "${RED}Failed${NC}"
    echo -e "${RED}Error: Backup failed. Check ${BACKUP_DIR}/backup_${TIMESTAMP}.log for details${NC}"
    exit 1
fi

echo ""
echo "To restore this backup on another server, use:"
echo -e "${YELLOW}./restore.sh $BACKUP_FILE${NC}"