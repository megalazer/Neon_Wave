#!/usr/bin/env bash

# Setup crontab entry for daily automatic commits (macOS / Linux)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NODE_PATH="$(which node || echo "/usr/local/bin/node")"
CRON_SCHEDULE="${1:-"30 10 * * *"}" # Default: 10:30 AM every day

echo "=========================================="
echo "⚡ Neon Wave Crontab Installer ⚡"
echo "=========================================="
echo "Repository: $REPO_DIR"
echo "Node Path:  $NODE_PATH"
echo "Schedule:   $CRON_SCHEDULE"
echo "=========================================="

CRON_CMD="cd $REPO_DIR && $NODE_PATH scripts/auto_commit.mjs --count 10 --spread --push >> $REPO_DIR/cron_autocommit.log 2>&1"
CRON_TAG="# NEON_WAVE_AUTO_COMMIT"

# Read existing crontab
CURRENT_CRON="$(crontab -l 2>/dev/null || echo "")"

# Remove existing tag if present
FILTERED_CRON="$(echo "$CURRENT_CRON" | grep -v "$CRON_TAG" || true)"

# Add new cron line
NEW_CRON="$(echo -e "${FILTERED_CRON}\n${CRON_SCHEDULE} ${CRON_CMD} ${CRON_TAG}")"

# Install new crontab
echo "$NEW_CRON" | sed '/^$/N;/^\n$/D' | crontab -

echo ""
echo "✅ Crontab installed successfully!"
echo "Current crontab:"
crontab -l | grep "$CRON_TAG"
echo ""
echo "To remove crontab later:"
echo "  crontab -l | grep -v '$CRON_TAG' | crontab -"
