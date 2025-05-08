import { getOrderStatus } from '@/lib/crossmint';
import { createLogger } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

// Create a logger for the get-order-status API route
const logger = createLogger('API:GET-ORDER-STATUS');

export async function GET(request: NextRequest) {
  try {
    // Get orderId from the query string
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      const errorMessage = 'Missing required parameter: orderId';
      logger.log('Validation error:', { errorMessage });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    logger.log('Checking order status', { orderId });
    const response = await getOrderStatus(orderId);
    
    logger.log('Order status response received', {
      orderId,
      status: response.order?.payment?.status,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    logger.error('Error checking order status:', error);
    
    return NextResponse.json(
      { error: 'Failed to get order status' },
      { status: 500 }
    );
  }
} 