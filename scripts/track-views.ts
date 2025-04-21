#!/usr/bin/env node
/**
 * Cron script for tracking views
 * Run hourly via crontab
 */

import * as path from 'path';
import * as fs from 'fs';
import { trackAllViews } from '../src/utils/tracking/processor';

async function main() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting view tracking job`);
  
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.resolve(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Run the view tracking process
    const result = await trackAllViews();
    
    // Log the results
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    console.log(`[${endTime.toISOString()}] View tracking completed in ${duration}s`);
    console.log(`Results: Tracked: ${result.tracked}, Skipped: ${result.skipped}, Errors: ${result.error}`);
    
    // Also write to a log file
    const logEntry = {
      timestamp: endTime.toISOString(),
      duration,
      ...result
    };
    
    const logFile = path.resolve(logsDir, `view-tracking-${startTime.toISOString().split('T')[0]}.log`);
    fs.appendFileSync(
      logFile, 
      JSON.stringify(logEntry) + '\n'
    );
    
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] View tracking failed:`, error);
    process.exit(1);
  }
}

main(); 