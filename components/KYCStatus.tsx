'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createLogger } from '@/lib/utils';
// Remove static import of Persona
// import Persona from 'persona';

// Create a logger
const logger = createLogger('COMP:KYCStatus');

interface KYCStatusProps {
  templateId: string;
  referenceId: string;
  environmentId: string;
  onKYCComplete: () => void;
}

// Create an async import function for Persona that can be reused
const loadPersona = async () => {
  try {
    const PersonaModule = await import('persona');
    return PersonaModule.default;
  } catch (error) {
    logger.error('Failed to load Persona module dynamically', error);
    throw error;
  }
};

export default function KYCStatus({ 
  templateId, 
  referenceId, 
  environmentId,
  onKYCComplete 
}: KYCStatusProps) {
  const [clientInitialized, setClientInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Add state to track if we're in browser
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize callback to avoid rerenders
  const handleComplete = useCallback((data: any) => {
    logger.log('KYC inquiry completed', { 
      inquiryId: data.inquiryId,
      status: data.status
    });
    
    // Close the popup after completion
    if (clientRef.current && typeof clientRef.current.close === 'function') {
      logger.log('Closing Persona popup after completion');
      clientRef.current.close();
    }
    
    // Notify parent component
    onKYCComplete();
  }, [onKYCComplete]);

  const initializePersona = useCallback(async () => {
    if (!isClient || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Validate required parameters
      if (!templateId || !referenceId || !environmentId) {
        const missingParams = [];
        if (!templateId) missingParams.push('templateId');
        if (!referenceId) missingParams.push('referenceId');
        if (!environmentId) missingParams.push('environmentId');
        
        const errorMsg = `Missing required Persona parameters: ${missingParams.join(', ')}`;
        logger.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      logger.log('Initializing Persona KYC with params:', { 
        templateId, 
        referenceId: referenceId.substring(0, 15) + '...',
        environmentId 
      });

      // Dynamically import Persona only on client side
      const Persona = await loadPersona();
      
      // Using any type to avoid TypeScript issues with third-party library
      const client = new (Persona as any).Client({
        templateId,
        referenceId,
        environmentId,
        onReady: () => {
          logger.log('Persona KYC ready, opening verification flow');
          client.open();
          setClientInitialized(true);
          clientRef.current = client;
          setIsLoading(false);
        },
        onComplete: handleComplete,
        onCancel: (data: any) => {
          logger.log('KYC inquiry cancelled', { 
            inquiryId: data.inquiryId 
          });
          setError('KYC verification was cancelled. Please try again to complete your purchase.');
          setIsLoading(false);
        },
        onError: (error: any) => {
          const errorMsg = error?.message || 'Unknown error occurred during KYC verification';
          logger.error('KYC error', error);
          setError(errorMsg);
          setIsLoading(false);
        },
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to load Persona verification SDK';
      logger.error('Error loading Persona SDK', err);
      setError(errorMsg);
      setIsLoading(false);
    }
  }, [templateId, referenceId, environmentId, handleComplete, isClient, isLoading]);

  useEffect(() => {
    // Only run in browser environment
    if (!isClient) return;
    
    // Initialize Persona
    initializePersona();

    // Return cleanup function
    return () => {
      try {
        if (clientRef.current && typeof clientRef.current.close === 'function') {
          clientRef.current.close();
          logger.log('Persona client closed');
        }
      } catch (err) {
        logger.error('Error closing Persona client', err);
      }
    };
  }, [initializePersona, isClient]);

  return (
    <div className="rounded-lg bg-blue-50 p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">Identity Verification Required</h3>
      <p className="text-blue-600 mb-4">
        To comply with regulations, we need to verify your identity before processing your purchase.
      </p>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          <p className="font-medium">Verification Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(false);
              initializePersona();
            }}
            className="mt-2 text-sm px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Retry Verification
          </button>
        </div>
      )}
      
      {!clientInitialized && !error && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-2 text-blue-700">Loading verification...</span>
        </div>
      )}
      
      <div id="persona-root"></div>
    </div>
  );
}

// Add TypeScript declaration for Persona
declare global {
  interface Window {
    Persona: any;
  }
} 