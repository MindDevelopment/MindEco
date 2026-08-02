# MindEco

<p align="center">
  <strong>Terminal-based PM2 Ecosystem Manager</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/node-%3E%3D10-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License">
  <img src="https://img.shields.io/badge/dependencies-zero-brightgreen.svg" alt="Zero Dependencies">
</p>

---

MindEco is an interactive terminal UI (TUI) for managing PM2 ecosystems. It provides a visual dashboard to add, delete, and monitor your PM2-managed Node.js projects — all from a single command.

## Features

- **Interactive Dashboard** — Real-time overview of all projects with status indicators
- **Project Management** — Add and delete projects from the ecosystem
- **Auto-Detection** — Automatically detects entry scripts and project names from `package.json`
- **File Browser** — Built-in folder navigator for easy project selection
- **Log Viewer** — View project logs directly in the terminal
- **Backup & Restore** — Create and restore ecosystem configuration backups
- **Zero Dependencies** — Uses only Node.js built-in modules
- **Single File** — Entire application in one portable `eco.js` file

## Prerequisites

- [Node.js](https://nodejs.org/) (version 10 or higher)
- [PM2](https://pm2.keymetrics.io/) installed globally

```bash
npm install -g pm2
```

## Installation

Clone the repository and make the script executable:

```bash
git clone https://github.com/MindDevelopment/MindEco.git
cd MindEco
chmod +x eco.js
```

Optionally, create a global symlink (see [Docs/LINKING.md](Docs/LINKING.md) for more options):

```bash
npm link
```

## Usage

Run MindEco directly:

```bash
node eco.js
```

Or if linked globally:

```bash
eco
```

### Menu Options

| Key | Action              | Description                                    |
|-----|---------------------|------------------------------------------------|
| `1` | Add project         | Add a new project to the ecosystem             |
| `2` | View logs           | Display recent logs for a project              |
| `3` | Delete project      | Remove a project from the ecosystem            |
| `4` | View projects       | Show detailed project overview                 |
| `5` | Create backup       | Backup the current ecosystem configuration     |
| `6` | Restore backup      | Restore a previous ecosystem configuration     |
| `0` | Exit                | Close MindEco                                  |

### PM2 Commands

For starting, stopping, and restarting projects, use PM2 directly:

```bash
# Start a project
pm2 start ecosystem.config.js --only "ProjectName"

# Stop a project
pm2 stop "ProjectName"

# Restart a project
pm2 restart "ProjectName"

# View all processes
pm2 list
```

## Configuration

MindEco stores its configuration in `~/ecosystem.config.js` — the standard PM2 ecosystem file format. Backups are stored in `~/.eco_backups/`.

### Default Project Detection

When adding a project, MindEco automatically scans for entry scripts in this order:

1. `index.js`
2. `server.js`
3. `app.js`
4. `main.js`
5. `main` field in `package.json`

## File Structure

```
MindEco/
├── eco.js          # Main application (single file)
├── README.md       # This file
└── Docs/           # Documentation
    ├── LINKING.md         # How to link eco globally
    ├── PM2.md             # PM2 command reference
    ├── CONFIGURATION.md   # Configuration guide
    ├── TROUBLESHOOTING.md # Common issues & solutions
    └── CONTRIBUTING.md    # Contribution guidelines
```

## Documentation

| Document | Description |
|----------|-------------|
| [LINKING.md](Docs/LINKING.md) | How to make `eco` command available globally via npm link, symlink, alias, or PATH |
| [PM2.md](Docs/PM2.md) | Complete PM2 command reference for starting, stopping, and managing processes |
| [CONFIGURATION.md](Docs/CONFIGURATION.md) | Configuration files, backups, environment variables, and project settings |
| [TROUBLESHOOTING.md](Docs/TROUBLESHOOTING.md) | Common issues and solutions for MindEco, PM2, and database connections |
| [CONTRIBUTING.md](Docs/CONTRIBUTING.md) | Guidelines for contributing to the project, code style, and pull request process |

## How It Works

MindEco operates as a lightweight wrapper around PM2:

- **Reading/Writing** — Manages `ecosystem.config.js` using Node.js `require()` (no `eval`)
- **Status Monitoring** — Queries PM2 via `pm2 jlist` for real-time process data
- **Terminal UI** — Renders dashboard using ANSI escape codes and Unicode box-drawing characters

## Author

**MindDevelopment**

---

<p align="center">
  <sub>Built with Node.js and a love for clean terminal interfaces.</sub>
</p>
