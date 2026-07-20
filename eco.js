#!/usr/bin/env node
'use strict';

/*
================================================================
 ECO PROJECT MANAGER 
 Author: MindDevelopment
  PM2 ecosystem manager with full CLI interface
================================================================
*/

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const readline = require('readline');
const { exec, spawn } = require('child_process');

// ─── CONFIG ────────────────────────────────────────────────
const HOME = os.homedir();
const CONFIG = {
    VERSION:          '1.0.0',
    HOME,
    PROJECTS:         path.join(HOME, 'Projects'),
    ECOSYSTEM_FILE:   path.join(HOME, 'ecosystem.config.js'),
    BACKUP_DIR:       path.join(HOME, '.eco_backups'),
    DEFAULT_ENTRIES:  ['index.js', 'server.js', 'app.js', 'main.js'],
    MAX_NAME_LENGTH:  30,
    LOGS_LINES:       30,
};

// ─── KLEUREN ───────────────────────────────────────────────
const rgb = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;

const C = {
    reset:      '\x1b[0m',
    bold:       '\x1b[1m',
    dim:        '\x1b[2m',
    italic:     '\x1b[3m',
    underline:  '\x1b[4m',
    red:        '\x1b[31m',
    green:      '\x1b[32m',
    yellow:     '\x1b[33m',
    blue:       '\x1b[34m',
    magenta:    '\x1b[35m',
    cyan:       '\x1b[36m',
    white:      '\x1b[37m',
    gray:       '\x1b[90m',
};

const THEME = {
    primary:    rgb(255, 100, 80),
    secondary:  rgb(255, 180, 140),
    success:    rgb(100, 255, 130),
    danger:     rgb(255, 80, 90),
    info:       rgb(80, 190, 255),
    warning:    rgb(255, 210, 90),
    border:     rgb(255, 120, 90),
    highlight:  rgb(255, 220, 180),
    muted:      rgb(160, 100, 80),
    online:     rgb(80, 255, 120),
    stopped:    rgb(255, 180, 80),
    errored:    rgb(255, 60, 60),
};

// ─── READLINE ──────────────────────────────────────────────
const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
});

function ask(q) {
    return new Promise(resolve => rl.question(q, answer => resolve(answer)));
}

// ─── HELPERS ───────────────────────────────────────────────
const repeat = (c, n) => n > 0 ? c.repeat(Math.max(0, n)) : '';

function getTerminalWidth() {
    return process.stdout.columns || 80;
}

async function pause() {
    await ask(`${THEME.muted}  Press ENTER to continue...${C.reset}`);
}

function error(text) {
    return `${THEME.danger}${C.bold}✖${C.reset} ${THEME.danger}${text}${C.reset}`;
}

function success(text) {
    return `${THEME.success}${C.bold}✔${C.reset} ${THEME.success}${text}${C.reset}`;
}

function warn(text) {
    return `${THEME.warning}${C.bold}⚠${C.reset} ${THEME.warning}${text}${C.reset}`;
}

function info(text) {
    return `${THEME.info}${C.bold}ℹ${C.reset} ${THEME.info}${text}${C.reset}`;
}

