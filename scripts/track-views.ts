#!/usr/bin/env node
/**
 * Cron script for tracking engagement (views, likes, comments)
 * Run hourly via crontab
 */

import * as path from 'path';
import * as fs from 'fs';
import { trackAllEngagement } from '../src/utils/tracking/processor';

// Custom logger that writes to both console and detailed log file
class DetailedLogger {
  private detailedLogFile: string;
  
  constructor(logFile: string) {
    this.detailedLogFile = logFile;
  }
  
  log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    // Write to console
    console.log(message);
    
    // Write to detailed log file
    fs.appendFileSync(this.detailedLogFile, logEntry + '\n');
  }
  
  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? ` - ${error.toString()}` : '';
    const logEntry = `[${timestamp}] ERROR: ${message}${errorDetails}`;
    
    // Write to console
    console.error(message, error);
    
    // Write to detailed log file
    fs.appendFileSync(this.detailedLogFile, logEntry + '\n');
  }
}

// Override console.log and console.error to capture platform logs
function setupDetailedLogging(detailedLogFile: string) {
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    // Call original console.log
    originalLog(...args);
    
    // Write to detailed log file
    fs.appendFileSync(detailedLogFile, logEntry + '\n');
  };
  
  console.error = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    
    // Call original console.error
    originalError(...args);
    
    // Write to detailed log file
    fs.appendFileSync(detailedLogFile, logEntry + '\n');
  };
}

async function main() {
  const startTime = new Date();
  
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.resolve(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Set up detailed logging
    const dateStr = startTime.toISOString().split('T')[0];
    const detailedLogFile = path.resolve(logsDir, `engagement-tracking-detailed-${dateStr}.log`);
    const summaryLogFile = path.resolve(logsDir, `engagement-tracking-${dateStr}.log`);
    
    // Override console logging to capture all platform logs
    setupDetailedLogging(detailedLogFile);
    
    console.log(`Starting engagement tracking job`);
    console.log(`Detailed logs will be written to: ${detailedLogFile}`);
    console.log(`Summary logs will be written to: ${summaryLogFile}`);
    
    // Run the engagement tracking process (views, likes, comments)
    const result = await trackAllEngagement();
    
    // Log the results
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    console.log(`Engagement tracking completed in ${duration}s`);
    console.log(`Results: Tracked: ${result.tracked}, Skipped: ${result.skipped}, Errors: ${result.error}`);
    
    // Write summary to the main log file (same format as before)
    const logEntry = {
      timestamp: endTime.toISOString(),
      duration,
      ...result,
      message: "Engagement tracking completed successfully"
    };
    
    fs.appendFileSync(
      summaryLogFile, 
      JSON.stringify(logEntry) + '\n'
    );
    
    console.log(`Summary written to: ${summaryLogFile}`);
    
    process.exit(0);
  } catch (error) {
    console.error(`Engagement tracking failed:`, error);
    process.exit(1);
  }
}

main(); 