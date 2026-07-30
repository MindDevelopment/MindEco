# Troubleshooting

Common issues and solutions when using MindEco.

## MindEco Issues

### Command Not Found

**Problem:** `eco` or `node eco.js` command not found.

**Solution:**
1. Make sure you're in the correct directory:
   ```bash
   cd /path/to/MindEco
   node eco.js
   ```

2. If using the linked command, verify the link:
   ```bash
   which eco
   ```

3. Re-link if necessary:
   ```bash
   npm link
   ```

### Permission Denied

**Problem:** Permission denied when running eco.js.

**Solution:**
```bash
chmod +x /path/to/MindEco/eco.js
```

### Display Issues

**Problem:** Dashboard looks broken or misaligned.

**Solution:**
1. Ensure your terminal supports Unicode characters
2. Use a monospace font
3. Increase terminal width (minimum 80 columns recommended)
4. Use a terminal with proper ANSI color support

### Blank Screen

**Problem:** Nothing appears when running eco.js.

**Solution:**
1. Check if Node.js is installed:
   ```bash
   node --version
   ```

2. Run with verbose output:
   ```bash
   node --trace-warnings eco.js
   ```

## PM2 Issues

### PM2 Not Found

**Problem:** PM2 command not found.

**Solution:**
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Process Won't Start

**Problem:** Project won't start via PM2.

**Solution:**
1. Test the script manually:
   ```bash
   node /path/to/your/script.js
   ```

2. Check if the file exists:
   ```bash
   ls -la /path/to/your/script.js
   ```

3. Check PM2 logs:
   ```bash
   pm2 logs "ProjectName"
   ```

### Process Keeps Restarting

**Problem:** Process continuously restarts.

**Solution:**
1. Check logs for errors:
   ```bash
   pm2 logs "ProjectName" --lines 50
   ```

2. Check if port is already in use:
   ```bash
   lsof -i :3000
   ```

3. Set memory limit:
   ```bash
   pm2 start ecosystem.config.js --only "ProjectName" --max-memory-restart 500M
   ```

### Process Shows as Errored

**Problem:** Process status shows "errored".

**Solution:**
1. View detailed error:
   ```bash
   pm2 show "ProjectName"
   ```

2. Check logs:
   ```bash
   pm2 logs "ProjectName"
   ```

3. Common causes:
   - Missing dependencies: `npm install`
   - Wrong file path
   - Syntax errors in code
   - Missing environment variables

### Cannot Stop Process

**Problem:** PM2 stop command doesn't work.

**Solution:**
```bash
# Force kill
pm2 kill

# Then restart PM2 daemon
pm2 resurrect
```

## Database Connection Issues

### Access Denied for User

**Problem:** `Access denied for user ''@'localhost'`

**Solution:**
1. Check if `.env` file exists in your project
2. Verify database credentials in `.env`
3. Ensure `dotenv` is installed:
   ```bash
   npm install dotenv
   ```
4. Add to the top of your entry script:
   ```javascript
   require('dotenv').config();
   ```

### Connection Timeout

**Problem:** Database connection timeout.

**Solution:**
1. Verify database server is running
2. Check database host and port
3. Verify firewall settings
4. Test connection manually

### Pool Connection Limit

**Problem:** `pool failed to retrieve a connection from pool`

**Solution:**
1. Check database connection pool settings
2. Ensure connections are properly closed
3. Increase pool size if needed
4. Restart the database service

## Ecosystem File Issues

### File Not Found

**Problem:** Ecosystem config file not found.

**Solution:**
1. Check if file exists:
   ```bash
   ls -la ~/ecosystem.config.js
   ```

2. Create empty config:
   ```bash
   echo 'module.exports = { apps: [] };' > ~/ecosystem.config.js
   ```

### Invalid Configuration

**Problem:** PM2 reports invalid configuration.

**Solution:**
1. Check syntax:
   ```bash
   node -c ~/ecosystem.config.js
   ```

2. Validate JavaScript:
   ```bash
   node -e "require('~/ecosystem.config.js')"
   ```

3. Restore from backup:
   ```bash
   cp ~/.eco_backups/ecosystem_latest.js ~/ecosystem.config.js
   ```

## Backup Issues

### No Backups Found

**Problem:** No backups available to restore.

**Solution:**
1. Check backup directory:
   ```bash
   ls -la ~/.eco_backups/
   ```

2. Create a backup first:
   ```bash
   cp ~/ecosystem.config.js ~/.eco_backups/ecosystem_manual.js
   ```

### Backup Restore Failed

**Problem:** Cannot restore backup.

**Solution:**
1. Verify backup file exists:
   ```bash
   ls -la ~/.eco_backups/
   ```

2. Check backup file syntax:
   ```bash
   node -c ~/.eco_backups/ecosystem_backup.js
   ```

3. Manually copy:
   ```bash
   cp ~/.eco_backups/ecosystem_backup.js ~/ecosystem.config.js
   ```

## Getting Help

If you encounter issues not covered here:

1. Check PM2 documentation: https://pm2.keymetrics.io/
2. Check Node.js documentation: https://nodejs.org/
3. Open an issue on GitHub
4. Contact MindDevelopment support
