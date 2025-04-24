// app/error.tsx
'use client';

import React from 'react';
import Button from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
      <p className="mb-6 text-gray-600">{error.message}</p>
      <Button onClick={reset} variant="slim">
        Try again
      </Button>
    </div>
  );
}
