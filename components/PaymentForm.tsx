'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createLogger } from '@/lib/utils';

// Create a logger
const logger = createLogger('COMP:PaymentForm');

interface PaymentFormProps {
  paymentSession: string;
  publicKey: string;
  orderId?: string;
  onPaymentSuccess: () => void;
  onPaymentFailure: (error: any) => void;
}

export default function PaymentForm({
  paymentSession,
  publicKey,
  orderId,
  onPaymentSuccess,
  onPaymentFailure
}: PaymentFormProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const checkoutRef = useRef<any>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'initial' | 'processing' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formRef = useRef<any>(null);

  // Memoize event handlers for better performance
  const handleSuccess = useCallback((component: any, paymentResponse: any) => {
    console.log('-------- PAYMENT SUCCESS --------');
    console.log('Payment successful', paymentResponse);
    logger.log('Payment successful', { paymentResponse });
    setPaymentInitialized(false);
    onPaymentSuccess();
  }, [onPaymentSuccess]);

  const handleFailure = useCallback((component: any, error: any) => {
    console.log('-------- PAYMENT FAILURE --------');
    console.log('Payment failed', error);
    const errorMsg = error?.message || 'Payment failed';
    logger.error('Payment failed', { error });
    setError(errorMsg);
    setPaymentInitialized(false);
    onPaymentFailure(error);
  }, [onPaymentFailure]);

  const onReset = () => {
    console.log('Resetting payment form');
    // Simple approach: reload the page to reset the payment form
    window.location.reload();
  };

  // Load Checkout.com script only when component mounts
  useEffect(() => {
    console.log('-------- PAYMENT INITIALIZATION --------');
    console.log(`Initializing Payment for order ID: ${orderId || 'Unknown'}`);
    console.log(`Payment Session available: ${!!paymentSession}`);
    console.log(`Public Key available: ${!!publicKey}`);
    
    logger.log('Initializing PaymentForm component', { 
      paymentSessionProvided: !!paymentSession,
      publicKeyProvided: !!publicKey,
      orderId,
      paymentSessionToken: paymentSession ? `${paymentSession.substring(0, 20)}...` : 'N/A',
      publicKey
    });

    // Load Checkout.com Web Components script
    if (!document.querySelector('script[src="https://checkout-web-components.checkout.com/index.js"]')) {
      console.log('Loading Checkout.com Web Components script');
      const script = document.createElement('script');
      script.src = "https://checkout-web-components.checkout.com/index.js";
      script.async = true;
      
      script.onload = () => {
        console.log('Checkout.com Web Components script loaded successfully');
        logger.log('Checkout.com Web Components script loaded successfully');
        setIsLoaded(true);
      };
      
      script.onerror = (error) => {
        const errorMsg = 'Failed to load Checkout.com Web Components script';
        console.error('ERROR:', errorMsg, error);
        logger.error(errorMsg, error);
        setError(errorMsg);
        onPaymentFailure({ message: errorMsg });
      };
      
      document.head.appendChild(script);
      scriptRef.current = script;
    } else {
      console.log('Checkout.com Web Components script already in DOM, setting as loaded');
      setIsLoaded(true);
    }

    return () => {
      // Clean up only if we created the script
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
        logger.log('Checkout.com script removed');
      }
    };
  }, [orderId, paymentSession, publicKey, onPaymentFailure]);

  // Initialize payment form when script is loaded
  useEffect(() => {
    if (isLoaded && window.CheckoutWebComponents && paymentSession && publicKey && !paymentInitialized) {
      const initializeCheckout = async () => {
        try {
          console.log('-------- PAYMENT DETAILS --------');
          console.log('Initializing Checkout.com Web Components with:');
          console.log(`- Public Key: ${publicKey}`);
          console.log(`- Payment Session Token: ${paymentSession.substring(0, 30)}...`);
          
          logger.log('Initializing Checkout.com Web Components', {
            publicKey,
            paymentSessionPrefix: paymentSession.substring(0, 30) + '...'
          });

          // Initialize Checkout Web Components
          const checkout = await window.CheckoutWebComponents({
            publicKey: publicKey,
            environment: 'sandbox',
            paymentSession: paymentSession,
            locale: 'en-US',
            onReady: () => {
              console.log('Checkout.com Web Components ready');
              logger.log('Checkout.com Web Components ready');
            },
            onPaymentCompleted: (_component: any, paymentResponse: any) => {
              console.log('Payment completed with ID:', paymentResponse.id);
              logger.log('Payment completed', { paymentId: paymentResponse.id });
              handleSuccess(_component, paymentResponse);
            },
            onChange: (component: any) => {
              console.log(`Form state changed - isValid: ${component.isValid()} for ${component.type}`);
              logger.log('Form state changed', { isValid: component.isValid(), type: component.type });
            },
            onError: (component: any, error: any) => {
              console.error('Checkout error occurred:', error);
              logger.error('Checkout error', { componentType: component.type, error });
              handleFailure(component, error);
            }
          });

          // Create and mount the Flow component
          const flowComponent = checkout.create('flow');
          checkoutRef.current = flowComponent;

          // Mount the component
          console.log('Mounting flow component to #payment-container');
          flowComponent.mount(document.getElementById('payment-container'));
          setPaymentInitialized(true);
          
          logger.log('Flow component mounted', {
            containerId: 'payment-container',
            formInitialized: true
          });
          
          console.log('-------- PAYMENT READY --------');
          console.log('Payment form is now ready for user input');
        } catch (error: any) {
          console.error('-------- PAYMENT ERROR --------');
          console.error('Failed to initialize payment form:', error);
          
          const errorMsg = error?.message || 'Error initializing payment form';
          logger.error('Error initializing Checkout.com', error);
          setError(errorMsg);
          onPaymentFailure(error);
        }
      };

      initializeCheckout();
    } else if (isLoaded && !window.CheckoutWebComponents) {
      console.error('CheckoutWebComponents not available globally after script loaded');
      setError('Payment processor failed to initialize. Please refresh and try again.');
    }
  }, [isLoaded, paymentSession, publicKey, handleSuccess, handleFailure, paymentInitialized, onPaymentFailure]);

  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">Complete Your Purchase</h3>
      <p className="text-gray-800 mb-4">
        Enter your payment details below to finalize your token purchase. Your payment will be processed securely by Checkout.com.
      </p>
      
      <div className="bg-blue-50 p-3 rounded-md mb-4">
        <h4 className="text-blue-800 font-medium text-sm mb-1">What happens next:</h4>
        <ol className="text-sm text-blue-700 list-decimal pl-5 space-y-1">
          <li>Enter your card details in the form below</li>
          <li>Your payment will be processed securely</li>
          <li>After successful payment, your tokens will be sent to your wallet</li>
          <li>You'll see a confirmation screen with transaction details</li>
        </ol>
      </div>
      
      {/* Order ID and payment details */}
      <div className="bg-gray-50 p-3 rounded-md mb-4 text-gray-900">
        <p className="text-sm font-medium">Order ID: {orderId || 'Not available'}</p>
        <p className="text-xs mt-1">Payment status: {paymentInitialized ? 'Form Ready' : isLoaded ? 'Initializing...' : 'Loading Scripts...'}</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          <p className="font-medium">Payment Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {!isLoaded && !error && (
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700"></div>
          <span className="ml-2 text-gray-900">Loading payment form...</span>
        </div>
      )}
      
      {isLoaded && !paymentInitialized && !error && (
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-900">Initializing secure payment...</span>
        </div>
      )}
      
      <div id="payment-container" className="mb-2 min-h-[200px]"></div>
      
      <p className="text-xs text-gray-700 mt-4">
        Payments processed securely by Checkout.com. Your card details are not stored on our servers.
      </p>
      
      <button
        onClick={onReset}
        className="mt-4 w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
      >
        Reset Payment
      </button>
    </div>
  );
}

// Add TypeScript declaration for Checkout.com
declare global {
  interface Window {
    CheckoutWebComponents: any;
  }
} 