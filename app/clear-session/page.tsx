'use client';

import { useEffect, useState } from 'react';

export default function ClearSession() {
  const [cleared, setCleared] = useState(false);
  const [destination, setDestination] = useState('');

  useEffect(() => {
    // Get destination from query string
    const params = new URLSearchParams(window.location.search);
    const dest = params.get('to') || '/';
    setDestination(dest);

    // Clear all cookies related to authentication
    const clearCookies = () => {
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      });
    };

    // First try the API approach
    fetch('/api/session/clear')
      .then(() => {
        clearCookies(); // Also clear cookies client-side
        setCleared(true);
      })
      .catch(() => {
        // If API fails, still try to clear cookies
        clearCookies();
        setCleared(true);
      });
  }, []);

  // Redirect once cleared
  useEffect(() => {
    if (cleared && destination) {
      // Force reload to ensure a clean state
      window.location.href = destination;
    }
  }, [cleared, destination]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Clearing session...</h1>
        <p className="mt-4">Please wait, you will be redirected shortly.</p>
      </div>
    </div>
  );
}