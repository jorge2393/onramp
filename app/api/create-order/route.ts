import { createOrder } from '@/lib/crossmint';
import { createLogger } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

// Create a logger for the create-order API route
const logger = createLogger('API:CREATE-ORDER');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, walletAddress, email, country } = body;

    logger.log('Request received:', {
      amount,
      walletAddress: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : null,
      email: email ? email.substring(0, 2) + '***@' + email.split('@')[1] : null,
      country, // Just log the country for tracking purposes
    });

    if (!amount || !walletAddress || !email) {
      const errorMessage = 'Missing required fields: amount, walletAddress, or email';
      logger.log('Validation error:', { errorMessage });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Country filtering is handled on the client side

    logger.log('Calling Crossmint API');
    const response = await createOrder(amount, walletAddress, email);
    
    logger.log('Response received from Crossmint', {
      orderId: response.order?.orderId,
      status: response.order?.payment?.status,
      country, // Log the country with the response for analytics
    });

    return NextResponse.json(response);
  } catch (error: any) {
    logger.error('Error processing order creation:', error);
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 