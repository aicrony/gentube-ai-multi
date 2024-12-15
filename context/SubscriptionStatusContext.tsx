// context/SubscriptionStatusContext.tsx
'use client';
import React, { createContext, useContext } from 'react';

const SubscriptionStatusContext = createContext<string | undefined>(undefined);

export const useSubscriptionStatus = () => {
  const context = useContext(SubscriptionStatusContext);
  if (context === undefined) {
    throw new Error(
      'useSubscriptionStatus must be used within a SubscriptionStatusProvider'
    );
  }
  return context;
};

interface SubscriptionStatusProviderProps {
  subscriptionStatus: string;
  children: React.ReactNode;
}

export const SubscriptionStatusProvider: React.FC<
  SubscriptionStatusProviderProps
> = ({ subscriptionStatus, children }) => {
  return (
    <SubscriptionStatusContext.Provider value={subscriptionStatus}>
      {children}
    </SubscriptionStatusContext.Provider>
  );
};
