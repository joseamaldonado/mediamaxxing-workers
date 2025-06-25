#!/bin/bash
# Run engagement tracking script

# Get current date for log files
DATE=$(date +"%Y-%m-%d")

# Determine the correct project path based on environment
if [ -d "/root/whop-workers" ]; then
    # VPS environment
    PROJECT_PATH="/root/whop-workers"
    NODE_PATH="/root/.nvm/versions/node/v20.17.0/bin"
    export PATH="$NODE_PATH:$PATH"
elif [ -d "/Users/josemaldonado/Development/projects/whop/whop-workers" ]; then
    # Local development environment
    PROJECT_PATH="/Users/josemaldonado/Development/projects/whop/whop-workers"
else
    echo "Error: Could not find whop-workers directory"
    exit 1
fi

# Change to project directory
cd "$PROJECT_PATH" || exit 1

# Create logs directory if it doesn't exist
mkdir -p "${PROJECT_PATH}/logs"

# Log files for cron output (separate from the detailed logs created by the script itself)
STDOUT_LOG_FILE="${PROJECT_PATH}/logs/engagement-tracking-stdout-${DATE}.log"
ERROR_LOG_FILE="${PROJECT_PATH}/logs/engagement-tracking-error-${DATE}.log"

# Add timestamp to cron output logs
echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")] Starting engagement tracking cron job" >> "$STDOUT_LOG_FILE"

# Run the tracking script
# The script itself will create:
# - engagement-tracking-detailed-YYYY-MM-DD.log (all detailed platform logs)
# - engagement-tracking-YYYY-MM-DD.log (summary only)
npx tsx scripts/track-views.ts >> "$STDOUT_LOG_FILE" 2>> "$ERROR_LOG_FILE"

# Capture exit code
EXIT_CODE=$?

# Add completion timestamp to cron output logs
echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")] Engagement tracking cron job completed with exit code: $EXIT_CODE" >> "$STDOUT_LOG_FILE"

# Exit with the same code as the tracking script
exit $EXIT_CODE 