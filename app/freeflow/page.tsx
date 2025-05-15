'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FreeflowRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the home page
    router.replace('/');
  }, [router]);
  
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <p>Redirecting to the home page...</p>
    </div>
  );
}