// Visual length - strip ANSI codes, handle wide chars
function vlen(str) {
    const clean = str.replace(/\x1b\[[0-9;]*m/g, '');
    let len = 0;
    for (const ch of clean) {
        const code = ch.codePointAt(0);
        if ((code >= 0x1100 && code <= 0x115F) || (code >= 0x2E80 && code <= 0x9FFF) ||
            (code >= 0xAC00 && code <= 0xD7AF) || (code >= 0xF900 && code <= 0xFAFF) ||
            (code >= 0xFE10 && code <= 0xFE6F) || (code >= 0xFF01 && code <= 0xFF60) ||
            (code >= 0xFFE0 && code <= 0xFFE6) || code >= 0x20000) {
            len += 2;
        } else {
            len += 1;
        }
    }
    return len;
}

function padRight(str, width) {
    const diff = width - vlen(str);
    return diff > 0 ? str + ' '.repeat(diff) : str;
}

function truncate(str, max) {
    const clean = str.replace(/\x1b\[[0-9;]*m/g, '');
    if (clean.length <= max) return str;
    return clean.substring(0, max - 1) + '…';
}

// ─── BOX ENGINE ────────────────────────────────────────────
const B = {
    tl: '╔', tr: '╗', bl: '╚', br: '╝',
    h: '═', v: '║',
    lm: '╠', rm: '╣',
    sl: '╒', sr: '╕', bl2: '╘', br2: '╛',
};

function boxify(lines, opts = {}) {
    const {
        title,
        titleColor = THEME.secondary,
        borderColor = THEME.border,
        padding = 1,
        minWidth = 0,
    } = opts;

    const bc = borderColor;
    const screenWidth = getTerminalWidth();
    const maxWidth = screenWidth - 4;
    const visualWidth = Math.min(maxWidth, Math.max(minWidth, lines.reduce((max, l) => Math.max(max, vlen(l)), 0)));
    const inner = visualWidth + padding * 2;
    const result = [];

    // Top border
    if (lines.length === 0) {
        result.push(`${bc}${B.tl}${B.h}${B.tr}${C.reset}`);
    } else {
        result.push(`${bc}${B.tl}${repeat(B.h, inner)}${B.tr}${C.reset}`);
    }

    // Title row
    if (title) {
        const titleText = ` ${title} `;
        const titleLen = vlen(titleText);
        const left = Math.max(0, Math.floor((inner - titleLen) / 2));
        const right = Math.max(0, inner - titleLen - left);
        result.push(`${bc}${B.v}${C.reset}${' '.repeat(left)}${titleColor}${C.bold}${titleText}${C.reset}${' '.repeat(right)}${bc}${B.v}${C.reset}`);
        result.push(`${bc}${B.lm}${repeat(B.h, inner)}${B.rm}${C.reset}`);
    }

    // Content lines
    for (const line of lines) {
        const padded = padRight(line, inner - padding);
        result.push(`${bc}${B.v}${C.reset}${' '.repeat(padding)}${padded}${bc}${B.v}${C.reset}`);
    }

    // Bottom border
    result.push(`${bc}${B.bl}${repeat(B.h, inner)}${B.br}${C.reset}`);
    return result.join('\n');
}

// ─── DASHBOARD RENDER HELPERS ──────────────────────────────
function boxTop(width, bc) {
    return `${bc}╔${repeat('═', width)}╗${C.reset}`;
}
function boxBottom(width, bc) {
    return `${bc}╚${repeat('═', width)}╝${C.reset}`;
}
function sepFull(width, bc) {
    return `${bc}╠${repeat('═', width)}╣${C.reset}`;
}
function sepCols(colWidths, bc, type) {
    const mid = type === 'top' ? '╦' : type === 'mid' ? '╬' : '╩';
    let line = bc + '╠';
    for (let i = 0; i < colWidths.length; i++) {
        line += repeat('═', colWidths[i]);
        if (i < colWidths.length - 1) line += mid;
    }
    line += '╣' + C.reset;
    return line;
}
function fullRow(content, width, bc) {
    return `${bc}║${C.reset} ${padRight(content, width - 2)} ${bc}║${C.reset}`;
}
function colRow(contents, colWidths, bc) {
    let line = `${bc}║${C.reset}`;
    for (let i = 0; i < contents.length; i++) {
        if (i > 0) line += `${bc}║${C.reset}`;
        line += ` ${padRight(contents[i], colWidths[i] - 1)}`;
    }
    line += `${bc}║${C.reset}`;
    return line;
}

// ─── LOGO ──────────────────────────────────────────────────
function getLogoLines() {
    const screenWidth = getTerminalWidth();
    if (screenWidth < 70) {
        return [];
    }
    return [
    `${rgb(255, 8, 68)}███╗   ███╗ ██╗ ███╗   ██╗ ██████╗         ███████╗  ██████╗  ██████╗ ${C.reset}`,
    `${rgb(255, 42, 85)}████╗ ████║ ██║ ████╗  ██║ ██╔══██╗        ██╔════╝ ██╔════╝ ██╔═══██╗${C.reset}`,
    `${rgb(255, 76, 102)}██╔████╔██║ ██║ ██╔██╗ ██║ ██║  ██║ █████╗ █████╗   ██║      ██║   ██║${C.reset}`,
    `${rgb(255, 109, 119)}██║╚██╔╝██║ ██║ ██║╚██╗██║ ██║  ██║ ╚════╝ ██╔══╝   ██║      ██║   ██║${C.reset}`,
    `${rgb(255, 143, 136)}██║ ╚═╝ ██║ ██║ ██║ ╚████║ ██████╔╝        ███████╗ ╚██████╗ ╚██████╔╝${C.reset}`,
    `${rgb(102, 71, 61)}╚═╝     ╚═╝ ╚═╝ ╚═╝  ╚═══╝ ╚═════╝         ╚══════╝  ╚═════╝  ╚═════╝ ${C.reset}`,
    ];
}

// ─── ECOSYSTEM MANAGER ─────────────────────────────────────
// Veilig: gebruikt require() ipv eval()
function readEcosystem() {
    const f = CONFIG.ECOSYSTEM_FILE;
    if (!fs.existsSync(f)) return { apps: [] };
    try {
        delete require.cache[require.resolve(f)];
        const config = require(f);
        if (config && Array.isArray(config.apps)) return config;
        return { apps: [] };
    } catch (e) {
        return { apps: [] };
    }
}

function writeEcosystem(config) {
    const f = CONFIG.ECOSYSTEM_FILE;
    if (!fs.existsSync(path.dirname(f))) {
        fs.mkdirSync(path.dirname(f), { recursive: true });
    }
    const lines = ['module.exports = {', '  apps: ['];
    config.apps.forEach((app, i) => {
        const isLast = i === config.apps.length - 1;
        const entries = [];
        for (const [key, value] of Object.entries(app)) {
            entries.push([key, value]);
        }
        // Sort: name first, script second, rest alphabetical
        const nameIdx = entries.findIndex(e => e[0] === 'name');
        const scriptIdx = entries.findIndex(e => e[0] === 'script');
        const sorted = [];
        if (nameIdx >= 0) sorted.push(entries.splice(nameIdx, 1)[0]);
        else sorted.push(['name', '']);
        if (scriptIdx >= 0) sorted.push(entries.splice(Math.max(0, scriptIdx - (nameIdx >= 0 ? 1 : 0)), 1)[0]);
        else sorted.push(['script', '']);
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        sorted.push(...entries);

        const objLines = [];
        for (const [key, value] of sorted) {
            if (key === 'name' && !value) continue;
            if (key === 'script' && !value) continue;
            objLines.push(`      ${key}: ${formatValue(value)}`);
        }
        lines.push('    {');
        lines.push(objLines.join(',\n'));
        lines.push('    }' + (isLast ? '' : ','));
    });
    lines.push('  ]');
    lines.push('};');
    fs.writeFileSync(f, lines.join('\n') + '\n', 'utf-8');
}

function formatValue(val) {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'string') {
        // Prefer single quotes for paths with no special chars, double for others
        if (val.includes("'") || val.includes('\\') || val.includes('\n')) {
            return JSON.stringify(val);
        }
        if (val.includes('/') || val.includes(' ') || val.includes('-')) {
            return `'${val}'`;
        }
        return JSON.stringify(val);
    }
    if (typeof val === 'boolean' || typeof val === 'number') return String(val);
    if (Array.isArray(val)) return JSON.stringify(val);
    if (typeof val === 'object') {
        return JSON.stringify(val, null, 8).replace(/\n\s+/g, ' ').replace(/\n/g, '');
    }
    return String(val);
}

function backupEcosystem() {
    const f = CONFIG.ECOSYSTEM_FILE;
    if (!fs.existsSync(f)) return false;
    const dir = CONFIG.BACKUP_DIR;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const dest = path.join(dir, `ecosystem_${stamp}.js`);
    fs.copyFileSync(f, dest);
    return dest;
}

function restoreEcosystemFrom(filepath) {
    if (!fs.existsSync(filepath)) return false;
    fs.copyFileSync(filepath, CONFIG.ECOSYSTEM_FILE);
    return true;
}

function listBackups() {
    const dir = CONFIG.BACKUP_DIR;
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => f.startsWith('ecosystem_') && f.endsWith('.js'))
        .sort()
        .reverse();
}

