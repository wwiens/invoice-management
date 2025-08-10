#!/bin/bash

# Database Restore Script for Invoice Management System
# This script restores a database backup created by backup.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo -e "${BLUE}Invoice Management Database Restore${NC}"
    echo "Usage: $0 <backup_file> [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  --host HOST             Database host (default: localhost)"
    echo "  --port PORT             Database port (default: 5432)" 
    echo "  --user USER             Database user (default: postgres)"
    echo "  --dbname DBNAME         Database name (default: invoice_management)"
    echo "  --password PASSWORD     Database password"
    echo "  --force                 Skip confirmation prompts"
    echo ""
    echo "Examples:"
    echo "  $0 backups/backup_invoice_management_20240110_143022.sql"
    echo "  $0 backups/latest_backup.sql --host production-db.com --port 5432"
    echo "  $0 backups/backup.sql.gz --user postgres --dbname invoice_prod --force"
    exit 1
}

# Default values
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="invoice_management"
DB_PASSWORD=""
FORCE=false
BACKUP_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        --host)
            DB_HOST="$2"
            shift 2
            ;;
        --port)
            DB_PORT="$2"
            shift 2
            ;;
        --user)
            DB_USER="$2"
            shift 2
            ;;
        --dbname)
            DB_NAME="$2"
            shift 2
            ;;
        --password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            else
                echo -e "${RED}Error: Multiple backup files specified${NC}"
                usage
            fi
            shift
            ;;
    esac
done

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file is required${NC}"
    usage
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file '$BACKUP_FILE' does not exist${NC}"
    exit 1
fi

# Load environment variables if .env.local exists
if [ -f "../.env.local" ]; then
    export $(cat ../.env.local | grep -v '^#' | xargs)
    # Use environment variables as defaults if not specified via command line
    DB_HOST="${DB_HOST:-$DB_HOST}"
    DB_PORT="${DB_PORT:-$DB_PORT}" 
    DB_USER="${DB_USER:-$DB_USER}"
    DB_NAME="${DB_NAME:-$DB_NAME}"
    DB_PASSWORD="${DB_PASSWORD:-$DB_PASSWORD}"
fi

# Prompt for password if not provided
if [ -z "$DB_PASSWORD" ]; then
    echo -n "Database password for $DB_USER: "
    read -s DB_PASSWORD
    echo ""
fi

echo -e "${BLUE}Invoice Management Database Restore${NC}"
echo "======================================="
echo "Backup file: $BACKUP_FILE"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if file is compressed
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -n "Decompressing backup file... "
    TEMP_FILE="/tmp/restore_$(basename "$BACKUP_FILE" .gz)_$$"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Done${NC}"
        BACKUP_FILE="$TEMP_FILE"
    else
        echo -e "${RED}Failed${NC}"
        echo -e "${RED}Error: Could not decompress backup file${NC}"
        exit 1
    fi
fi

# Check database connection
echo -n "Testing database connection... "
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed${NC}"
    echo -e "${RED}Error: Cannot connect to database server${NC}"
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi
echo -e "${GREEN}OK${NC}"

# Check if target database exists
echo -n "Checking if database '$DB_NAME' exists... "
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null)
if [[ "$DB_EXISTS" =~ "1" ]]; then
    echo -e "${YELLOW}Yes${NC}"
    
    if [ "$FORCE" = false ]; then
        echo ""
        echo -e "${YELLOW}WARNING: Database '$DB_NAME' already exists!${NC}"
        echo "This restore will:"
        echo "  1. DROP the existing database (all data will be lost)"
        echo "  2. CREATE a new database"
        echo "  3. RESTORE data from the backup"
        echo ""
        echo -n "Do you want to continue? (y/N): "
        read -r CONFIRM
        if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
            echo "Restore cancelled."
            [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
            exit 0
        fi
    fi
else
    echo -e "${GREEN}No${NC}"
fi

# Perform the restore
echo ""
echo "Starting restore process..."
echo "=========================="

# Restore the database
echo -n "Restoring database... "
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f "$BACKUP_FILE" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Success${NC}"
    
    # Verify restore by checking table counts
    echo ""
    echo "Verifying restore:"
    echo "-----------------"
    
    CLIENTS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM clients" 2>/dev/null)
    INVOICES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM invoices" 2>/dev/null)
    ITEMS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM invoice_items" 2>/dev/null)
    
    echo "  Clients:        ${CLIENTS_COUNT// /}"
    echo "  Invoices:       ${INVOICES_COUNT// /}"
    echo "  Invoice Items:  ${ITEMS_COUNT// /}"
    
    echo ""
    echo -e "${GREEN}Database restore completed successfully!${NC}"
    
else
    echo -e "${RED}Failed${NC}"
    echo -e "${RED}Error: Restore failed${NC}"
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# Clean up temporary file
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

echo ""
echo "Next steps:"
echo "----------"
echo "1. Update your .env.local file with the new database connection details"
echo "2. Test your application connection to the restored database"
echo "3. Verify that all data has been restored correctly"