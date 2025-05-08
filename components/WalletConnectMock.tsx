'use client';

import { useState } from 'react';
import { createLogger, isValidSolanaAddress } from '@/lib/utils';

const logger = createLogger('COMP:WalletConnectMock');

interface WalletConnectMockProps {
  onWalletConnected: (address: string) => void;
}

export default function WalletConnectMock({ onWalletConnected }: WalletConnectMockProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  
  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
    if (error) setError('');
  };
  
  const handleConnect = () => {
    logger.log('Attempting to connect wallet', { walletAddress });
    
    // Basic validation for ETH addresses
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }
    
    // Check if it's a valid ETH address (0x followed by 40 hex characters)
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    
    // Call the callback with the address
    onWalletConnected(walletAddress);
    logger.log('Wallet connected', { walletAddress });
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
      <h3 className="font-medium text-lg mb-4">Connect Wallet</h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Enter your Ethereum wallet address to receive tokens.
      </p>
      
      <div className="mb-4">
        <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 mb-1">
          Wallet Address
        </label>
        <input
          type="text"
          id="wallet-address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-gray-900"
          placeholder="0x..."
          value={walletAddress}
          onChange={handleWalletAddressChange}
        />
      </div>
      
      {error && (
        <div className="mb-4 text-red-600 text-sm p-2 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <button
        onClick={handleConnect}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
      >
        Connect Wallet
      </button>
      
      <p className="mt-2 text-xs text-gray-500">
        This is a mock wallet connector for testing purposes.
      </p>
    </div>
  );
} 