#!/bin/bash

# This script sets up all necessary cron jobs for the whop-workers system
# Run this script once during deployment or configuration changes

# Change to the project's root directory
cd "$(dirname "$0")/.." || {
  echo "Failed to change to project directory"
  exit 1
}

# Make scripts executable
chmod +x scripts/track-views.sh
chmod +x scripts/process-payments.sh
chmod +x scripts/update-from-git.sh

# Get the absolute path to the project directory
PROJECT_DIR=$(pwd)

# Create temporary crontab file
TMP_CRONTAB=$(mktemp)

# Export current crontab
crontab -l > "$TMP_CRONTAB" 2>/dev/null || echo "# New crontab" > "$TMP_CRONTAB"

# Check if our jobs are already in the crontab
if grep -q "whop-workers" "$TMP_CRONTAB"; then
  echo "Whop workers cron jobs already exist. Updating..."
  # Remove existing whop-workers jobs
  grep -v "whop-workers" "$TMP_CRONTAB" > "${TMP_CRONTAB}.new"
  mv "${TMP_CRONTAB}.new" "$TMP_CRONTAB"
else
  echo "Adding whop-workers cron jobs..."
fi

# Add header comment
echo "" >> "$TMP_CRONTAB"
echo "# whop-workers cron jobs - $(date)" >> "$TMP_CRONTAB"

# Track views every hour
echo "0 * * * * cd $PROJECT_DIR && ./scripts/track-views.sh # whop-workers" >> "$TMP_CRONTAB"

# Process payments every day at midnight
echo "0 0 * * * cd $PROJECT_DIR && ./scripts/process-payments.sh # whop-workers" >> "$TMP_CRONTAB"

# Pull from git repository every 6 hours
echo "0 */6 * * * cd $PROJECT_DIR && ./scripts/update-from-git.sh # whop-workers" >> "$TMP_CRONTAB"

# Install the new crontab
crontab "$TMP_CRONTAB"
CRONTAB_STATUS=$?

# Remove temporary file
rm "$TMP_CRONTAB"

if [ $CRONTAB_STATUS -eq 0 ]; then
  echo "Cron jobs successfully installed!"
  echo "The following jobs have been scheduled:"
  echo "  - Track views: Every hour on the hour"
  echo "  - Process payments: Daily at midnight"
  echo "  - Update from git: Every 6 hours"
else
  echo "Failed to install cron jobs. Please check your permissions."
  exit 1
fi

# Create wrapper shell scripts if they don't exist
if [ ! -f scripts/track-views.sh ]; then
  cat > scripts/track-views.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."
node -r ts-node/register scripts/track-views.ts
EOF
  chmod +x scripts/track-views.sh
  echo "Created track-views.sh wrapper script"
fi

if [ ! -f scripts/process-payments.sh ]; then
  cat > scripts/process-payments.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."
node -r ts-node/register scripts/process-payments.ts
EOF
  chmod +x scripts/process-payments.sh
  echo "Created process-payments.sh wrapper script"
fi

echo "Setup complete! The system will now automatically:"
echo "  - Track creator content views hourly"
echo "  - Process pending payments daily"
echo "  - Pull the latest code from git every 6 hours"
echo ""
echo "You can edit these schedules by running 'crontab -e' and modifying the entries." 