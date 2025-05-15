'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new path
    router.replace('/admin');
  }, [router]);
  
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
