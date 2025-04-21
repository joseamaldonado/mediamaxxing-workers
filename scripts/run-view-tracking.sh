#!/bin/bash
# Run view tracking script

# Create logs directory if it doesn't exist
mkdir -p /Users/josemaldonado/Development/projects/whop/whop-workers/logs

# Get current date for log files
DATE=$(date +"%Y-%m-%d")
LOG_FILE="/Users/josemaldonado/Development/projects/whop/whop-workers/logs/view-tracking-${DATE}.log"
ERROR_LOG_FILE="/Users/josemaldonado/Development/projects/whop/whop-workers/logs/view-tracking-error-${DATE}.log"

# Change to the project directory
cd /Users/josemaldonado/Development/projects/whop

# Load NVM if present
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm use 18 || nvm use --lts
fi

# Add timestamp to log entry
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Starting view tracking job" | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"

# Run the script, logging stdout to log file and stderr to error log file
npx ts-node whop-workers/scripts/track-views.ts 1>> "$LOG_FILE" 2>> "$ERROR_LOG_FILE"

# Log completion status
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] View tracking job completed successfully (exit: $EXIT_CODE)" >> "$LOG_FILE"
else
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] View tracking job failed with exit code: $EXIT_CODE" | tee -a "$LOG_FILE" "$ERROR_LOG_FILE"
fi 