// ─── PM2 SERVICE ──────────────────────────────────────────
async function pm2Exec(args, options = {}) {
    return new Promise((resolve, reject) => {
        const cmd = `pm2 ${args}`;
        exec(cmd, { maxBuffer: 10 * 1024 * 1024, ...options }, (err, stdout, stderr) => {
            if (err && !options.ignoreError) {
                reject(new Error(stderr || err.message));
            } else {
                resolve((stdout || '').trim());
            }
        });
    });
}

async function pm2Spawn(args, msg = '') {
    return new Promise((resolve, reject) => {
        const child = spawn('pm2', args.split(/\s+/).filter(Boolean), {
            stdio: ['inherit', 'pipe', 'pipe'],
            shell: false,
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', data => {
            stdout += data.toString();
            process.stdout.write(data);
        });
        child.stderr.on('data', data => {
            stderr += data.toString();
            process.stderr.write(data);
        });
        child.on('close', code => {
            resolve({ ok: code === 0, stdout, stderr, code });
        });
        child.on('error', err => reject(err));
    });
}

// Krijg PM2 status voor alle projecten
async function getPm2Status() {
    try {
        const output = await pm2Exec('jlist', { ignoreError: true });
        if (!output) return {};
        const processes = JSON.parse(output);
        const status = {};
        for (const proc of processes) {
            status[proc.name] = {
                status: proc.pm2_env?.status || 'unknown',
                cpu: proc.monit?.cpu || 0,
                memory: proc.monit?.memory || 0,
                uptime: proc.pm2_env?.pm_uptime ? formatUptime(Date.now() - proc.pm2_env.pm_uptime) : '—',
                restarts: proc.pm2_env?.unstable_restarts || 0,
                pid: proc.pid || 0,
            };
        }
        return status;
    } catch {
        return {};
    }
}

