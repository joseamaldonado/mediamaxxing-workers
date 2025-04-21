# Whop Workers

Cron jobs for view tracking and payment processing.

## Overview

This package contains scripts to run the view tracking and payment processing functions as cron jobs:

- **View Tracking**: Runs hourly to track views on content submissions
- **Payment Processing**: Runs every 6 hours to process payments for creators

## Setup

### Local Development

```bash
# Install dependencies
npm install

# Run view tracking manually
npm run track-views

# Run payment processing manually
npm run process-payments
```

### VPS Deployment

1. Clone this repository to your VPS:

```bash
# Assuming you're starting in your home directory
cd ~
git clone [your-repo-url] whop
cd whop
```

2. Copy your .env files:

```bash
# Copy your .env files to the whop-website directory
scp .env.local user@your-vps-ip:~/whop/whop-website/.env.local
```

3. Install dependencies:

```bash
# Install dependencies for the website
cd whop-website
npm install

# Install dependencies for the workers
cd ../whop-workers
npm install
```

4. Set up the cron jobs:

```bash
# Make scripts executable and set up crontab
npm run setup
```

### Logs

Logs are stored in the `logs` directory:

- Daily log files for each job (view-tracking-YYYY-MM-DD.log)
- Continuous logs (cron-view-tracking.log, cron-payment-processing.log)

## Cron Schedule

- View Tracking: Every hour at minute 0 (`0 * * * *`)
- Payment Processing: Every 6 hours at minute 0 (`0 */6 * * *`)

## Manual Execution

You can run the scripts manually:

```bash
# Run view tracking
ts-node scripts/track-views.ts

# Run payment processing
ts-node scripts/process-payments.ts
``` 