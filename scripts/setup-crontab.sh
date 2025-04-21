#!/bin/bash
# Setup crontab for tracking and payment scripts

# Make scripts executable
chmod +x "$(dirname "$0")/run-view-tracking.sh"
chmod +x "$(dirname "$0")/run-payment-processing.sh"

# Create a temporary file with current crontab
crontab -l > /tmp/current-crontab 2>/dev/null || echo "" > /tmp/current-crontab

# Check if entries already exist
if grep -q "run-view-tracking.sh" /tmp/current-crontab; then
  echo "View tracking cron job already exists"
else
  # Add view tracking job (run every hour at minute 0)
  echo "0 * * * * $(dirname "$0")/run-view-tracking.sh" >> /tmp/current-crontab
  echo "Added view tracking cron job"
fi

if grep -q "run-payment-processing.sh" /tmp/current-crontab; then
  echo "Payment processing cron job already exists"
else
  # Add payment processing job (run every 6 hours at minute 0)
  echo "0 */6 * * * $(dirname "$0")/run-payment-processing.sh" >> /tmp/current-crontab
  echo "Added payment processing cron job"
fi

# Install the updated crontab
crontab /tmp/current-crontab
rm /tmp/current-crontab

echo "Crontab setup complete. Current crontab:"
crontab -l 