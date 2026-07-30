# PM2 Commands Reference

This document explains how to manage your PM2 processes directly from the terminal.

## Basic Commands

### List All Processes

```bash
pm2 list
```

Shows all running processes with their status, CPU usage, memory usage, and uptime.

### Start a Project

```bash
# Start from ecosystem file
pm2 start ecosystem.config.js --only "ProjectName"

# Start all projects in ecosystem
pm2 start ecosystem.config.js

# Start a single script directly
pm2 start /path/to/script.js --name "ProjectName"
```

### Stop a Project

```bash
pm2 stop "ProjectName"
```

### Restart a Project

```bash
pm2 restart "ProjectName"
```

### Delete a Process

```bash
pm2 delete "ProjectName"
```

### View Logs

```bash
# View logs for a specific project
pm2 logs "ProjectName"

# View last 100 lines
pm2 logs "ProjectName" --lines 100

# View logs without streaming
pm2 logs "ProjectName" --nostream
```

## Process Information

### Detailed Process Info

```bash
pm2 show "ProjectName"
```

### Monitor Processes

```bash
pm2 monit
```

Real-time monitoring dashboard showing CPU, memory, and logs.

## Ecosystem Management

### Start All Projects

```bash
pm2 start ecosystem.config.js
```

### Stop All Projects

```bash
pm2 stop all
```

### Restart All Projects

```bash
pm2 restart all
```

### Delete All Processes

```bash
pm2 delete all
```

## Startup & Persistence

### Save Current Process List

```bash
pm2 save
```

Saves the current process list so it can be restored after system reboot.

### Restore Saved Processes

```bash
pm2 resurrect
```

### Configure Startup Script

```bash
# Generate startup script
pm2 startup

# Follow the instructions shown
```

## Process States

| State      | Description                                      |
|------------|--------------------------------------------------|
| `online`   | Process is running normally                      |
| `stopped`  | Process has been stopped                         |
| `errored`  | Process has crashed or encountered an error      |
| `launching`| Process is starting up                           |
| `not_found`| Process does not exist in PM2                    |

## Common Options

### Memory Restart

Automatically restart process if memory exceeds limit:

```bash
pm2 start app.js --max-memory-restart 500M
```

### Watch Mode

Automatically restart on file changes:

```bash
pm2 start app.js --watch
```

### Cluster Mode

Run multiple instances:

```bash
pm2 start app.js -i max  # Use all CPU cores
pm2 start app.js -i 4    # Use 4 instances
```

### Environment Variables

```bash
pm2 start app.js --env production
```

## Ecosystem File Example

```javascript
module.exports = {
  apps: [
    {
      name: "my-app",
      script: "./app.js",
      cwd: "/path/to/app",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
```

## Troubleshooting

### Process Keeps Restarting

Check logs for errors:

```bash
pm2 logs "ProjectName" --lines 50
```

### Process Won't Start

1. Verify the script path is correct
2. Check if the script runs manually: `node /path/to/script.js`
3. Check file permissions

### High Memory Usage

Set memory limit and enable auto-restart:

```bash
pm2 start app.js --max-memory-restart 500M
```

### Clear All Logs

```bash
pm2 flush
```
