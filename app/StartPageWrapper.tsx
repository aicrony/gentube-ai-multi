'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserIdProvider } from '@/context/UserIdContext';
import { UserCreditsProvider } from '@/context/UserCreditsContext';

interface StartPageWrapperProps {
  children: React.ReactNode;
}

export default function StartPageWrapper({ children }: StartPageWrapperProps) {
  const [userId, setUserId] = useState<string>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserId() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUserId(data.user.id);
        } else {
          setUserId('none');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUserId('none');
      } finally {
        setLoading(false);
      }
    }

    fetchUserId();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <UserIdProvider userId={userId}>
      <UserCreditsProvider>
        {children}
      </UserCreditsProvider>
    </UserIdProvider>
  );
}