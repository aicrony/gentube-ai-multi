'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';

interface PurchasedCreditsContextProps {
  purchasedCredits: number;
  setPurchasedCredits: (credits: number) => void;
}

const PurchasedCreditsContext = createContext<
  PurchasedCreditsContextProps | undefined
>(undefined);

export const PurchasedCreditsProvider: React.FC<{
  userId: string;
  purchasedCredits: number;
  children: React.ReactNode;
}> = ({ userId, purchasedCredits: initialCredits, children }) => {
  const [purchasedCredits, setPurchasedCredits] =
    useState<number>(initialCredits);

  useEffect(() => {
    setPurchasedCredits(initialCredits);
  }, [initialCredits]);

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
