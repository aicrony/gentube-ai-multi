// context/ProductNameContext.tsx
'use client';
import React, { createContext, useContext } from 'react';

const ProductNameContext = createContext<string | undefined>(undefined);

export const useProductName = () => {
  const context = useContext(ProductNameContext);
  if (context === undefined) {
    throw new Error('useProductName must be used within a ProductNameProvider');
  }
  return context;
};

interface ProductNameProviderProps {
  productName: string;
  children: React.ReactNode;
}

export const ProductNameProvider: React.FC<ProductNameProviderProps> = ({
  productName,
  children
}) => {
  return (
    <ProductNameContext.Provider value={productName}>
      {children}
    </ProductNameContext.Provider>
  );
};
