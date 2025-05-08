'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, createLogger } from '@/lib/utils';
import { useAuth } from '@crossmint/client-sdk-react-ui';
import { CrossmintProvider, CrossmintEmbeddedCheckout } from "@crossmint/client-sdk-react-ui";
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

// Create a logger for the main page
const logger = createLogger('APP:MAIN');

// Form steps enum
enum FormStep {
  AmountInput = 'amount_input',
  CountrySelection = 'country_selection',
  Authentication = 'authentication',
  UserDetails = 'user_details',
  Processing = 'processing'
}

// List of countries for the dropdown
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'VE', name: 'Venezuela' }
];

export default function Home() {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // @ts-ignore
  const [orderResponse, setOrderResponse] = useState<any>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.AmountInput);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  // Get authentication state
  const { user, logout } = useAuth();

  // Set email from authenticated user if available
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      logger.log('Email set from authenticated user', { email: user.email });
    }
  }, [user]);

  // Ensure amount is loaded from localStorage on component mount
  useEffect(() => {
    const savedAmount = localStorage.getItem('savedAmount');
    if (savedAmount && !amount) {
      setAmount(savedAmount);
      logger.log('Loaded saved amount on mount', { savedAmount });
    }
  }, []);

  // Ensure country is loaded from localStorage on component mount
  useEffect(() => {
    const savedCountry = localStorage.getItem('savedCountry');
    if (savedCountry && !selectedCountry) {
      setSelectedCountry(savedCountry);
      logger.log('Loaded saved country on mount', { savedCountry });
    }
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow valid decimal numbers
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value);
    }
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handleWalletAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
  }, []);

  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    setError('');
  }, []);

  const continueToCountrySelection = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) {
      const errorMessage = 'Please enter a valid amount greater than 0';
      logger.log('Validation error', { error: errorMessage });
      setError(errorMessage);
      return;
    }

    logger.log('Continuing to country selection', { amount });
    setError('');
    setCurrentStep(FormStep.CountrySelection);
  }, [amount]);

  const continueToAuthentication = useCallback(() => {
    if (!selectedCountry) {
      setError('Please select your country');
      return;
    }

    if (selectedCountry === 'VE') {
      setError('Purchases from Venezuela are not supported at this time.');
      return;
    }

    logger.log('Continuing to authentication step', { amount, country: selectedCountry });
    setError('');
    // Set a flag that we're starting auth process and store the amount
    localStorage.setItem('authInProgress', 'true');
    localStorage.setItem('savedAmount', amount);
    localStorage.setItem('savedCountry', selectedCountry);
    setCurrentStep(FormStep.Authentication);
  }, [amount, selectedCountry]);

  const continueToUserDetails = useCallback(() => {
    logger.log('Continuing to user details form', { amount, country: selectedCountry });
    setError('');
    setCurrentStep(FormStep.UserDetails);
  }, [amount, selectedCountry]);

  // Add this effect to log when the amount changes
  useEffect(() => {
    if (amount) {
      logger.log('Amount updated', { amount });
    }
  }, [amount]);

  // Create order function - sets up order but doesn't mark payment as complete
  const createOrder = useCallback(async () => {
    // Validate form fields
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!walletAddress) {
      setError('Please enter your wallet address');
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate amount is present
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Get final values, with defaults from localStorage as a backup
    const finalAmount = amount || localStorage.getItem('savedAmount') || '';
    const finalCountry = selectedCountry || localStorage.getItem('savedCountry') || '';

    logger.log('Creating order with final values', { 
      finalAmount, 
      email, 
      walletAddress, 
      finalCountry,
      originalAmount: amount,
      originalCountry: selectedCountry
    });

    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      setError('Invalid amount');
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentStep(FormStep.Processing);

    try {      
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          walletAddress,
          email,
          country: finalCountry,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }
      
      setOrderResponse(data);
      // Payment is not completed yet, just move to processing state
    } 
    // @ts-ignore
    catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      logger.error('Order creation failed', { error: errorMessage });
      setError(errorMessage);
      // Go back to user details form on error
      setCurrentStep(FormStep.UserDetails);
    } finally {
      setIsLoading(false);
    }
  }, [amount, email, walletAddress, selectedCountry, setIsLoading, setError, setCurrentStep, setOrderResponse, logger]);

  // Add this function to handle payment completion
  const handlePaymentComplete = useCallback(() => {
    setPaymentCompleted(true);
    logger.log('Payment completed successfully');
  }, [logger]);

  const resetTransaction = useCallback(() => {
    setAmount('');
    setSelectedCountry('');
    setWalletAddress('');
    setOrderResponse(null);
    setPaymentCompleted(false);
    setError('');
    setCurrentStep(FormStep.AmountInput);
    // Clear any saved values
    localStorage.removeItem('savedAmount');
    localStorage.removeItem('savedCountry');
    localStorage.removeItem('authInProgress');
    logger.log('Transaction reset');
  }, []);

  const backToAmountInput = useCallback(() => {
    setCurrentStep(FormStep.AmountInput);
    setError('');
  }, []);

  const backToCountrySelection = useCallback(() => {
    setCurrentStep(FormStep.CountrySelection);
    setError('');
  }, []);

  const backToAuthentication = useCallback(() => {
    setCurrentStep(FormStep.Authentication);
    setError('');
  }, []);

  const handleLogout = useCallback(() => {
    logger.log('Logging out user', { email: user?.email });
    logout();
    // Reset state to initial values after logout
    resetTransaction();
  }, [logout, user, resetTransaction]);

  // Check if user was just authenticated
  useEffect(() => {
    if (user && currentStep === FormStep.AmountInput) {
      // If user is logged in but we're at the amount input step, it means
      // we likely just completed authentication and need to show the auth step first
      if (localStorage.getItem('authInProgress') === 'true') {
        // Restore saved amount and country if available
        const savedAmount = localStorage.getItem('savedAmount');
        const savedCountry = localStorage.getItem('savedCountry');
        
        if (savedAmount) {
          setAmount(savedAmount);
          // @ts-ignore
          logger.log('Restored saved amount', { amount: savedAmount });
        }
        
        if (savedCountry) {
          setSelectedCountry(savedCountry);
          logger.log('Restored saved country', { country: savedCountry });
        }
        
        setCurrentStep(FormStep.Authentication);
        localStorage.removeItem('authInProgress');
      }
    }
  }, [user, currentStep]);

  // Render the appropriate content based on current state
  const renderContent = () => {
    // If we're in embedded checkout mode, just return the CrossmintEmbeddedCheckout component
    if (paymentCompleted) {
      // Show order confirmation screen
      return (
        <div className="flex flex-col items-center justify-start w-full px-8 py-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-orange-400 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your order</h2>
            {/* @ts-ignore */}
            <div className="text-3xl font-bold text-gray-900">${orderResponse?.amount || amount}</div>
            {/* @ts-ignore */}
            <div className="text-gray-500 mt-1">{orderResponse?.tokenAmount || '0.43'} USDC</div>
          </div>
          
          <div className="w-full mb-8">
            <h3 className="font-medium text-lg text-gray-800 mb-4">Purchased items</h3>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" opacity="0.2"/>
                    <path d="M9 11.5C9 12.8807 10.1193 14 11.5 14C12.8807 14 14 12.8807 14 11.5C14 10.1193 12.8807 9 11.5 9C10.1193 9 9 10.1193 9 11.5Z" fill="currentColor"/>
                    <path d="M11.5 5.5C8.18629 5.5 5.5 8.18629 5.5 11.5C5.5 14.8137 8.18629 17.5 11.5 17.5C14.8137 17.5 17.5 14.8137 17.5 11.5C17.5 8.18629 14.8137 5.5 11.5 5.5ZM4 11.5C4 7.35786 7.35786 4 11.5 4C15.6421 4 19 7.35786 19 11.5C19 15.6421 15.6421 19 11.5 19C7.35786 19 4 15.6421 4 11.5Z" fill="currentColor"/>
                  </svg>
                </div>
                <span className="font-medium">USDC</span>
              </div>
              {/* @ts-ignore */}
              <span className="font-medium">${orderResponse?.amount || amount}</span>
            </div>
          </div>
          
          <div className="w-full">
            <h3 className="font-medium text-lg text-gray-800 mb-4">Delivery & Payment</h3>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Payment method</span>
              <span className="text-gray-900">Card - USD</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Delivered to</span>
              <span className="text-gray-900 font-mono text-sm">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Receipt sent to</span>
              <span className="text-gray-900">{email}</span>
            </div>
          </div>
          
          <div className="w-full border-t border-gray-100 mt-8 pt-6 flex justify-center">
            <div className="flex items-center text-gray-500 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Powered by Crossmint
            </div>
          </div>
          
          <button
            onClick={resetTransaction}
            className="mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors cursor-pointer"
          >
            Make Another Purchase
          </button>
        </div>
      );
    }
    
    if (currentStep === FormStep.Processing) {
      const clientApiKey = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY as string;
      // Use base-sepolia token address from the logs
      const tokenAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
      
      return (
        <div className="flex flex-col items-center justify-start w-full px-8 py-6">
          <CrossmintProvider apiKey={clientApiKey}>
            <div className="max-w-[450px] w-full">
              <CrossmintEmbeddedCheckout
                recipient={{
                  walletAddress: walletAddress, // Wallet address to receive the tokens
                }}
                lineItems={{
                  tokenLocator: `base-sepolia:${tokenAddress}:${tokenAddress}`, // Token address in format chain:contractAddress:tokenId
                  executionParameters: {
                    mode: "exact-in", // The execution method for the order
                    amount: amount, // Amount in USD
                    maxSlippageBps: "500" // Optional - default slippage will be applied if not specified
                  }
                }}
                payment={{
                  receiptEmail: email, // Email address to receive the receipt
                  crypto: {
                    enabled: false, // Only fiat is supported for token purchases in this example
                  },
                  fiat: {
                    enabled: true,
                  },
                  defaultMethod: "fiat",
                }}
              />
            </div>
          </CrossmintProvider>
        </div>
      );
    }

    // Loading state when creating order
    if (isLoading) {
      return (
        <div className="px-8 py-10 bg-white rounded-lg flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-8"></div>
          <h3 className="text-xl font-medium text-gray-800 mb-3">Processing Your Order</h3>
          <p className="text-gray-600 text-center">Please wait while we process your request...</p>
        </div>
      );
    }

    // Steps based navigation
    switch (currentStep) {
      case FormStep.AmountInput:
        return (
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-5 px-8 pt-6">
              <div className="flex items-center">
                <div className="relative">
                  <button className="flex items-center bg-gray-50 py-2 px-3 rounded-lg border border-gray-200 cursor-pointer">
                    <img src="https://flagicons.lipis.dev/flags/4x3/us.svg" alt="US Flag" className="h-5 w-5 mr-2 opacity-80" />
                    <span className="font-medium text-gray-600">USD</span>
                    <svg className="h-4 w-4 ml-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Buy Stablecoins</h2>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div className="text-center my-8 px-8">
              <div className="flex items-center justify-center text-6xl font-semibold text-gray-800">
                <span className="text-3xl mr-1">$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-56 bg-transparent text-center focus:outline-none font-semibold"
                  placeholder="0.00"
                />
              </div>
              <div className="text-gray-400 mt-2">0.00 USDC</div>
            </div>

            <div className="bg-gray-50 p-4 mx-8 rounded-xl mb-6 flex items-center cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="bg-blue-50 rounded-full p-2.5 mr-4">
                <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" opacity="0.2"/>
                  <path d="M9 11.5C9 12.8807 10.1193 14 11.5 14C12.8807 14 14 12.8807 14 11.5C14 10.1193 12.8807 9 11.5 9C10.1193 9 9 10.1193 9 11.5Z" fill="currentColor"/>
                  <path d="M11.5 5.5C8.18629 5.5 5.5 8.18629 5.5 11.5C5.5 14.8137 8.18629 17.5 11.5 17.5C14.8137 17.5 17.5 14.8137 17.5 11.5C17.5 8.18629 14.8137 5.5 11.5 5.5ZM4 11.5C4 7.35786 7.35786 4 11.5 4C15.6421 4 19 7.35786 19 11.5C19 15.6421 15.6421 19 11.5 19C7.35786 19 4 15.6421 4 11.5Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-700">You're buying</div>
                <div className="text-gray-600">USDC (Base)</div>
              </div>
              <div>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {error && <p className="mt-2 mb-4 mx-8 text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}

            <button
              onClick={continueToCountrySelection}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-5 px-4 transition-colors cursor-pointer"
            >
              Buy USDC
            </button>
          </div>
        );

      case FormStep.CountrySelection:
        return (
          <div className="mb-6 bg-white rounded-2xl px-8 py-6 shadow-sm">
            <div className="flex items-center mb-5">
              <button 
                onClick={backToAmountInput}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-800">Select Your Country</h2>
            </div>
            
            <div className="my-6">
              <label htmlFor="country" className="block mb-2 text-sm font-medium text-gray-700">
                Country of Residence
              </label>
              <div className="relative">
                <select
                  id="country"
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  className="bg-white border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5 appearance-none"
                  required
                >
                  <option value="">Select a country</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={continueToAuthentication}
              className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3.5 px-4 rounded-xl transition-colors cursor-pointer"
              disabled={!selectedCountry || selectedCountry === 'VE'}
            >
              Continue
            </button>
          </div>
        );
      
      case FormStep.Authentication:
        return (
          <div className="mb-6 bg-white rounded-2xl px-8 py-6 shadow-sm">
            <div className="flex items-center mb-5">
              <button 
                onClick={backToCountrySelection}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-800">Authentication</h2>
            </div>
            
            {user ? (
              <div className="my-6 flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-[pulse_1s_ease-in-out]">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      className="checkmark-animation" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                <p className="text-green-700 font-medium text-lg">Successfully signed in!</p>
                <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              </div>
            ) : (
              <div className="my-10 flex flex-col items-center">
                <p className="mb-8 text-gray-700 text-center">
                  Please sign in to continue with your purchase.
                </p>
                <div className="w-full max-w-xs">
                  <AuthButton />
                </div>
              </div>
            )}
          </div>
        );
      
      case FormStep.UserDetails:
        return (
          <div className="mb-6 bg-white rounded-2xl px-8 py-6 shadow-sm">
            <div className="flex items-center mb-5">
              <button 
                onClick={backToAuthentication}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-800">Enter Your Details</h2>
            </div>
            
            <div className="my-6 space-y-4">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="bg-white border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="walletAddress" className="block mb-2 text-sm font-medium text-gray-700">
                  Wallet Address
                </label>
                <input
                  type="text"
                  id="walletAddress"
                  value={walletAddress}
                  onChange={handleWalletAddressChange}
                  className="bg-white border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                  placeholder="Enter your wallet address"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the wallet where you want to receive your tokens.
                </p>
              </div>
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={createOrder}
              className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3.5 px-4 rounded-xl transition-colors cursor-pointer"
              disabled={!email || !walletAddress}
            >
              Create Order
            </button>
          </div>
        );
      
      default:
        return (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-700">Something went wrong. Please refresh and try again.</p>
            <button
              onClick={resetTransaction}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        );
    }
  };

  // Add this effect to automatically transition from Authentication to UserDetails
  useEffect(() => {
    if (currentStep === FormStep.Authentication && user) {
      const timer = setTimeout(() => {
        continueToUserDetails();
      }, 2000);
      
      // Cleanup function to clear the timeout if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [currentStep, user, continueToUserDetails]);

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center py-5 px-6 md:px-20 border-b border-gray-100">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">crossmint</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-10">
          <div className="flex items-center space-x-1 text-gray-800 hover:text-gray-600 transition-colors">
            <span className="font-medium">Products</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center space-x-1 text-gray-800 hover:text-gray-600 transition-colors">
            <span className="font-medium">Developers</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center space-x-1 text-gray-800 hover:text-gray-600 transition-colors">
            <span className="font-medium">Solutions</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span className="text-gray-800 hover:text-gray-600 transition-colors font-medium">Pricing</span>
          <span className="text-gray-800 hover:text-gray-600 transition-colors font-medium">Help</span>
          <span className="text-gray-800 hover:text-gray-600 transition-colors font-medium">Company</span>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex items-center space-x-4">
          <button className="bg-gray-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">Console</button>
          <button className="border border-gray-200 text-gray-800 px-5 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">My Wallet</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row md:items-start max-w-[1240px] mx-auto pt-16 pb-24 px-6 md:px-20">
        {/* Left Column: Hero Text */}
        <div className="md:w-1/2 mb-12 md:mb-0 md:pr-16 md:pt-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-8">The most seamless crypto onramp</h1>
          <p className="text-xl text-gray-600 mb-12">Lorem ipsum dolor sit amet.</p>
        </div>
        
        {/* Right Column: Widget */}
        <div className="md:w-1/2 md:pt-8 md:flex md:justify-end">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
            {user && (
              <div className="flex justify-end mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 bg-white border border-gray-200 rounded py-1 px-2">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                    title="Log out"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
            
            {renderContent()}
          </div>
        </div>
    </div>
    </main>
  );
}
