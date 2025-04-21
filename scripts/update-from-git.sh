#!/bin/bash

# Script to update the codebase from git repository
# To be run as a cron job

# Log file for update operations
LOG_FILE="logs/git-updates.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Change to the root directory of the project
cd "$(dirname "$0")/.." || {
  echo "[$TIMESTAMP] Failed to change to project directory" >> "$LOG_FILE"
  exit 1
}

echo "[$TIMESTAMP] Starting git update process" >> "$LOG_FILE"

# Make sure the logs directory exists
mkdir -p logs

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "[$TIMESTAMP] Error: Not a git repository" >> "$LOG_FILE"
  exit 1
fi

# Save the current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "[$TIMESTAMP] Current branch: $CURRENT_BRANCH" >> "$LOG_FILE"

# Fetch the latest changes
echo "[$TIMESTAMP] Fetching latest changes from remote..." >> "$LOG_FILE"
git fetch origin "$CURRENT_BRANCH" >> "$LOG_FILE" 2>&1

# Check if there are any updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/"$CURRENT_BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[$TIMESTAMP] Already up-to-date" >> "$LOG_FILE"
  exit 0
fi

# Pull the changes
echo "[$TIMESTAMP] Pulling latest changes..." >> "$LOG_FILE"
git pull origin "$CURRENT_BRANCH" >> "$LOG_FILE" 2>&1
PULL_STATUS=$?

if [ $PULL_STATUS -ne 0 ]; then
  echo "[$TIMESTAMP] Error: Failed to pull latest changes" >> "$LOG_FILE"
  exit 1
fi

# Install any new dependencies
echo "[$TIMESTAMP] Installing dependencies..." >> "$LOG_FILE"
npm install >> "$LOG_FILE" 2>&1
NPM_STATUS=$?

if [ $NPM_STATUS -ne 0 ]; then
  echo "[$TIMESTAMP] Warning: npm install failed, but continuing..." >> "$LOG_FILE"
fi

# Rebuild the project
echo "[$TIMESTAMP] Building project..." >> "$LOG_FILE"
npm run build >> "$LOG_FILE" 2>&1
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
  echo "[$TIMESTAMP] Error: Build failed" >> "$LOG_FILE"
  exit 1
fi

echo "[$TIMESTAMP] Successfully updated from git repository" >> "$LOG_FILE"
echo "[$TIMESTAMP] Local: $LOCAL -> Remote: $REMOTE" >> "$LOG_FILE"

# Restart any necessary services
# Uncomment if you have services to restart
# echo "[$TIMESTAMP] Restarting services..." >> "$LOG_FILE"
# pm2 restart all >> "$LOG_FILE" 2>&1

exit 0 