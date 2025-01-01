// context/SubscriptionTierContext.tsx
'use client';
import React, { createContext, useContext } from 'react';
import { getSubscriptionTier } from '@/functions/getSubscriptionTier';

interface SubscriptionTierContextProps {
  monthlySubscriber: boolean;
  subscriptionTier: number;
  maxRequestsPerMonth: number;
}

const SubscriptionTierContext = createContext<
  SubscriptionTierContextProps | undefined
>(undefined);

export const useSubscriptionTier = () => {
  const context = useContext(SubscriptionTierContext);
  if (context === undefined) {
    throw new Error(
      'useSubscriptionTier must be used within a SubscriptionTierProvider'
    );
  }
  return context;
};

interface SubscriptionTierProviderProps {
  productName: string;
  subscriptionStatus: string;
  children: React.ReactNode;
}

export const SubscriptionTierProvider: React.FC<
  SubscriptionTierProviderProps
> = ({ productName, subscriptionStatus, children }) => {
  const subscriptionTier = getSubscriptionTier(productName, subscriptionStatus);

  return (
    <SubscriptionTierContext.Provider value={subscriptionTier}>
      {children}
    </SubscriptionTierContext.Provider>
  );
};
