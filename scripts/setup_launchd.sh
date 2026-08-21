#!/usr/bin/env bash

# Setup macOS LaunchAgent daemon for daily automatic commits
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NODE_PATH="$(which node || echo "/usr/local/bin/node")"

PLIST_NAME="com.neonwave.autocommit"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
LOG_DIR="$HOME/Library/Logs/NeonWave"

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$LOG_DIR"

echo "=========================================="
echo "⚡ Neon Wave LaunchAgent Daemon Installer ⚡"
echo "=========================================="
echo "Repository: $REPO_DIR"
echo "Node Path:  $NODE_PATH"
echo "Plist Path: $PLIST_PATH"
echo "Log Path:   $LOG_DIR/autocommit.log"
echo "=========================================="

# Unload existing agent if active
if launchctl list | grep -q "$PLIST_NAME"; then
  echo "Unloading existing LaunchAgent..."
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# Write launchd plist (runs daily at 10:30 AM local time)
cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_PATH}</string>
        <string>${REPO_DIR}/scripts/auto_commit.mjs</string>
        <string>--count</string>
        <string>10</string>
        <string>--spread</string>
        <string>--push</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${REPO_DIR}</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>10</integer>
        <key>Minute</key>
        <integer>30</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/autocommit.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/autocommit_err.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.nvm/versions/node/$(node -v 2>/dev/null || echo "current")/bin:$HOME/.local/bin</string>
    </dict>
</dict>
</plist>
EOF

# Load daemon
launchctl load "$PLIST_PATH"

echo ""
echo "✅ LaunchAgent installed & loaded successfully!"
echo "It will run automatically every day at 10:30 AM."
echo ""
echo "To test run manually right now:"
echo "  launchctl start $PLIST_NAME"
echo ""
echo "To check output logs:"
echo "  cat $LOG_DIR/autocommit.log"
echo ""
echo "To uninstall in the future:"
echo "  launchctl unload $PLIST_PATH && rm $PLIST_PATH"
