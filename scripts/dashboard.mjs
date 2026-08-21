#!/usr/bin/env node

/**
 * Neon Wave Auto-Commit Control Dashboard Server
 *
 * Provides a local web interface to toggle the commit engine ON/OFF,
 * configure daily commit goals, inspect activity logs, and trigger runs.
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const CONFIG_PATH = resolve(__dirname, 'autocommit_config.json');
const PULSE_PATH = resolve(REPO_ROOT, '.github', 'activity_pulse.json');
const HTML_PATH = resolve(REPO_ROOT, 'public', 'dashboard.html');

const PORT = parseInt(process.env.PORT || '3333', 10);

function loadConfig() {
  if (existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
      // fallback
    }
  }
  return {
    enabled: true,
    daily_commits: 10,
    randomize: false,
    min_commits: 3,
    max_commits: 10,
    spread: true,
    theme: 'neon',
    schedule_time: '10:30',
    auto_push: true,
    last_run: null,
    total_runs: 0,
  };
}

function saveConfig(updated) {
  const current = loadConfig();
  const merged = { ...current, ...updated };
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  return merged;
}

function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getLaunchAgentStatus() {
  try {
    const list = execSync('launchctl list', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const match = list.split('\n').find((line) => line.includes('com.neonwave.autocommit'));
    if (match) {
      const parts = match.trim().split(/\s+/);
      return { installed: true, pid: parts[0] === '-' ? null : parseInt(parts[0], 10), last_exit: parts[1] };
    }
  } catch {
    // ignore
  }
  return { installed: false, pid: null, last_exit: null };
}

function getTelemetryData() {
  if (existsSync(PULSE_PATH)) {
    try {
      return JSON.parse(readFileSync(PULSE_PATH, 'utf8'));
    } catch {
      // ignore
    }
  }
  return { total_pulses: 0, metrics: {}, recent_pulses: [] };
}

function getRecentGitCommits(limit = 10) {
  try {
    const out = runGit(`git log -n ${limit} --format="%h|%an|%ad|%s" --date=format:"%Y-%m-%d %H:%M:%S"`);
    if (!out) return [];
    return out.split('\n').filter(Boolean).map((line) => {
      const [hash, author, date, subject] = line.split('|');
      return { hash, author, date, subject };
    });
  } catch {
    return [];
  }
}

// HTTP Server
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS headers for local requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve Main Dashboard HTML
  if (pathname === '/' || pathname === '/index.html') {
    if (existsSync(HTML_PATH)) {
      const html = readFileSync(HTML_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('dashboard.html not found');
    return;
  }

  // API: Get Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const config = loadConfig();
    const daemon = getLaunchAgentStatus();
    const telemetry = getTelemetryData();
    const commits = getRecentGitCommits(15);
    const branch = runGit('git rev-parse --abbrev-ref HEAD') || 'main';
    const remote = runGit('git remote get-url origin') || 'megalazer/Neon_Wave';

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      config,
      daemon,
      telemetry,
      commits,
      git: { branch, remote },
      system: {
        node: process.version,
        time: new Date().toISOString(),
      },
    }));
    return;
  }

  // Helper to parse JSON body
  const parseJsonBody = () => new Promise((resolveBody) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolveBody(JSON.parse(body || '{}'));
      } catch {
        resolveBody({});
      }
    });
  });

  // API: Toggle ON / OFF
  if (pathname === '/api/toggle' && req.method === 'POST') {
    const payload = await parseJsonBody();
    const current = loadConfig();
    const newEnabled = typeof payload.enabled === 'boolean' ? payload.enabled : !current.enabled;
    const updated = saveConfig({ enabled: newEnabled });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, enabled: updated.enabled, config: updated }));
    return;
  }

  // API: Update Config Settings
  if (pathname === '/api/config' && req.method === 'POST') {
    const payload = await parseJsonBody();
    const allowed = ['daily_commits', 'randomize', 'min_commits', 'max_commits', 'spread', 'theme', 'schedule_time', 'auto_push'];
    const updates = {};
    for (const key of allowed) {
      if (key in payload) {
        updates[key] = payload[key];
      }
    }
    const updated = saveConfig(updates);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, config: updated }));
    return;
  }

  // API: Trigger Commit Execution
  if (pathname === '/api/trigger' && req.method === 'POST') {
    const payload = await parseJsonBody();
    const count = payload.count || 10;
    const isDryRun = payload.dry_run === true;
    const isSpread = payload.spread !== false;
    const theme = payload.theme || 'neon';
    const isPush = payload.push !== false && !isDryRun;

    const args = ['scripts/auto_commit.mjs', '--force'];
    if (payload.random) {
      args.push('--random', '--min', `${payload.min || 3}`, '--max', `${payload.max || 10}`);
    } else {
      args.push('--count', `${count}`);
    }
    if (isSpread) args.push('--spread');
    if (theme) args.push('--theme', theme);
    if (isDryRun) args.push('--dry-run');
    if (isPush) args.push('--push');

    const proc = spawn('node', args, {
      cwd: REPO_ROOT,
      env: process.env,
    });

    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });

    proc.on('close', (code) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: code === 0,
        code,
        output,
        config: loadConfig(),
      }));
    });
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`\n=============================================`);
  console.log(`⚡ Neon Wave Auto-Commit Control Dashboard ⚡`);
  console.log(`=============================================`);
  console.log(`🌐 URL:  http://localhost:${PORT}`);
  console.log(`⚙️  API:  http://localhost:${PORT}/api/status`);
  console.log(`=============================================\n`);

  if (process.argv.includes('--open')) {
    try {
      execSync(`open http://localhost:${PORT}`);
    } catch {
      // ignore
    }
  }
});
