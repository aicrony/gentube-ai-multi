'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DirectHome() {
  const [status, setStatus] = useState('Clearing session...');
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Clear any existing session and redirect to home
    const clearAndRedirect = async () => {
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
        
        // Hard reload to the home page to ensure a clean state
        setTimeout(() => {
          window.location.replace('/');
        }, 500);
      } catch (error) {
        console.error('Error clearing session:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setStatus('Error occurred. Please try manual navigation.');
      }
    };

    clearAndRedirect();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Redirecting to home...</h1>
        <p className="mt-2">{status}</p>
        {error && <p className="mt-2 text-red-500">{error}</p>}
        <div className="mt-6">
          <button 
            onClick={() => window.location.replace('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Click here if not redirected
          </button>
        </div>
      </div>
    </div>
  );
}