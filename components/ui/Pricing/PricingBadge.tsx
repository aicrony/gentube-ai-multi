'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface PricingBadgeProps {
  label: string;
  className?: string;
}

const PricingBadge: React.FC<PricingBadgeProps> = ({ label, className }) => {
  return (
    <div
      className={cn(
        'absolute -top-3 -left-3 px-3 py-1 text-xs font-bold text-white rounded-md z-10 transform rotate-[-6deg]',
        className
      )}
      style={{ backgroundColor: 'var(--primary-color)' }}
    >
      {label}
    </div>
  );
};

export default PricingBadge;
