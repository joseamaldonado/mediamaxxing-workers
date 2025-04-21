import { processPayments } from '../utils/payments';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Define the return type based on the implementation
type ProcessPaymentsResult = {
  success: boolean;
  error?: string;
  message?: string;
  results?: Array<{
    submissionId?: string;
    success: boolean;
    error?: string;
    message?: string;
    transfer?: string;
    amount?: number;
    views?: number;
  }>;
};

// Load environment variables from .env file
dotenv.config();

// Initialize log file
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'payment-processing.log');

// Function to log results
function logResults(successCount: number, failureCount: number, errors: string[]) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Processed payments: ${successCount} successful, ${failureCount} failed\n`;
  
  let errorLog = '';
  if (errors.length > 0) {
    errorLog = `Errors:\n${errors.join('\n')}\n`;
  }
  
  fs.appendFileSync(logFile, logEntry + errorLog);
  console.log(logEntry);
  if (errorLog) console.log(errorLog);
}

// Main function to run payment processing
async function runPaymentProcessing() {
  console.log('Starting payment processing...');
  
  try {
    // Process payments
    const result = await processPayments() as ProcessPaymentsResult;
    
    if (!result.success) {
      console.error('Payment processing failed:', result.error);
      logResults(0, 1, [result.error || 'Unknown error']);
      return { successCount: 0, failureCount: 1 };
    }
    
    // Parse results
    const successCount = result.results?.filter(r => r.success).length || 0;
    const failureCount = result.results?.filter(r => !r.success).length || 0;
    const errors = result.results?.filter(r => !r.success).map(r => r.error || 'Unknown error') || [];
    
    // Log results
    logResults(successCount, failureCount, errors);
    
    return { successCount, failureCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in payment processing:', errorMessage);
    logResults(0, 0, [errorMessage]);
    
    return { successCount: 0, failureCount: 0 };
  }
}

// Run the payment processing
runPaymentProcessing()
  .then(({ successCount, failureCount }) => {
    console.log(`Payment processing completed: ${successCount} successful, ${failureCount} failed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error in payment processing:', error);
    process.exit(1);
  }); 