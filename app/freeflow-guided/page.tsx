// app/freeflow/page.tsx
'use client';

import Link from 'next/link';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import { useEffect, useState } from 'react';

export default function FreeflowWorkflow() {
  const userId = useUserId() || 'none';
  const userIp = useUserIp();
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      setIsLocalhost(true);
    }
  }, []);

  const signInMessage =
    userId === 'none' ? (
      <button
        onClick={() => (window.location.href = '/signin')}
        className="font-light text-md"
      >
        Sign In for 110 free credits (1 time).
      </button>
    ) : null;

  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container grid gap-4">
            <div className="grid gap-2 text-center">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl">
                GenTube.ai
              </h1>
              <h2 className="text-2xl font-bold mt-6">Free Flow Mode</h2>
              <p className="max-w-2xl m-auto mt-2 text-xl sm:text-center">
                Access all tools without guided workflows
              </p>
              {signInMessage && (
                <h3 className="text-xl font-bold mt-4">{signInMessage}</h3>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mt-8">
              <Link href="/image-gen" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Image Gen</h3>
                  <p className="">Generate images from text prompts</p>
                </div>
              </Link>

              <Link href="/freeflow/url-to-video" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">URL to Video</h3>
                  <p className="">Convert online images to videos</p>
                </div>
              </Link>

              <Link href="/freeflow/video-gen" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Video Gen</h3>
                  <p className="">Generate videos from text descriptions</p>
                </div>
              </Link>

              <Link href="/freeflow/upload-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Upload Image</h3>
                  <p className="">Upload your own images for video creation</p>
                </div>
              </Link>

              {isLocalhost && (
                <Link href="/freeflow/admin" className="no-underline">
                  <div className="theme-card">
                    <h3 className="text-xl font-semibold mb-2">Admin</h3>
                    <p className="">Administrative tools and settings</p>
                  </div>
                </Link>
              )}
            </div>

            <div className="text-center mt-8">
              <Link href="/start" className="hover:underline">
                ← Back to Workflow Selection
              </Link>
            </div>
          </div>
        </main>
      </div>
    </UserCreditsProvider>
  );
}