function formatUptime(ms) {
    if (ms < 1000) return '0s';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ${sec % 60}s`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}u ${min % 60}m`;
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}u`;
}

function formatMemory(bytes) {
    if (!bytes || bytes < 1024) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(mb * 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
}

async function getProjectLogs(appName) {
    try {
        const output = await pm2Exec(`logs ${appName} --lines ${CONFIG.LOGS_LINES} --nostream --raw`, { ignoreError: true });
        return output || 'No logs found.';
    } catch {
        return 'Could not retrieve logs.';
    }
}

// ─── PROJECT MODEL ─────────────────────────────────────────
class Project {
    constructor(data = {}) {
        this.name   = data.name || '';
        this.script = data.script || '';
        this.cwd    = data.cwd || '';
        this.options = {};
        for (const [k, v] of Object.entries(data)) {
            if (k === 'name' || k === 'script' || k === 'cwd') continue;
            this.options[k] = v;
        }
    }

    toObject() {
        return {
            name:   this.name,
            script: this.script,
            cwd:    this.cwd,
            ...this.options,
        };
    }

    async _execPm2(pm2Cmd) {
        try {
            const result = await pm2Spawn(pm2Cmd);
            return result;
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    async start()    { return this._execPm2(`start ${CONFIG.ECOSYSTEM_FILE} --only "${this.name}"`); }
    async stop()     { return this._execPm2(`stop "${this.name}"`); }
    async restart()  { return this._execPm2(`restart "${this.name}"`); }
    async delete()   { return this._execPm2(`delete "${this.name}"`); }

    async logs() {
        return await getProjectLogs(this.name);
    }

    static statusIcon(status) {
        switch (status) {
            case 'online':   return `${THEME.online}●${C.reset}`;
            case 'stopped':  return `${THEME.stopped}●${C.reset}`;
            case 'errored':  return `${THEME.danger}●${C.reset}`;
            case 'launching':return `${THEME.warning}◐${C.reset}`;
            case 'not_found':return `${THEME.muted}○${C.reset}`;
            default:         return `${THEME.muted}○${C.reset}`;
        }
    }
}

// ─── PROJECT DETECTIE ─────────────────────────────────────
function detectProjectScript(dirPath) {
    if (!fs.existsSync(dirPath)) return null;
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return null;

    for (const candidate of CONFIG.DEFAULT_ENTRIES) {
        const full = path.join(dirPath, candidate);
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
            return {
                script: full,
                cwd: dirPath,
            };
        }
    }
    // Check if directory itself contains package.json with main field
    const pkgJson = path.join(dirPath, 'package.json');
    if (fs.existsSync(pkgJson)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
            if (pkg.main && fs.existsSync(path.join(dirPath, pkg.main))) {
                return {
                    script: path.join(dirPath, pkg.main),
                    cwd: dirPath,
                };
            }
        } catch {}
    }
    return null;
}

function detectProjectName(dirPath, defaultName) {
    const pkgJson = path.join(dirPath, 'package.json');
    if (fs.existsSync(pkgJson)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
            if (pkg.name) return pkg.name.slice(0, CONFIG.MAX_NAME_LENGTH);
        } catch {}
    }
    // Fallback: use directory name
    const dirName = path.basename(dirPath);
    if (dirName && dirName !== '.' && dirName !== '..') return dirName;
    return defaultName || 'project';
}

// ─── FILE BROWSER ──────────────────────────────────────────
async function browseFolder(startPath) {
    let currentPath = startPath || CONFIG.PROJECTS;
    // Fallback: als startpad niet bestaat, probeer HOME
    try { fs.accessSync(currentPath); } catch { currentPath = HOME; }
    while (true) {
        let entries;
        try {
            entries = fs.readdirSync(currentPath, { withFileTypes: true });
        } catch {
            console.log(`\n  ${error('Cannot read folder: ' + currentPath)}`);
            await pause();
            return null;
        }

        const dirs = entries
            .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
            .sort((a, b) => a.name.localeCompare(b.name));

        const itemMap = {};
        const lines = [];

        lines.push(`${C.dim}Current folder:${C.reset} ${C.green}${currentPath}${C.reset}`);
        lines.push('');

        // Back option
        lines.push(`${C.bold}[ .. ]${C.reset}  ${C.yellow}Go back (parent folder)${C.reset}`);

        dirs.forEach((d, i) => {
            const key = i + 1;
            itemMap[key] = { path: path.join(currentPath, d.name), isDir: true };

            // Check for project indicators
            const full = path.join(currentPath, d.name);
            let indicator = '';
            try {
                if (fs.existsSync(path.join(full, 'package.json'))) indicator = ` ${THEME.info}📦${C.reset}`;
                if (fs.existsSync(path.join(full, 'ecosystem.config.js'))) indicator += ` ${THEME.warning}⚙${C.reset}`;
            } catch {}

            const label = `${C.cyan}${String(key).padStart(2, ' ')}.${C.reset}  ${C.bold}📁 ${d.name}/${C.reset}${indicator}`;
            const isDetected = detectProjectScript(full);
            if (isDetected) {
                lines.push(`${label}  ${THEME.success}✓${C.reset}`);
            } else {
                lines.push(label);
            }
        });

        lines.push('');
        lines.push(`${C.dim}[s] Select current folder  [h] Home  [q] Cancel  [1-${Math.min(99, dirs.length)}] Navigate${C.reset}`);
        lines.push(`${C.dim}${THEME.success}✓${C.reset}${C.dim} = Project detected${C.reset}`);

        const box = boxify(lines, {
            title: 'File browser',
            titleColor: THEME.secondary,
            borderColor: THEME.border,
        });

        console.clear();
        console.log(`\n${getFullLogo()}\n`);
        console.log(box);

        const input = (await ask(`\n  ${THEME.info}Choice:${C.reset} `)).trim().toLowerCase();

        if (input === 'q') return null;
        if (input === 'h') { currentPath = HOME; continue; }
        if (input === 's') return currentPath;
        if (input === '') return currentPath;

        const num = parseInt(input, 10);
        if (input === '1' || (num === 1 && !itemMap['1'])) {
            const parent = path.resolve(currentPath, '..');
            try { fs.accessSync(parent); currentPath = parent; } catch {}
            continue;
        }

        if (itemMap[num]) {
            currentPath = itemMap[num].path;
            continue;
        }

        // Try to interpret as full path
        const fullInput = input.startsWith('/') || input.startsWith('~') ?
            input.replace('~', HOME) :
            path.resolve(currentPath, input);

        try {
            const st = fs.statSync(fullInput);
            if (st.isDirectory()) {
                currentPath = fullInput;
                continue;
            }
            // It's a file - select it
            return path.dirname(fullInput);
        } catch {}
    }
}

// ─── DASHBOARD / LOGO ──────────────────────────────────────
function getFullLogo() {
    const logoLines = getLogoLines();
    const config = readEcosystem();
    const statusLines = [];
    const screenWidth = getTerminalWidth();

    const neededWidth = logoLines.reduce((max, l) => Math.max(max, vlen(l)), 0);

    if (config.apps.length === 0) {
        statusLines.push('');
        statusLines.push(`${THEME.muted}  (no projects added yet)${C.reset}`);
        statusLines.push(`  ${THEME.muted}Use 'Add project' to get started${C.reset}`);
    }

    const maxW = Math.max(neededWidth, statusLines.reduce((m, l) => Math.max(m, vlen(l)), 0));
    const sep = `${THEME.muted}${repeat('═', maxW + 2)}${C.reset}`;

    const all = [...logoLines];
    if (statusLines.length > 0) {
        all.push(sep);
        all.push(...statusLines);
    }

    const minWidth = Math.min(65, screenWidth - 4);
    return boxify(all, { borderColor: THEME.border, minWidth });
}

async function showDashboard(extraLines = [], opts = {}) {
    console.clear();
    const logo = getFullLogo();
    console.log(`\n${logo}\n`);

    if (extraLines.length > 0) {
        const screenWidth = getTerminalWidth();
        const minWidth = Math.min(opts.minWidth || 60, screenWidth - 4);
        const box = boxify(extraLines, {
            title: opts.title || '',
            titleColor: opts.titleColor || THEME.secondary,
            borderColor: opts.borderColor || THEME.border,
            minWidth,
        });
        console.log(box + '\n');
    }
}

// ─── DASHBOARD RENDERER ───────────────────────────────────

function renderMainDashboard(config, pm2Status) {
    const logoLines = getLogoLines();
    const maxLogoWidth = logoLines.length > 0 ? logoLines.reduce((m, l) => Math.max(m, vlen(l)), 0) : 0;
    const screenWidth = getTerminalWidth();
    const INNER = Math.min(Math.max(maxLogoWidth + 3, 50), screenWidth - 4);
    const bc = THEME.border;
    const menuColor = rgb(255, 220, 200);
    const numColor = rgb(255, 190, 90);
    const out = [];

    out.push(boxTop(INNER, bc));

    // Logo (alleen op grotere schermen)
    if (logoLines.length > 0) {
        for (const l of logoLines) {
            out.push(fullRow(l, INNER, bc));
        }
        out.push(sepFull(INNER, bc));
    }

    // Title
    const titleText = 'MindDevelopment PM2 Ecosystem Manager';
    const titleLen = vlen(titleText);
    const leftPad = Math.max(0, Math.floor((INNER - titleLen) / 2));
    const rightPad = Math.max(0, INNER - titleLen - leftPad);
    out.push(`${bc}║${C.reset}${' '.repeat(leftPad)}${THEME.primary}${C.bold}${titleText}${C.reset}${' '.repeat(rightPad)}${bc}║${C.reset}`);

    // Projects section
    if (config.apps.length > 0) {
        const projectEntries = [];
        for (const app of config.apps) {
            const status = pm2Status[app.name] || { status: 'not_found' };
            const icon = Project.statusIcon(status.status);
            const statusLabel = status.status === 'online' ? `${THEME.online}online${C.reset}` :
                                status.status === 'stopped' ? `${THEME.stopped}stopped${C.reset}` :
                                status.status === 'errored' ? `${THEME.danger}error${C.reset}` :
                                `${THEME.muted}—${C.reset}`;
            const shortPath = truncate(app.script.replace(HOME, '~'), Math.max(20, INNER - 45));
            projectEntries.push({
                name: `  ${icon} ${C.bold}${truncate(app.name, Math.max(15, INNER - 40))}${C.reset}`,
                status: `  ${statusLabel}`,
                path: `  ${THEME.muted}${shortPath}${C.reset}`,
            });
        }

        const maxName   = Math.max(...projectEntries.map(e => vlen(e.name)), vlen('  Projects:'));
        const maxStatus = Math.max(...projectEntries.map(e => vlen(e.status)), vlen('  Status:'));
        const maxPath   = Math.max(...projectEntries.map(e => vlen(e.path)), vlen('  Project Path:'));
        const col1 = maxName + 2;
        const col2 = Math.max(maxStatus + 2, 11);
        const col3 = Math.max(INNER - col1 - col2 - 2, 10);

        out.push(sepCols([col1, col2, col3], bc, 'top'));
        out.push(colRow(['  Projects:', '  Status:', '  Project Path:'], [col1, col2, col3], bc));
        out.push(sepCols([col1, col2, col3], bc, 'mid'));

        for (const entry of projectEntries) {
            out.push(colRow([entry.name, entry.status, entry.path], [col1, col2, col3], bc));
        }

        out.push(sepCols([col1, col2, col3], bc, 'bot'));
    } else {
        out.push(sepFull(INNER, bc));
        out.push(fullRow(`  ${THEME.muted}(no projects added yet)${C.reset}`, INNER, bc));
        out.push(sepFull(INNER, bc));
    }

    // Menu section
    out.push(fullRow(`  ${THEME.highlight}${C.bold}Menu:${C.reset}`, INNER, bc));
    out.push(sepFull(INNER, bc));

    const menuItems = [
        { num: '1', text: 'Add project' },
        { num: '2', text: 'View logs' },
        { num: '3', text: 'Delete project' },
        { num: '4', text: 'View projects' },
        { num: '5', text: 'Create backup' },
        { num: '6', text: 'Restore backup' },
        { num: '0', text: 'Exit', color: THEME.danger },
    ];
    for (const item of menuItems) {
        const nColor = item.color || numColor;
        out.push(fullRow(`  ${nColor}${C.bold}[${item.num}]${C.reset} ${menuColor}${item.text}${C.reset}`, INNER, bc));
    }

    // Footer section
    out.push(sepFull(INNER, bc));
    const copyrightText = `© 2026 MindDevelopment`;
    const versionText = `Version: ${CONFIG.VERSION}`;
    const footerContent = `${THEME.muted}${copyrightText}${C.reset}${' '.repeat(Math.max(2, INNER - vlen(copyrightText) - vlen(versionText) - 4))}${THEME.muted}${versionText}${C.reset}`;
    out.push(`${bc}║${C.reset} ${padRight(footerContent, INNER - 2)} ${bc}║${C.reset}`);

    out.push(boxBottom(INNER, bc));
    return out.join('\n');
}

// ─── MENU SYSTEM ───────────────────────────────────────────

async function mainMenu() {
    while (true) {
        const config = readEcosystem();
        const pm2Status = await getPm2Status();

        console.clear();
        console.log(`\n${renderMainDashboard(config, pm2Status)}\n`);

        const choice = (await ask(`  ${THEME.highlight}Choose an option [0-9]:${C.reset} `)).trim();

        switch (choice) {
            case '1': await addProject(); break;
            case '2': await viewLogs(); break;
            case '3': await deleteProject(); break;
            case '4': await viewProjects(); break;
            case '5': await makeBackup(); break;
            case '6': await restoreBackup(); break;
            case '0':
                console.log(`\n  ${THEME.secondary}Goodbye!${C.reset}\n`);
                rl.close();
                process.exit(0);
            default:
                await showDashboard([error('Invalid choice. Try again.')]);
                await pause();
        }
    }
}

// ─── COMMAND: PROJECT TOEVOEGEN ───────────────────────────
async function addProject() {
    await showDashboard([
        `${C.bold}Step 1:${C.reset} Select the project folder`,
        `${C.dim}Navigate to the folder you want to add.${C.reset}`,
        '',
    ], { title: 'Add project', titleColor: THEME.info });

    const useBrowser = (await ask(`  ${THEME.info}Use file browser? [Y/n]:${C.reset} `)).trim().toLowerCase();
    let targetPath;

    if (useBrowser === 'n') {
        const input = (await ask(`  ${THEME.info}Full path to project folder:${C.reset} `)).trim();
        targetPath = input.replace(/^~/, HOME);
        if (!targetPath.startsWith('/')) targetPath = path.resolve(process.cwd(), targetPath);
    } else {
        targetPath = await browseFolder(CONFIG.PROJECTS);
        if (!targetPath) {
            await showDashboard([error('Cancelled.')], { title: 'Add project' });
            await pause();
            return;
        }
    }

    if (!targetPath) {
        await showDashboard([error('No folder selected.')], { title: 'Add project' });
        await pause();
        return;
    }

    let st;
    try {
        st = fs.statSync(targetPath);
    } catch {
        await showDashboard([error(`Folder not found: ${targetPath}`)], { title: 'Add project' });
        await pause();
        return;
    }

    if (!st.isDirectory()) {
        await showDashboard([error('Select a folder, not a file.')], { title: 'Add project' });
        await pause();
        return;
    }

    // Auto-detect
    const detected = detectProjectScript(targetPath);
    const autoName = detectProjectName(targetPath, path.basename(targetPath));

    // Step 2: Name
    await showDashboard([
        `${C.bold}Step 2:${C.reset} Project name`,
        `${C.dim}Folder: ${C.green}${targetPath}${C.reset}`,
        '',
        detected ? info(`Project detected: ${path.basename(detected.script)}`) : '',
    ], { title: 'Add project', titleColor: THEME.info });

    const namePrompt = detected
        ? `  ${THEME.info}Project name [${autoName}]:${C.reset} `
        : `  ${THEME.info}Project name:${C.reset} `;
    const name = (await ask(namePrompt)).trim() || autoName;
    if (!name) {
        await showDashboard([error('Project name is required.')], { title: 'Add project' });
        await pause();
        return;
    }

    // Check duplicate
    const existingConfig = readEcosystem();
    if (existingConfig.apps.some(a => a.name === name)) {
        await showDashboard([error(`Project "${name}" already exists.`)], { title: 'Add project' });
        await pause();
        return;
    }

    // Step 3: Script
    let script;
    if (detected) {
        script = detected.script;
        await showDashboard([
            `${C.bold}Step 3:${C.reset} Entry file`,
            `${C.dim}Name: ${C.bold}${name}${C.reset}`,
            `${C.dim}Folder:  ${C.green}${targetPath}${C.reset}`,
            '',
            info(`Entry file detected: ${path.basename(script)}`),
        ], { title: 'Add project', titleColor: THEME.info });

        const useDetected = (await ask(`  ${THEME.info}Use this file? [Y/n]:${C.reset} `)).trim().toLowerCase();
        if (useDetected === 'n') {
            script = (await ask(`  ${THEME.info}Entry file (e.g. index.js):${C.reset} `)).trim();
            if (script && !script.startsWith('/')) script = path.join(targetPath, script);
        }
    } else {
        script = (await ask(`  ${THEME.info}Entry file (e.g. index.js):${C.reset} `)).trim();
        if (script && !script.startsWith('/')) script = path.join(targetPath, script);
    }

    if (!script) {
        await showDashboard([error('No entry file specified.')], { title: 'Add project' });
        await pause();
        return;
    }

    // Step 4: PM2 options
    await showDashboard([
        `${C.bold}Step 4:${C.reset} Advanced PM2 options`,
        `${C.dim}Name:      ${C.bold}${name}${C.reset}`,
        `${C.dim}Script:    ${C.green}${script}${C.reset}`,
        `${C.dim}Folder:    ${C.green}${targetPath}${C.reset}`,
        '',
        `${C.dim}Common options (leave empty to skip):${C.reset}`,
    ], { title: 'Add project', titleColor: THEME.info });

    const instances = (await ask(`  ${THEME.info}Instances [1]:${C.reset} `)).trim();
    const watch = (await ask(`  ${THEME.info}Watch mode (y/n) [n]:${C.reset} `)).trim().toLowerCase();
    const maxMem = (await ask(`  ${THEME.info}Max memory restart (e.g. 500M) [empty]:${C.reset} `)).trim();
    const execMode = (await ask(`  ${THEME.info}Exec mode (fork/cluster) [fork]:${C.reset} `)).trim().toLowerCase();
    const autorestart = (await ask(`  ${THEME.info}Auto restart (y/n) [y]:${C.reset} `)).trim().toLowerCase();

    const project = new Project({
        name: name,
        script: script,
        cwd: targetPath,
    });

    if (instances && parseInt(instances) > 1) project.options.instances = parseInt(instances);
    if (watch === 'y') project.options.watch = true;
    if (maxMem) project.options.max_memory_restart = maxMem;
    if (execMode === 'cluster') project.options.exec_mode = 'cluster';
    if (autorestart === 'n') project.options.autorestart = false;

    // Save
    const config = readEcosystem();
    config.apps.push(project.toObject());
    try {
        writeEcosystem(config);
        await showDashboard([
            success(`Project "${name}" added!`),
            '',
            `${C.dim}Script:${C.reset} ${script}`,
            `${C.dim}Folder:${C.reset} ${targetPath}`,
            Object.keys(project.options).length > 0 ? `${C.dim}Options:${C.reset}  ${JSON.stringify(project.options)}` : '',
        ], { title: 'Add project', borderColor: THEME.success });
    } catch (e) {
        await showDashboard([error(`Error saving: ${e.message}`)], { title: 'Add project' });
    }
    await pause();
}

// ─── PROJECT SELECTIE HELPER ───────────────────────────────
async function selectProject(config, actionLabel = 'Select', filterText = '') {
    if (config.apps.length === 0) {
        await showDashboard([error('No projects found.')], { title: actionLabel });
        await pause();
        return null;
    }

    let apps = config.apps;
    if (filterText) {
        const q = filterText.toLowerCase();
        apps = config.apps.filter(a => a.name.toLowerCase().includes(q));
        if (apps.length === 0) {
            await showDashboard([warn(`No projects found for "${filterText}"`)], { title: actionLabel });
            await pause();
            return null;
        }
    }

    const pm2Status = await getPm2Status();
    const screenWidth = getTerminalWidth();
    const lines = apps.map((app, i) => {
        const status = pm2Status[app.name] || { status: 'not_found' };
        const icon = Project.statusIcon(status.status);
        return `  ${icon} ${C.cyan}${String(i + 1).padStart(2, ' ')}.${C.reset} ${C.bold}${app.name}${C.reset}  ${C.dim}(${path.basename(app.script)})${C.reset}`;
    });

    lines.push('');
    lines.push(`  ${C.yellow}0.${C.reset}  Back to main menu`);
    lines.push(`  ${C.yellow}s:${C.reset}  Search/filter`);

    await showDashboard(lines, {
        title: actionLabel,
        titleColor: THEME.secondary,
        minWidth: Math.min(60, screenWidth - 4),
    });

    const input = (await ask(`  ${THEME.info}Project [0-${apps.length}]:${C.reset} `)).trim().toLowerCase();

    if (input === '0') return null;
    if (input === 's') {
        const query = (await ask(`  ${THEME.info}Search project:${C.reset} `)).trim();
        return selectProject(config, actionLabel, query);
    }
    if (input === '') return null;

    const idx = parseInt(input, 10);
    if (isNaN(idx) || idx < 0 || idx > apps.length) {
        // Try fuzzy match by name
        const match = apps.find(a => a.name.toLowerCase().startsWith(input));
        if (match) return { app: match, project: new Project(match) };
        await showDashboard([error('Invalid choice.')], { title: actionLabel });
        await pause();
        return null;
    }
    if (idx < 1) return null;

    const app = apps[idx - 1];
    return { app, project: new Project(app) };
}

// ─── COMMAND: LOGS ────────────────────────────────────────
async function viewLogs() {
    const config = readEcosystem();
    const result = await selectProject(config, 'View logs');
    if (!result) return;

    const logs = await result.project.logs();
    const screenWidth = getTerminalWidth();
    const logLines = logs.split('\n').slice(-40);
    const displayLines = logLines.map(l => {
        const truncated = truncate(l, screenWidth - 6);
        return `  ${C.dim}${truncated}${C.reset}`;
    });

    if (displayLines.length === 0) {
        displayLines.push(`  ${THEME.muted}No logs available.${C.reset}`);
    }

    await showDashboard(displayLines, {
        title: `Logs: ${result.project.name}`,
        titleColor: THEME.info,
        minWidth: Math.min(70, screenWidth - 4),
    });
    await pause();
}

// ─── COMMAND: VERWIJDEREN ─────────────────────────────────
async function deleteProject() {
    const config = readEcosystem();
    const result = await selectProject(config, 'Delete project');
    if (!result) return;

    const confirm = (await ask(`\n  ${THEME.danger}Are you sure you want to delete "${result.project.name}"? [y/N]:${C.reset} `)).trim().toLowerCase();

    if (confirm !== 'y') {
        await showDashboard([info('Deletion cancelled.')], { title: 'Delete project' });
        await pause();
        return;
    }

    const freshConfig = readEcosystem();
    const idx = freshConfig.apps.findIndex(a => a.name === result.project.name);
    if (idx < 0) {
        await showDashboard([error('Project not found.')], { title: 'Delete project' });
        await pause();
        return;
    }

    freshConfig.apps.splice(idx, 1);
    try {
        writeEcosystem(freshConfig);
        // Also try to delete from PM2
        try { await result.project.delete(); } catch {}

        await showDashboard([
            success(`Project "${result.project.name}" deleted!`),
        ], { title: 'Delete project', borderColor: THEME.success });
    } catch (e) {
        await showDashboard([error(`Error deleting: ${e.message}`)], { title: 'Delete project' });
    }
    await pause();
}

// ─── COMMAND: BEKIJKEN ────────────────────────────────────
async function viewProjects() {
    const config = readEcosystem();
    if (config.apps.length === 0) {
        await showDashboard([info('No projects found.')], { title: 'Project overview' });
        await pause();
        return;
    }

    const pm2Status = await getPm2Status();
    const screenWidth = getTerminalWidth();
    const lines = [];
    config.apps.forEach((app, i) => {
        if (i > 0) lines.push(`${THEME.muted}  ${repeat('─', Math.min(55, screenWidth - 6))}${C.reset}`);
        const status = pm2Status[app.name] || { status: 'not_found' };
        const icon = Project.statusIcon(status.status);
        lines.push(`${icon} ${C.bold}${app.name}${C.reset}`);
        lines.push(`    ${C.dim}Script:${C.reset}  ${app.script}`);
        if (app.cwd) lines.push(`    ${C.dim}Folder:${C.reset}   ${app.cwd}`);

        // Show PM2 options
        const opts = {};
        for (const [k, v] of Object.entries(app)) {
            if (['name', 'script', 'cwd'].includes(k)) continue;
            opts[k] = v;
        }
        if (Object.keys(opts).length > 0) {
            lines.push(`    ${C.dim}Options:${C.reset}  ${JSON.stringify(opts)}`);
        }

        // Show runtime info
        if (status.status !== 'not_found') {
            lines.push(`    ${C.dim}Status:${C.reset}  ${icon} ${status.status}  ${C.dim}CPU:${C.reset} ${status.cpu}%  ${C.dim}MEM:${C.reset} ${formatMemory(status.memory)}  ${C.dim}Uptime:${C.reset} ${status.uptime}`);
        }
    });

    await showDashboard(lines, {
        title: 'Project overview',
        titleColor: THEME.secondary,
        minWidth: Math.min(65, screenWidth - 4),
    });
    await pause();
}

// ─── COMMAND: BACKUP ──────────────────────────────────────
async function makeBackup() {
    const config = readEcosystem();
    if (config.apps.length === 0) {
        await showDashboard([info('No projects to backup.')], { title: 'Backup' });
        await pause();
        return;
    }

    const dest = backupEcosystem();
    if (dest) {
        await showDashboard([
            success(`Backup created!`),
            '',
            `${C.dim}File:${C.reset} ${dest}`,
        ], { title: 'Backup', borderColor: THEME.success });
    } else {
        await showDashboard([error('Could not create backup.')], { title: 'Backup' });
    }
    await pause();
}

// ─── COMMAND: BACKUP HERSTELLEN ───────────────────────────
async function restoreBackup() {
    const backups = listBackups();
    if (backups.length === 0) {
        await showDashboard([info('No backups found.')], { title: 'Restore backup' });
        await pause();
        return;
    }

    const lines = backups.map((b, i) => {
        const stamp = b.replace('ecosystem_', '').replace('.js', '').replace(/_/g, ' ');
        return `  ${C.cyan}${String(i + 1).padStart(2, ' ')}.${C.reset} ${stamp}`;
    });
    lines.push('');
    lines.push(`  ${C.yellow}0.${C.reset}  Cancel`);

    await showDashboard(lines, { title: 'Restore backup', titleColor: THEME.warning });

    const choice = (await ask(`  ${THEME.info}Choose backup [0-${backups.length}]:${C.reset} `)).trim();
    const idx = parseInt(choice, 10);
    if (isNaN(idx) || idx < 1 || idx > backups.length) return;

    const backupFile = path.join(CONFIG.BACKUP_DIR, backups[idx - 1]);

    // Make current backup first
    backupEcosystem();

    const restored = restoreEcosystemFrom(backupFile);
    if (restored) {
        const restoredConfig = readEcosystem();
        await showDashboard([
            success(`Backup restored!`),
            '',
            `${C.dim}Projects:${C.reset} ${restoredConfig.apps.length}`,
        ], { title: 'Restore backup', borderColor: THEME.success });
    } else {
        await showDashboard([error('Error restoring.')], { title: 'Restore backup' });
    }
    await pause();
}

// ─── MAIN ─────────────────────────────────────────────────
(async () => {
    console.clear();

    // Info header
    console.log(`\n  ${THEME.primary}${C.bold}ECO v${CONFIG.VERSION}${C.reset} — ${THEME.secondary}PM2 Project Manager${C.reset}`);
    console.log(`  ${THEME.muted}Config: ${CONFIG.ECOSYSTEM_FILE}${C.reset}`);
    console.log(`  ${THEME.muted}Backups: ${CONFIG.BACKUP_DIR}${C.reset}\n`);

    // Ensure directories exist
    if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
        fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
    }

    // Ensure ecosystem file exists
    if (!fs.existsSync(CONFIG.ECOSYSTEM_FILE)) {
        try {
            writeEcosystem({ apps: [] });
            console.log(`  ${success('New ecosystem config file created.')}\n`);
        } catch (e) {
            console.log(`  ${error('Could not create ecosystem config: ' + e.message)}\n`);
        }
    }

    // Load and start main menu
    try {
        const config = readEcosystem();
        const pm2Status = await getPm2Status();
        const onlineCount = Object.values(pm2Status).filter(s => s.status === 'online').length;
        console.log(`  ${THEME.info}${C.bold}${config.apps.length}${C.reset}${C.dim} projects loaded, ${THEME.success}${C.bold}${onlineCount}${C.reset}${C.dim} online${C.reset}\n`);
    } catch {}

    // Small startup delay for UX
    await new Promise(r => setTimeout(r, 400));
    await mainMenu();
})().catch(err => {
    console.error(`\n  ${error('Unexpected error: ' + err.message)}`);
    console.error(`  ${C.dim}${err.stack}${C.reset}\n`);
    rl.close();
    process.exit(1);
});
