# ⚡ Neon Wave Auto-Commit & Telemetry Pulse System

Comprehensive guide for the automated repository activity heartbeat and commit engine for **Neon Wave** (`megalazer/Neon_Wave`).

---

## 🎯 Overview

The tool automatically generates realistic, cyberpunk-themed and conventional commits that update repository pulse telemetry without disrupting any source code or breaking builds.

### Key Features
- **10 Commits / Day** (or randomized range, e.g. 1–10).
- **Spread Timestamps (`--spread`)**: Distributes commits naturally across active hours of the day rather than dumping them all at the identical second.
- **Realistic Commit Messages**: Dynamic pool of `feat`, `fix`, `perf`, `refactor`, `chore`, `docs`, and `test` messages styled for Neon Wave engine telemetry.
- **Multi-Environment**:
  1. **Web Control Dashboard** — Interactive cyberpunk UI to toggle the system ON/OFF and trigger commits.
  2. **GitHub Actions (Cloud)** — 100% automated on GitHub's servers (no local computer required).
  3. **Local CLI / npm scripts** — Manual or scriptable on-demand execution.
  4. **macOS LaunchAgent / Crontab** — Background local scheduler.
---

## 🎛️ Method 0: Web Control Dashboard (Toggle ON / OFF)

Launch the visual web dashboard in your browser:

```bash
npm run dashboard
```
- **Master ON / OFF Toggle**: Click the switch to immediately pause or enable all automated commit runs.
- **Trigger Actions**: Click "Fire 10 Commits Now", "Fire Random Commits", or "Run Dry-Run Preview".
- **Realtime Output**: Embedded cyberpunk terminal streams git commit output in real time.
- **Live Stats**: Shows LaunchAgent daemon status, total pulse count, current branch, and recent commit history.

---

## 🚀 Method 1: GitHub Actions (Cloud — Zero Maintenance)
### How it Works:
1. **Automated Schedule**: Runs every day via GitHub Actions cron schedule.
2. **Push Permissions**: Uses standard `GITHUB_TOKEN` with write access to push directly to `main`.
3. **Manual Trigger**:
   - Go to `https://github.com/megalazer/Neon_Wave/actions`
   - Select **Daily Activity Pulse**
   - Click **Run workflow**
   - Configure commit count (default: 10), timestamp spreading, and message theme.

---

## 💻 Method 2: Command Line / NPM Scripts

You can run the generator locally at any time from your terminal:

```bash
# Generate exactly 10 commits and push immediately
npm run auto-commit:10

# Generate a random number of commits (3 to 10) and push
npm run auto-commit:random

# Dry run / preview without making git commits
npm run auto-commit:dry
```

### Advanced CLI Options:

```bash
# Run with custom parameters
node scripts/auto_commit.mjs --count 10 --spread --push

# Generate 5 commits with conventional theme
node scripts/auto_commit.mjs --count 5 --theme conventional --push

# Generate between 4 and 10 random commits
node scripts/auto_commit.mjs --min 4 --max 10 --random --spread --push

# Display all flags and options
node scripts/auto_commit.mjs --help
```

### CLI Reference:
| Flag | Short | Description | Default |
|:---|:---:|:---|:---|
| `--count <n>` | `-n` | Number of commits to make | `10` |
| `--min <n>` | | Minimum random commits | `1` |
| `--max <n>` | | Maximum random commits | `10` |
| `--random` | `-r` | Pick random count between min and max | `false` |
| `--spread` | `-s` | Spread timestamps across today's active hours | `false` |
| `--push` | `-p` | Automatically push to remote origin | `false` |
| `--dry-run` | `-d` | Preview output without modifying git | `false` |
| `--theme` | | `neon`, `conventional`, or `mixed` | `neon` |
| `--file` | | Custom pulse telemetry JSON file path | `.github/activity_pulse.json` |

---

## ⏰ Method 3: Local Background Schedulers

### macOS LaunchAgent (Runs in background even if terminal is closed)

Run the installer:
```bash
npm run auto-commit:setup-daemon
# or: bash scripts/setup_launchd.sh
```
- Installs `~/Library/LaunchAgents/com.neonwave.autocommit.plist`
- Runs daily at 10:30 AM local time
- Logs output to `~/Library/Logs/NeonWave/autocommit.log`
- To uninstall:
  ```bash
  launchctl unload ~/Library/LaunchAgents/com.neonwave.autocommit.plist
  rm ~/Library/LaunchAgents/com.neonwave.autocommit.plist
  ```

### Crontab (macOS / Linux)

Run the installer:
```bash
npm run auto-commit:setup-cron
# or: bash scripts/setup_cron.sh
```
- Adds a daily cron job at 10:30 AM.
- Logs output to `cron_autocommit.log`.

---

## 📊 Telemetry Output Files

Each commit updates:
1. `.github/activity_pulse.json` — Structured JSON containing entropy, simulated neural load, and rolling pulse history.
2. `docs/ACTIVITY.md` — Markdown activity pulse table and sync status.
