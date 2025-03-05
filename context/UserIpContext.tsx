'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserIpContextProps {
  userIp: string;
}

const UserIpContext = createContext<UserIpContextProps | undefined>(undefined);

export const UserIpProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [userIp, setUserIp] = useState<string>('unknown');

  useEffect(() => {
    const fetchUserIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIp(data.ip);
      } catch (error) {
        console.error('Error fetching user IP:', error);
      }
    };

    fetchUserIp();
  }, []);

  return (
    <UserIpContext.Provider value={{ userIp }}>
      {children}
    </UserIpContext.Provider>
  );
};

export const useUserIp = (): string => {
  const context = useContext(UserIpContext);
  if (!context) {
    throw new Error('useUserIp must be used within a UserIpProvider');
  }
  return context.userIp;
};
