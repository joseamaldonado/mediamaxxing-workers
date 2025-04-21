#!/usr/bin/env node
/**
 * Cron script for processing payments
 * Run every 6 hours via crontab
 */

import * as path from 'path';
import * as fs from 'fs';
import { processPayments } from '../src/utils/payments';

async function main() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting payment processing job`);
  
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.resolve(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Run the payment processing
    const result = await processPayments();
    
    // Log the results
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    console.log(`[${endTime.toISOString()}] Payment processing completed in ${duration}s`);
    
    // Calculate success and failure counts
    let successCount = 0;
    let failureCount = 0;
    let totalPaid = 0;
    
    if (result.success && result.results) {
      result.results.forEach(r => {
        if (r.success) {
          successCount++;
          totalPaid += r.amount || 0;
        } else {
          failureCount++;
        }
      });
      
      console.log(`Results: Success: ${successCount}, Failed: ${failureCount}, Total Paid: $${totalPaid.toFixed(2)}`);
    } else {
      console.log(`Processing failed: ${result.error || 'Unknown error'}`);
    }
    
    // Also write to a log file
    const logEntry = {
      timestamp: endTime.toISOString(),
      duration,
      successCount,
      failureCount,
      totalPaid,
      ...result
    };
    
    const logFile = path.resolve(logsDir, `payment-processing-${startTime.toISOString().split('T')[0]}.log`);
    fs.appendFileSync(
      logFile, 
      JSON.stringify(logEntry) + '\n'
    );
    
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Payment processing failed:`, error);
    process.exit(1);
  }
}

main(); 