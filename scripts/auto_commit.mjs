#!/usr/bin/env node

/**
 * Neon Wave Auto-Commit Engine
 *
 * Automated, realistic commit generator for repository activity tracking.
 * Updates internal pulse telemetry and commits changes with natural conventional messages.
 *
 * Usage:
 *   node scripts/auto_commit.mjs [options]
 *
 * Options:
 *   --count <n>, -n <n>     Exact number of commits to generate (e.g., --count 10)
 *   --min <n>               Minimum random commits (default: 1)
 *   --max <n>               Maximum random commits (default: 10)
 *   --random                Pick a random commit count between min and max
 *   --spread                Spread commit timestamps across today's active hours (08:00 - 23:00)
 *   --push                  Automatically push commits to remote origin
 *   --dry-run               Preview generated commits without modifying git
 *   --theme <theme>         Message theme: 'neon' (default), 'conventional', or 'mixed'
 *   --file <path>           Custom telemetry log file path (default: .github/activity_pulse.json)
 *   --author-name <name>    Custom git author name
 *   --author-email <email>  Custom git author email
 *   --quiet, -q             Minimal console output
 *   --help, -h              Show this help message
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ==========================================
// Neon Wave Themed Commit Message Generators
// ==========================================

const NEON_SCOPES = [
  'engine',
  'contracts',
  'encounters',
  'neural',
  'telemetry',
  'balance',
  'microgames',
  'crews',
  'origins',
  'terminal',
  'shaders',
  'audio',
  'state',
  'sync',
  'jobs',
  'deck',
  'matrix',
  'combat',
  'metrics',
  'cache',
];

const NEON_ACTIONS = {
  feat: [
    'tune neural buffer recalculation step',
    'streamline contract tier-filtering cadence',
    'add adaptive entropy seed to combat resolution',
    'support dynamic phosphor bloom curve',
    'introduce multi-pass telemetry pulse verification',
    'expand microgame timing threshold table',
    'implement state snapshot differential encoding',
    'refine crew synergy multiplier calculations',
    'expose realtime engine performance telemetry',
    'add randomized encounter weighting jitter',
  ],
  fix: [
    'resolve async tick loop drift during high neural load',
    'correct vitality scaling clamp in levelup routine',
    'patch memory leak in particle cache recycling',
    'stabilize microgame input polling under frame drop',
    'prevent out-of-order combat queue execution',
    'fix contract reward rounding edge-case',
    'resolve stat modifier race condition on battle entry',
    'clamp neural drain floor on zero-cost abilities',
    'realign phosphor overlay aspect ratio matrix',
    'remedy floating-point drift in balance simulator',
  ],
  perf: [
    'vectorize microgame dice roll distributions',
    'optimize tier-gate filter indexing',
    'reduce GC churn during encounter generator warm-up',
    'cache precomputed origin stat derivations',
    'streamline enemy turn decision tree evaluation',
    'prune redundant combat animation worklets',
    'flatten state subscription tree for faster renders',
    'optimize telemetry buffer serialization overhead',
  ],
  refactor: [
    'extract combat action queue resolution logic',
    'modularize contract difficulty grading algorithms',
    'unify neural capacity calculation helpers',
    'decouple encounter generation from display state',
    'clean up legacy vitality formula wrappers',
    'streamline microgame result payload formatting',
    'standardize telemetry pulse schema definitions',
  ],
  chore: [
    'sync pulse telemetry heartbeat',
    'bump internal telemetry epoch counter',
    'record daily engine activity signature',
    'refresh simulated encounter matrix seed',
    'calibrate neural grid synchronization stamp',
    'rotate activity logging buffer window',
    'update automated pulse telemetry state',
  ],
  docs: [
    'update balance simulation notes and survival rates',
    'sync architecture telemetry specifications',
    'clarify contract tier gate prerequisites in docs',
    'document neural recharge curve derivation',
    'record benchmark survivability across origins',
    'update combat engine event cycle diagram',
  ],
  test: [
    'record Monte Carlo survival distribution run',
    'add regression checks for origin stat baseline',
    'validate contract reward bounds against tier caps',
    'verify microgame threshold boundary accuracy',
    'simulate 1,000 battle runs across level gradient',
  ],
  style: [
    'polish terminal phosphor glow color ramp',
    'align UI component margin tokens in JobScreen',
    'harmonize typography scale for monospace metrics',
    'tune neon cyan/magenta contrast gradient',
  ],
};

const CONVENTIONAL_MESSAGES = [
  'chore(deps): update telemetry dependencies',
  'docs: refresh internal developer documentation',
  'refactor: optimize internal state subscriber hooks',
  'chore(telemetry): record repository activity heartbeat',
  'test: expand unit test fixtures and mock datasets',
  'perf: reduce bundle footprint and redundant asset imports',
  'style: normalize code formatting and trailing whitespace',
  'chore(ci): sync automated verification workflow metadata',
  'fix: handle edge case in async promise rejection chain',
  'chore(metrics): update daily activity timestamp',
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCommitMessage(theme = 'neon', index = 0, total = 1) {
  if (theme === 'conventional') {
    return getRandomElement(CONVENTIONAL_MESSAGES);
  }

  const types = ['chore', 'feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'style'];
  // Give chore/perf/docs/refactor slightly higher weight for telemetry updates
  const weights = [0.35, 0.12, 0.12, 0.15, 0.1, 0.08, 0.05, 0.03];
  
  let rand = Math.random();
  let selectedType = types[0];
  let cumulative = 0;
  for (let i = 0; i < types.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      selectedType = types[i];
      break;
    }
  }

  const scope = getRandomElement(NEON_SCOPES);
  const action = getRandomElement(NEON_ACTIONS[selectedType] || NEON_ACTIONS.chore);
  
  if (theme === 'mixed' && Math.random() < 0.2) {
    return getRandomElement(CONVENTIONAL_MESSAGES);
  }

  return `${selectedType}(${scope}): ${action}`;
}

// ==========================================
// Telemetry & State Management
// ==========================================

function updateTelemetryFile(filePath, commitIndex, totalCommits, message, timestamp) {
  const fullPath = resolve(REPO_ROOT, filePath);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let data = {
    project: 'Neon Wave',
    last_updated: null,
    total_pulses: 0,
    metrics: {
      neural_load_avg: 0.82,
      simulation_cycles: 0,
      balance_parity_seed: 0,
      engine_uptime_ticks: 0,
    },
    recent_pulses: [],
  };

  if (existsSync(fullPath)) {
    try {
      const raw = readFileSync(fullPath, 'utf8');
      data = JSON.parse(raw);
    } catch {
      // Use fallback default data
    }
  }

  const pulseId = 'pulse_' + Math.random().toString(36).substring(2, 10);
  const isoTime = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  data.last_updated = isoTime;
  data.total_pulses = (data.total_pulses || 0) + 1;
  data.metrics = {
    neural_load_avg: +(0.7 + Math.random() * 0.25).toFixed(3),
    simulation_cycles: (data.metrics?.simulation_cycles || 1000) + getRandomInt(50, 500),
    balance_parity_seed: getRandomInt(100000, 999999),
    engine_uptime_ticks: (data.metrics?.engine_uptime_ticks || 50000) + getRandomInt(100, 1000),
  };

  const newEntry = {
    id: pulseId,
    timestamp: isoTime,
    commit_sequence: `${commitIndex + 1}/${totalCommits}`,
    message,
    entropy: Math.random().toString(16).substring(2, 10),
  };

  if (!Array.isArray(data.recent_pulses)) {
    data.recent_pulses = [];
  }

  data.recent_pulses.unshift(newEntry);
  // Keep rolling window of last 50 pulses
  if (data.recent_pulses.length > 50) {
    data.recent_pulses = data.recent_pulses.slice(0, 50);
  }

  writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  // Also update markdown pulse log for human readability if in docs or .github
  const mdLogPath = resolve(REPO_ROOT, 'docs', 'ACTIVITY.md');
  const mdDir = dirname(mdLogPath);
  if (!existsSync(mdDir)) {
    mkdirSync(mdDir, { recursive: true });
  }

  let mdContent = `# Neon Wave Activity Telemetry\n\n`;
  mdContent += `> Automated repository pulse logs and simulation heartbeat.\n\n`;
  mdContent += `**Last Sync:** \`${isoTime}\`  \n`;
  mdContent += `**Total Pulses Recorded:** \`${data.total_pulses}\`  \n`;
  mdContent += `**Current Telemetry Epoch:** \`${data.metrics.balance_parity_seed}\`\n\n`;
  mdContent += `## Recent Pulse History\n\n`;
  mdContent += `| Timestamp | Sequence | Commit Message | Pulse ID |\n`;
  mdContent += `|:---|:---:|:---|:---|\n`;

  for (const entry of data.recent_pulses.slice(0, 15)) {
    mdContent += `| \`${entry.timestamp.replace('T', ' ').slice(0, 19)}\` | ${entry.commit_sequence} | \`${entry.message}\` | \`${entry.id}\` |\n`;
  }

  writeFileSync(mdLogPath, mdContent, 'utf8');
}

// ==========================================
// Git Execution Helpers
// ==========================================

function runGit(cmd, env = {}) {
  return execSync(cmd, {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function configureGitUser(authorName, authorEmail) {
  let name = authorName;
  let email = authorEmail;

  if (!name) {
    try {
      name = runGit('git config --get user.name').trim();
    } catch {
      name = process.env.GITHUB_ACTOR || 'Neon Wave Bot';
    }
  }

  if (!email) {
    try {
      email = runGit('git config --get user.email').trim();
    } catch {
      email = process.env.GITHUB_ACTOR
        ? `${process.env.GITHUB_ACTOR}@users.noreply.github.com`
        : 'bot@neonwave.internal';
    }
  }

  try {
    runGit(`git config user.name "${name}"`);
    runGit(`git config user.email "${email}"`);
  } catch (err) {
    // Non-fatal if config fails
  }

  return { name, email };
}

// ==========================================
// Argument Parsing & CLI Logic
// ==========================================

function parseArgs(args) {
  const options = {
    count: null,
    min: 1,
    max: 10,
    random: false,
    spread: false,
    push: false,
    dryRun: false,
    theme: 'neon',
    file: '.github/activity_pulse.json',
    authorName: null,
    authorEmail: null,
    quiet: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--count' || arg === '-n') {
      options.count = parseInt(args[++i], 10);
    } else if (arg === '--min') {
      options.min = parseInt(args[++i], 10);
    } else if (arg === '--max') {
      options.max = parseInt(args[++i], 10);
    } else if (arg === '--random' || arg === '-r') {
      options.random = true;
    } else if (arg === '--spread' || arg === '-s') {
      options.spread = true;
    } else if (arg === '--push' || arg === '-p') {
      options.push = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--theme') {
      options.theme = args[++i];
    } else if (arg === '--file') {
      options.file = args[++i];
    } else if (arg === '--author-name') {
      options.authorName = args[++i];
    } else if (arg === '--author-email') {
      options.authorEmail = args[++i];
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
⚡ Neon Wave Auto-Commit Tool ⚡

Usage:
  node scripts/auto_commit.mjs [options]
  npm run auto-commit -- [options]

Options:
  -n, --count <num>       Exact number of commits to create (default: 10)
  --min <num>             Minimum commits when using --random (default: 1)
  --max <num>             Maximum commits when using --random (default: 10)
  -r, --random            Randomly choose commit count between min and max
  -s, --spread            Spread commit timestamps across today's active hours
  -p, --push              Push commits to remote git origin
  -d, --dry-run           Simulate commits without touching git
  --theme <name>          Message theme: 'neon' (default), 'conventional', 'mixed'
  --file <path>           Telemetry output file (default: .github/activity_pulse.json)
  --author-name <name>    Override git author name
  --author-email <email>  Override git author email
  -q, --quiet             Quiet mode (minimal output)
  -h, --help              Show this help message

Examples:
  node scripts/auto_commit.mjs --count 10 --push
  node scripts/auto_commit.mjs --min 3 --max 10 --random --spread --push
  node scripts/auto_commit.mjs --count 10 --dry-run
`);
}

// Generate realistic timestamps throughout today
function generateTimestamps(count, spread) {
  const timestamps = [];
  const now = new Date();

  if (!spread) {
    for (let i = 0; i < count; i++) {
      // Offset by slight increment (e.g., 2 seconds apart)
      const t = new Date(now.getTime() - (count - 1 - i) * 2000);
      timestamps.push(t);
    }
    return timestamps;
  }

  // Spread across today between 08:30 and current hour (or up to 22:30)
  const startOfDay = new Date(now);
  startOfDay.setHours(8, 30, 0, 0);

  const endWindow = new Date(now);
  if (endWindow.getHours() < 9) {
    endWindow.setHours(22, 30, 0, 0);
  }

  const startTime = Math.min(startOfDay.getTime(), now.getTime() - 3600000);
  const endTime = now.getTime();
  const timeSpan = Math.max(endTime - startTime, 60000 * count);

  const rawTimes = [];
  for (let i = 0; i < count; i++) {
    const fraction = (i + Math.random() * 0.8) / count;
    rawTimes.push(new Date(startTime + fraction * timeSpan));
  }

  rawTimes.sort((a, b) => a.getTime() - b.getTime());
  return rawTimes;
}

// ==========================================
// Main Execution Routine
// ==========================================

export async function runAutoCommit(cliArgs = process.argv.slice(2)) {
  const opts = parseArgs(cliArgs);

  if (opts.help) {
    printHelp();
    return { success: true, count: 0 };
  }

  // Determine commit count
  let targetCount = opts.count;
  if (targetCount === null) {
    if (opts.random) {
      targetCount = getRandomInt(opts.min, opts.max);
    } else {
      targetCount = 10; // Default to 10 commits as requested
    }
  }

  targetCount = Math.max(1, targetCount);

  if (!opts.quiet) {
    console.log(`\n=============================================`);
    console.log(`🚀 Neon Wave Auto-Commit Engine`);
    console.log(`=============================================`);
    console.log(`Target Commits:  ${targetCount}`);
    console.log(`Mode:            ${opts.dryRun ? 'DRY RUN (preview only)' : 'LIVE EXECUTION'}`);
    console.log(`Spread Timing:   ${opts.spread ? 'YES (distributed across today)' : 'NO (sequential current time)'}`);
    console.log(`Auto Push:       ${opts.push ? 'YES' : 'NO'}`);
    console.log(`Theme:           ${opts.theme}`);
    console.log(`Telemetry File:  ${opts.file}`);
    console.log(`=============================================\n`);
  }

  const timestamps = generateTimestamps(targetCount, opts.spread);
  const generatedCommits = [];

  let gitUser = null;
  if (!opts.dryRun) {
    gitUser = configureGitUser(opts.authorName, opts.authorEmail);
  }

  for (let i = 0; i < targetCount; i++) {
    const message = generateCommitMessage(opts.theme, i, targetCount);
    const timestamp = timestamps[i];
    const isoDate = timestamp.toISOString();

    generatedCommits.push({
      index: i + 1,
      message,
      timestamp: isoDate,
    });

    if (opts.dryRun) {
      if (!opts.quiet) {
        console.log(`[DRY RUN ${i + 1}/${targetCount}] (${isoDate.slice(11, 19)}) ${message}`);
      }
      continue;
    }

    // Live update telemetry files
    updateTelemetryFile(opts.file, i, targetCount, message, timestamp);

    // Git stage changed files
    try {
      runGit(`git add "${opts.file}" docs/ACTIVITY.md`);
      
      const gitEnv = {
        GIT_AUTHOR_DATE: isoDate,
        GIT_COMMITTER_DATE: isoDate,
      };

      // Create git commit
      runGit(`git commit -m "${message}"`, gitEnv);

      if (!opts.quiet) {
        console.log(`✓ Commit ${i + 1}/${targetCount} created: [${isoDate.slice(11, 19)}] ${message}`);
      }
    } catch (err) {
      console.error(`❌ Failed to create commit ${i + 1}: ${err.message}`);
      throw err;
    }
  }

  if (opts.push && !opts.dryRun) {
    if (!opts.quiet) {
      console.log(`\n📡 Pushing ${targetCount} commits to remote origin...`);
    }
    try {
      let currentBranch = 'main';
      try {
        currentBranch = runGit('git rev-parse --abbrev-ref HEAD').trim();
      } catch {
        currentBranch = 'main';
      }
      runGit(`git push origin ${currentBranch}`);
      if (!opts.quiet) {
        console.log(`✨ Successfully pushed all commits to origin/${currentBranch}!`);
      }
    } catch (err) {
      console.error(`❌ Git push failed: ${err.message}`);
      throw err;
    }
  }

  if (!opts.quiet) {
    console.log(`\n🎉 Completed ${targetCount} auto-commit(s) successfully.\n`);
  }

  return {
    success: true,
    count: targetCount,
    commits: generatedCommits,
  };
}

// Auto-run when executed directly from CLI
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  runAutoCommit(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
