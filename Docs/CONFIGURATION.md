# Configuration

This document explains how MindEco stores and manages configuration files.

## Configuration File Location

MindEco uses the standard PM2 ecosystem configuration file:

```
~/ecosystem.config.js
```

This file is automatically created when you first run MindEco or add a project.

## Backup Location

Backups are stored in:

```
~/.eco_backups/
```

Each backup is timestamped with the format: `ecosystem_YYYY-MM-DD_HH-mm-ss.js`

## Ecosystem File Structure

The ecosystem file follows the standard PM2 format:

```javascript
module.exports = {
  apps: [
    {
      name: "ProjectName",
      script: "/full/path/to/script.js",
      cwd: "/full/path/to/project/directory"
    },
    // ... more projects
  ]
};
```

### Project Properties

| Property   | Type   | Description                              |
|------------|--------|------------------------------------------|
| `name`     | String | Unique project identifier                |
| `script`   | String | Full path to the entry script            |
| `cwd`      | String | Working directory for the project        |
| `instances`| Number | Number of instances to run               |
| `exec_mode`| String | Execution mode: `fork` or `cluster`      |
| `watch`    | Boolean| Auto-restart on file changes             |
| `autorestart` | Boolean | Auto-restart on crash                |
| `max_memory_restart` | String | Memory limit (e.g., `500M`)   |

## Default Entry Script Detection

When adding a project, MindEco scans for entry scripts in this order:

1. `index.js`
2. `server.js`
3. `app.js`
4. `main.js`
5. `main` field in `package.json`

## Environment Variables

To use environment variables with your projects, add `dotenv` to your project:

```bash
cd /path/to/your/project
npm install dotenv
```

Then add at the top of your entry script:

```javascript
require('dotenv').config();
```

Create a `.env` file in your project root:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=mydb
PORT=3000
```

MindEco will automatically detect `.env` files and configure PM2 to load them using `--require dotenv/config`.

## Manual Configuration

You can manually edit the ecosystem file:

```bash
nano ~/ecosystem.config.js
```

After editing, restart PM2 to apply changes:

```bash
pm2 restart all
```

## Backup Management

### Create Backup

Using MindEco:
1. Run `node eco.js`
2. Select option `5` (Create backup)

Using command line:
```bash
cp ~/ecosystem.config.js ~/.eco_backups/ecosystem_$(date +%Y-%m-%d_%H-%M-%S).js
```

### Restore Backup

Using MindEco:
1. Run `node eco.js`
2. Select option `6` (Restore backup)
3. Choose the backup to restore

Using command line:
```bash
cp ~/.eco_backups/ecosystem_YYYY-MM-DD_HH-mm-ss.js ~/ecosystem.config.js
pm2 restart all
```

### List Backups

```bash
ls -la ~/.eco_backups/
```

## File Permissions

Ensure proper permissions:

```bash
# Make ecosystem file readable
chmod 644 ~/ecosystem.config.js

# Make backup directory accessible
chmod 755 ~/.eco_backups/
```
