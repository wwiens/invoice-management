#!/bin/bash

# Database setup script for Noventix Invoice Management
# Make sure your PostgreSQL Docker container is running first

# Load environment variables
if [ -f ../.env.local ]; then
    export $(cat ../.env.local | grep -v '^#' | xargs)
fi

# Default values if not in env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_NAME=${DB_NAME:-invoice_management}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

echo "Setting up database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"

# Set PGPASSWORD for non-interactive mode
export PGPASSWORD=$DB_PASSWORD

# Check if database exists, create if it doesn't
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
    echo "Creating database $DB_NAME..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
}

# Run schema creation
echo "Creating database schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f schema.sql

# Run seed data
echo "Inserting seed data..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed.sql

echo "Database setup complete!"
echo ""
echo "To connect to your database:"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"