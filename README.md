# Whop Workers

Standalone background workers for handling view tracking and payment processing for creator content campaigns.

## Overview

This project contains isolated background jobs designed to run on a separate server from the main Whop application. These workers handle:

1. **View Tracking**: Hourly checks for new views on creator content across YouTube, TikTok, and Instagram.
2. **Payment Processing**: Daily processing of payouts to creators based on new views.
3. **Automatic Updates**: Regular pulls from the git repository to keep the codebase up to date.

## Requirements

- Node.js (v18+)
- npm (v9+)
- Linux/Unix server with cron
- Git
- Stripe account
- Supabase database

## Setup

1. Clone the repository:
   ```
   git clone <repository-url> whop-workers
   cd whop-workers
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with the following environment variables:
   ```
   # Supabase keys
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Stripe keys
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-webhook-secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key

   # API keys for view tracking
   YOUTUBE_API_KEY=your-youtube-api-key
   APIFY_API_TOKEN=your-apify-token
   ```

4. Set up cron jobs:
   ```
   ./scripts/setup-cron.sh
   ```

## Cron Jobs

The `setup-cron.sh` script will configure the following cron jobs:

1. **View Tracking**: Runs every hour to check for new views on creator content across platforms.
   ```
   0 * * * * cd /path/to/whop-workers && ./scripts/track-views.sh
   ```

2. **Payment Processing**: Runs daily at midnight to process payments for new views.
   ```
   0 0 * * * cd /path/to/whop-workers && ./scripts/process-payments.sh
   ```

3. **Git Updates**: Pulls the latest code every 6 hours to keep the system up to date.
   ```
   0 */6 * * * cd /path/to/whop-workers && ./scripts/update-from-git.sh
   ```

## Logs

All jobs generate detailed logs in the `logs` directory:

- `view-tracking-YYYY-MM-DD.log`: Results from the view tracking job
- `view-tracking-error-YYYY-MM-DD.log`: Error output from the view tracking job
- `payment-processing-YYYY-MM-DD.log`: Results from the payment processing job
- `payment-processing-error-YYYY-MM-DD.log`: Error output from the payment processing job
- `git-updates-YYYY-MM-DD.log`: Information about git updates
- `git-updates-error-YYYY-MM-DD.log`: Error output from git update operations

This dual-logging approach keeps standard output and error messages separate, making it easier to troubleshoot issues.

## Manual Execution

You can run jobs manually:

1. Track views:
   ```
   npm run track-views
   ```

2. Process payments:
   ```
   npm run process-payments
   ```

3. Update from git:
   ```
   ./scripts/update-from-git.sh
   ```

## Troubleshooting

If you encounter any issues:

1. Check the log files in the `logs` directory
2. Ensure environment variables are correctly set
3. Verify Supabase and Stripe credentials
4. Check for sufficient funds in your Stripe account for transfers

## License

Proprietary - All Rights Reserved 