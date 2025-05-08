'use client';

import { useAuth } from "@crossmint/client-sdk-react-ui";
import { useState, useEffect } from 'react';
import { createLogger } from "@/lib/utils";

const logger = createLogger('AUTH');

const AuthButton = () => {
  const { user, login, logout } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      // Clear auth progress flag and saved values on failure
      localStorage.removeItem('authInProgress');
      localStorage.removeItem('savedAmount');
      localStorage.removeItem('savedCountry');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    // Clear saved values on logout
    localStorage.removeItem('authInProgress');
    localStorage.removeItem('savedAmount');
    localStorage.removeItem('savedCountry');
    logout();
  };

  if (user) {
    return (
      <button
        onClick={handleLogout}
        className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
      >
        Disconnect
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoggingIn}
      className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3.5 px-4 rounded-lg transition-colors cursor-pointer"
    >
      {isLoggingIn ? 'Signing in...' : 'Sign In'}
    </button>
  );
};

export default AuthButton; 