'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DirectSignin() {
  const [status, setStatus] = useState('Clearing session...');
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear any existing session
    const clearSession = async () => {
      try {
        setStatus('Attempting to clear client cookies...');
        
        // Clear all auth cookies client-side
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          }
        });
        
        // Clear session server-side via API
        setStatus('Calling session clear API...');
        const apiResponse = await fetch('/api/session/clear');
        const apiResult = await apiResponse.json();
        
        if (!apiResult.success) {
          throw new Error('API session clear failed');
        }

        // Also sign out via Supabase
        setStatus('Signing out via Supabase...');
        const supabase = createClient();
        await supabase.auth.signOut();
        
        setStatus('Session cleared, redirecting...');
        
        // Redirect to the signin page with a special flag to bypass middleware
        setTimeout(() => {
          // Use replace to avoid having the redirect page in history
          window.location.replace('/signin');
        }, 500);
      } catch (error) {
        console.error('Error signing out:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setStatus('Error occurred. Please try manual navigation.');
      }
    };

    clearSession();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Redirecting to sign in...</h1>
        <p className="mt-2">{status}</p>
        {error && <p className="mt-2 text-red-500">{error}</p>}
        <div className="mt-6">
          <button 
            onClick={() => window.location.replace('/signin')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Click here if not redirected
          </button>
        </div>
      </div>
    </div>
  );
}