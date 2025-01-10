import React from 'react';
import { usePurchasedCredits } from '@/context/PurchasedCreditsContext';

const PurchasedCreditsUpdater: React.FC = () => {
  const { purchasedCredits, setPurchasedCredits } = usePurchasedCredits();

  const handleUpdateCredits = (newCredits: number) => {
    setPurchasedCredits(newCredits);
  };

  return (
    <div>
      <p>Current Purchased Credits: {purchasedCredits}</p>
      <button onClick={() => handleUpdateCredits(purchasedCredits + 10)}>
        Add 10 Credits
      </button>
    </div>
  );
};

export default PurchasedCreditsUpdater;
