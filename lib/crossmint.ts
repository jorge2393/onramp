// Crossmint API service helper functions
import { createLogger } from './utils';

const CROSSMINT_API_BASE_URL = 'https://staging.crossmint.com/api/2022-06-09';

// Create a logger for Crossmint-related operations
const logger = createLogger('CROSSMINT');

/**
 * Creates a new order using Crossmint's API
 */
export async function createOrder(amount: string, walletAddress: string, email: string, country?: string) {
  try {
    const requestBody = {
      lineItems: [
        {
          // Using Base Sepolia token as specified in the curl command
          tokenLocator: "base-sepolia:0x036CbD53842c5426634e7929541eC2318f3dCF7e:0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          executionParameters: {
            mode: 'exact-in',
            amount,
          },
        },
      ],
      payment: {
        method: 'checkoutcom-flow',
        receiptEmail: email,
      },
      recipient: {
        walletAddress,
      },
      metadata: {
        country: country || 'Unknown',
      }
    };

    // Check for API key and log its presence
    logger.log('Creating order with parameters:', {
      url: `${CROSSMINT_API_BASE_URL}/orders`,
      apiKey: process.env.CROSSMINT_API_KEY ? 'Present (masked)' : 'Missing',
      apiKeyStartsWith: process.env.CROSSMINT_API_KEY ? process.env.CROSSMINT_API_KEY.substring(0, 5) + '...' : 'N/A',
      body: requestBody,
      country,
    });

    const response = await fetch(`${CROSSMINT_API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CROSSMINT_API_KEY || '',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      logger.log('Order creation failed:', {
        status: response.status,
        statusText: response.statusText,
        response: responseData
      });
      throw new Error(`Error creating order: ${response.statusText}`);
    }

    logger.log('Order created successfully:', responseData);
    return responseData;
  } catch (error) {
    logger.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Gets the status of an existing order
 */
export async function getOrderStatus(orderId: string) {
  try {
    logger.log('Getting order status:', {
      url: `${CROSSMINT_API_BASE_URL}/orders/${orderId}`,
      apiKey: process.env.CROSSMINT_API_KEY ? 'Present (masked)' : 'Missing',
    });

    const response = await fetch(`${CROSSMINT_API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CROSSMINT_API_KEY || '',
      },
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      logger.log('Order status check failed:', {
        status: response.status,
        statusText: response.statusText,
        response: responseData
      });
      throw new Error(`Error getting order status: ${response.statusText}`);
    }

    logger.log('Order status retrieved successfully:', responseData);
    return responseData;
  } catch (error) {
    logger.error('Error getting order status:', error);
    throw error;
  }
} 