'use client';

import { useEffect, useState } from 'react';

export default function SessionExpiredPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [status, setStatus] = useState('Clearing session...');

  // Aggressive cookie clearing function
  const clearAllCookies = () => {
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.trim().split('=');
      if (name) {
        // Set the cookie to expire
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        // Also try with domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
      }
    });
  };

  useEffect(() => {
    const clearSession = async () => {
      if (isClearing) return;

      setIsClearing(true);
      setStatus('Clearing session cookies...');

      try {
        // First, clear all cookies aggressively
        clearAllCookies();

        // Then try the API method
        setStatus('Calling clear session API...');
        await fetch('/api/session/clear')
          .then((res) => res.json())
          .catch((err) => console.error('API call failed:', err));

        setStatus('Session cleanup needed...');
      } catch (error) {
        console.error('Error clearing session:', error);
        setStatus('Error clearing session, try clicking a button below');
      }
    };

    clearSession();
  }, [isClearing]);

  // Use server-side redirects instead of client-side
  // These don't need to prevent default since they're actual links

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Session Expired</h1>
          <p className="mt-2 text-gray-600">
            Your session has expired or is invalid. Please sign in again to
            continue.
          </p>
          <p className="mt-2 text-sm text-gray-500">{status}</p>
        </div>

        <div className="mt-6 space-y-4">
          <a
            href="/signin/complete-signout"
            className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none text-center"
          >
            Clean-up Session
          </a>

          <a
            href="/"
            className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 focus:outline-none text-center"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
