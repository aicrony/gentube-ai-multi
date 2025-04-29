'use client';

import { UserCreditsProvider } from '@/context/UserCreditsContext';
import PricingContainer from '@/components/ui/Pricing/PricingContainer';

export default function PricingPage() {
  return (
    <UserCreditsProvider>
      <PricingContainer />
    </UserCreditsProvider>
  );
}
