'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@/utils/supabase/server';

interface PurchasedCreditsContextProps {
  purchasedCredits: number;
  setPurchasedCredits: (credits: number) => void;
}

const PurchasedCreditsContext = createContext<
  PurchasedCreditsContextProps | undefined
>(undefined);

export const PurchasedCreditsProvider: React.FC<{
  userId: string;
  children: React.ReactNode;
}> = ({ userId, children }) => {
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0);

  useEffect(() => {
    setPurchasedCredits(25000);
  }, []);

  return (
    <PurchasedCreditsContext.Provider
      value={{ purchasedCredits, setPurchasedCredits }}
    >
      {children}
    </PurchasedCreditsContext.Provider>
  );
};

export const usePurchasedCredits = () => {
  const context = useContext(PurchasedCreditsContext);
  if (!context) {
    throw new Error(
      'usePurchasedCredits must be used within a PurchasedCreditsProvider'
    );
  }
  return context;
};
