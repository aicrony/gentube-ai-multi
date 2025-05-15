'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadToVideoRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new path
    router.replace('/upload-to-video');
  }, [router]);
  
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
