# Database Backup and Restore

This directory contains scripts for backing up and restoring your Invoice Management database.

## Files

- `backup.sh` - Creates database backups
- `restore.sh` - Restores database backups  
- `production_schema.sql` - Complete schema for fresh production setup

## Creating a Backup

### Basic Usage
```bash
cd database
./backup.sh
```

The backup script will:
- Read database connection details from `../.env.local` if available
- Create a timestamped backup file in `./backups/` directory
- Generate both plain SQL and compressed (.gz) versions
- Create `latest_backup.sql` symlink for easy access
- Show statistics about the backed up data

### Backup Location
Backups are stored in `database/backups/` with the naming format:
- `backup_invoice_management_YYYYMMDD_HHMMSS.sql`
- `backup_invoice_management_YYYYMMDD_HHMMSS.sql.gz` (compressed)

## Restoring a Backup

### Basic Usage
```bash
cd database
./restore.sh backups/backup_invoice_management_20240110_143022.sql
```

### Advanced Usage
```bash
# Restore to a different server
./restore.sh backups/latest_backup.sql.gz \
  --host production-server.com \
  --port 5432 \
  --user postgres \
  --dbname invoice_production \
  --force

# Restore with custom settings
./restore.sh backups/backup.sql \
  --host localhost \
  --port 5433 \
  --user myuser \
  --dbname invoice_management
```

### Restore Options
- `--host HOST` - Database host (default: localhost)
- `--port PORT` - Database port (default: 5432)
- `--user USER` - Database user (default: postgres)  
- `--dbname DBNAME` - Target database name (default: invoice_management)
- `--password PASSWORD` - Database password (will prompt if not provided)
- `--force` - Skip confirmation prompts
- `-h, --help` - Show help message

## Environment Variables

Both scripts read from `../.env.local` if present:
```bash
DB_HOST=localhost
DB_PORT=5433
DB_NAME=invoice_management
DB_USER=warrenwiens
DB_PASSWORD=your_password
```

## Setting Up a New Production Database

### Option 1: Use Schema + Seed Data
```bash
# Create empty database with structure
psql -h your-server -U postgres -d postgres -c "CREATE DATABASE invoice_management;"

# Apply schema
psql -h your-server -U postgres -d invoice_management -f production_schema.sql

# Optional: Add seed data
psql -h your-server -U postgres -d invoice_management -f seed.sql
```

### Option 2: Restore from Backup
```bash
# Restore complete database from backup
./restore.sh backups/latest_backup.sql \
  --host your-server \
  --user postgres \
  --dbname invoice_management
```

## Backup Best Practices

1. **Regular Backups**: Set up a cron job to run backups automatically:
   ```bash
   # Add to crontab (daily backup at 2 AM)
   0 2 * * * cd /path/to/invoice-management/database && ./backup.sh
   ```

2. **Off-site Storage**: Copy backups to cloud storage or remote servers:
   ```bash
   # Example: Upload to S3 after backup
   aws s3 cp database/backups/latest_backup.sql.gz s3://your-backup-bucket/
   ```

3. **Test Restores**: Regularly test your backup files by restoring to a test environment.

4. **Retention Policy**: Keep multiple backup versions and clean up old ones:
   ```bash
   # Keep last 30 days of backups
   find database/backups/ -name "backup_*.sql" -mtime +30 -delete
   ```

## Troubleshooting

### Connection Issues
- Verify database server is running
- Check firewall settings for database port
- Ensure user has proper permissions
- Verify connection parameters in .env.local

### Permission Errors
```bash
# Grant necessary permissions to database user
GRANT ALL PRIVILEGES ON DATABASE invoice_management TO your_user;
GRANT ALL ON SCHEMA public TO your_user;
```

### Large Database Restores
For large databases, consider:
- Using `--jobs` flag with pg_restore for parallel restoration
- Temporarily increasing database memory settings
- Monitoring disk space during restore

### Compressed Backup Issues
If you get compression/decompression errors:
- Ensure `gzip` is installed on both backup and restore systems
- Use uncompressed `.sql` files if `gzip` is not available