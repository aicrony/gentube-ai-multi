'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CompleteSignOut() {
  const [status, setStatus] = useState('Preparing to sign out...');
  const [isDone, setIsDone] = useState(false);
  
  useEffect(() => {
    // Aggressive client-side cookie clearing
    const clearAllCookies = () => {
      const cookies = document.cookie.split(';');
      setStatus('Clearing cookies...');
      
      for (let cookie of cookies) {
        const [name] = cookie.trim().split('=');
        if (name) {
          // Clear with different variations to ensure it's removed
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname};`;
          
          // Try subdomain wildcard clear if on a subdomain
          if (location.hostname.split('.').length > 2) {
            const domain = location.hostname.split('.').slice(1).join('.');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain};`;
          }
        }
      }
      return true;
    };
    
    const clearStorages = () => {
      setStatus('Clearing browser storage...');
      try {
        localStorage.clear();
        sessionStorage.clear();
        return true;
      } catch (e) {
        console.error('Storage clear error:', e);
        return false;
      }
    };
    
    const clearSession = async () => {
      try {
        // Step 1: Clear all client-side storage
        clearAllCookies();
        clearStorages();
        
        // Step 2: Call API to clear server-side session
        setStatus('Clearing server-side session...');
        try {
          await fetch('/api/session/clear');
        } catch (err) {
          console.error('API call failed:', err);
        }
        
        // Step 3: Wait a moment to ensure all operations complete
        setStatus('Session cleared successfully');
        setTimeout(() => {
          setIsDone(true);
        }, 1000);
      } catch (error) {
        console.error('Session clear error:', error);
        setStatus('Error clearing session. You can still continue.');
        setIsDone(true);
      }
    };
    
    clearSession();
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Signing Out</h1>
          <p className="mt-4 text-gray-600">{status}</p>
          
          {!isDone && (
            <div className="mt-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          )}
          
          {isDone && (
            <div className="mt-8 space-y-4">
              <Link 
                href="/signin"
                className="block w-full py-2 px-4 text-center border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Continue to Sign In
              </Link>
              
              <Link
                href="/"
                className="block w-full py-2 px-4 text-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Go to Home Page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}