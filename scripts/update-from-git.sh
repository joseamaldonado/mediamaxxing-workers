#!/bin/bash

# Script to update the codebase from git repository
# To be run as a cron job

# Create logs directory if it doesn't exist
mkdir -p logs

# Get current date for log files
DATE=$(date +"%Y-%m-%d")
LOG_FILE="logs/git-updates-${DATE}.log"
ERROR_LOG_FILE="logs/git-updates-error-${DATE}.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Change to the root directory of the project
cd "$(dirname "$0")/.." || {
  echo "[$TIMESTAMP] Failed to change to project directory" | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
  exit 1
}

echo "[$TIMESTAMP] Starting git update process" | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "[$TIMESTAMP] Error: Not a git repository" | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
  exit 1
fi

# Save the current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "[$TIMESTAMP] Current branch: $CURRENT_BRANCH" >> "$LOG_FILE"

# Fetch the latest changes
echo "[$TIMESTAMP] Fetching latest changes from remote..." >> "$LOG_FILE"
git fetch origin "$CURRENT_BRANCH" 1>> "$LOG_FILE" 2>> "$ERROR_LOG_FILE"
FETCH_STATUS=$?

if [ $FETCH_STATUS -ne 0 ]; then
  echo "[$TIMESTAMP] Warning: Failed to fetch from remote. Repository may not be configured or network issue." | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
  # Continue execution - this might be first run without remote configured
fi

# Try to get the local and remote SHAs
LOCAL=$(git rev-parse HEAD 2>/dev/null)
if git rev-parse "origin/$CURRENT_BRANCH" >/dev/null 2>&1; then
  REMOTE=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null)
  
  if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$TIMESTAMP] Already up-to-date" >> "$LOG_FILE"
    exit 0
  fi

  # Pull the changes
  echo "[$TIMESTAMP] Pulling latest changes..." >> "$LOG_FILE"
  git pull origin "$CURRENT_BRANCH" 1>> "$LOG_FILE" 2>> "$ERROR_LOG_FILE"
  PULL_STATUS=$?

  if [ $PULL_STATUS -ne 0 ]; then
    echo "[$TIMESTAMP] Error: Failed to pull latest changes" | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
    exit 1
  fi
else
  echo "[$TIMESTAMP] Remote branch not found. Skipping pull operation." | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
fi

# Install any new dependencies
echo "[$TIMESTAMP] Installing dependencies..." >> "$LOG_FILE"
npm install 1>> "$LOG_FILE" 2>> "$ERROR_LOG_FILE"
NPM_STATUS=$?

if [ $NPM_STATUS -ne 0 ]; then
  echo "[$TIMESTAMP] Warning: npm install failed, but continuing..." | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
fi

# Rebuild the project
echo "[$TIMESTAMP] Building project..." >> "$LOG_FILE"
npm run build 1>> "$LOG_FILE" 2>> "$ERROR_LOG_FILE"
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
  echo "[$TIMESTAMP] Error: Build failed" | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
  exit 1
fi

echo "[$TIMESTAMP] Successfully completed update process" | tee -a "$LOG_FILE"
if [ -n "$LOCAL" ] && [ -n "$REMOTE" ]; then
  echo "[$TIMESTAMP] Updated from: $LOCAL -> $REMOTE" >> "$LOG_FILE"
fi

# Restart any necessary services
# Uncomment if you have services to restart
# echo "[$TIMESTAMP] Restarting services..." >> "$LOG_FILE"
# pm2 restart all >> "$LOG_FILE" 2>&1

exit 0 