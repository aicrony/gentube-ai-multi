'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { UserIdProvider } from '@/context/UserIdContext';
import { UserIpProvider } from '@/context/UserIpContext';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import ContextErrorHandler from './ContextErrorHandler';

interface ContextProviderWithErrorHandlingProps {
  children: ReactNode;
}

const ContextProviderWithErrorHandling: React.FC<ContextProviderWithErrorHandlingProps> = ({ 
  children 
}) => {
  const [userIp, setUserIp] = useState<string>('unknown');
  const [userId, setUserId] = useState<string>('none');
  
  // Fetch user IP on initial load to make it available for contexts
  useEffect(() => {
    const fetchUserIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('Failed to fetch IP');
        const data = await response.json();
        setUserIp(data.ip);
      } catch (error) {
        console.error('Error fetching user IP:', error);
      }
    };
    
    fetchUserIp();
  }, []);
  
  // Handle user ID from client storage if possible
  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Here we could check localStorage, sessionStorage or cookies for a stored userId
        // For example:
        // const storedUserId = localStorage.getItem('userId');
        // if (storedUserId) setUserId(storedUserId);
        
        // For now, we'll continue with the default 'none'
      } catch (error) {
        console.error('Error accessing stored user data:', error);
      }
    }
  }, []);
  
  return (
    <ContextErrorHandler>
      <UserIpProvider>
        <UserIdProvider userId={userId}>
          <UserCreditsProvider>
            {children}
          </UserCreditsProvider>
        </UserIdProvider>
      </UserIpProvider>
    </ContextErrorHandler>
  );
};

export default ContextProviderWithErrorHandling;