// Utility functions

/**
 * Global debug flag - set to false to disable all debug logging
 */
export const DEBUG_ENABLED = true;

/**
 * Creates a namespaced debug logger
 */
export function createLogger(namespace: string) {
  return {
    // @ts-ignore
    log: (message: string, data?: any) => {
      if (DEBUG_ENABLED) {
        console.log(`[${namespace}] ${message}`);
        if (data !== undefined) {
          console.log(JSON.stringify(data, null, 2));
        }
      }
    },
    // @ts-ignore
    error: (message: string, error?: any) => {
      if (DEBUG_ENABLED) {
        console.error(`[${namespace}] ${message}`);
        if (error) {
          console.error(error);
        }
      }
    },
    // @ts-ignore
    warn: (message: string, data?: any) => {
      if (DEBUG_ENABLED) {
        console.warn(`[${namespace}] ${message}`);
        if (data !== undefined) {
          console.warn(JSON.stringify(data, null, 2));
        }
      }
    },
    // @ts-ignore
    info: (message: string, data?: any) => {
      if (DEBUG_ENABLED) {
        console.info(`[${namespace}] ${message}`);
        if (data !== undefined) {
          console.info(JSON.stringify(data, null, 2));
        }
      }
    }
  };
}

/**
 * Formats a number as USD currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Generates a mock wallet address for demo purposes
 */
export function generateMockWalletAddress(): string {
  // Generate a random string for demo purposes
  return `wallet_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generates a mock user's email for demo purposes
 */
export function generateMockEmail(): string {
  return `user${Math.floor(Math.random() * 10000)}@example.com`;
}

/**
 * Gets the payment status label based on the status code
 */
export function getPaymentStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'requires-kyc': 'KYC Required',
    'awaiting-payment': 'Ready for Payment',
    'rejected-kyc': 'KYC Rejected',
    'manual-kyc': 'Manual KYC Review',
    'completed': 'Completed',
    'failed': 'Failed',
  };
  
  return statusMap[status] || status;
}

/**
 * Validates if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Basic check for Solana addresses which are base58 encoded strings of a specific length
  return Boolean(address && address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/));
}

/**
 * Validates if a string is a valid Ethereum address
 */
export function isValidEthAddress(address: string): boolean {
  // Basic check for Ethereum addresses (0x followed by 40 hex characters)
  return Boolean(address && address.match(/^0x[a-fA-F0-9]{40}$/));
}

/**
 * Validates if a string is a valid email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
}

/**
 * Truncates a string (like a wallet address) for display
 */
export function truncateAddress(address: string, startChars = 4, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
} 