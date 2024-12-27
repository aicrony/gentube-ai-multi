// context/UserIdContext.tsx
'use client';
import React, { createContext, useContext } from 'react';

const UserIdContext = createContext<string | undefined>(undefined);

export const useUserId = () => {
  const context = useContext(UserIdContext);
  if (context === undefined) {
    throw new Error('useUserId must be used within a UserIdProvider');
  }
  return context;
};

interface UserIdProviderProps {
  userId: string;
  children: React.ReactNode;
}

export const UserIdProvider: React.FC<UserIdProviderProps> = ({
  userId,
  children
}) => {
  return (
    <UserIdContext.Provider value={userId}>{children}</UserIdContext.Provider>
  );
};
