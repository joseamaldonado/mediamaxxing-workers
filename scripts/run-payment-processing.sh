#!/bin/bash
# Run payment processing script

# Change to the project directory
cd /Users/josemaldonado/Development/projects/whop

# Load NVM if present
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm use 18 || nvm use --lts
fi

# Compile and run the TypeScript script
npx ts-node whop-workers/scripts/process-payments.ts >> whop-workers/logs/cron-payment-processing.log 2>&1 