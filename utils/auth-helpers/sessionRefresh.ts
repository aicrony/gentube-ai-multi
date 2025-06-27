'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionRefresh(refreshInterval = 60000) {
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initial session check when component mounts
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        
        // If there's an error or no user when we expect one, refresh the page
        if (error || (!data.user && document.cookie.includes('supabase-auth-token'))) {
          console.log('Session validation failed, refreshing the page');
          window.location.reload();
        } else {
          setSessionChecked(true);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        // On error, reload the page to re-establish session
        window.location.reload();
      }
    };

    // Check immediately on initial load
    checkSession();

    // Set up periodic check
    const intervalId = setInterval(checkSession, refreshInterval);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return { sessionChecked };
}

// This component will validate the session on initial page load
// and set up periodic checks
export function SessionRefreshHandler({ children }: { children: React.ReactNode }) {
  const { sessionChecked } = useSessionRefresh();
  
  // Optional: Show a loading state while checking session
  if (!sessionChecked) {
    return null; // Or return a loading spinner if preferred
  }
  
  return children;
}