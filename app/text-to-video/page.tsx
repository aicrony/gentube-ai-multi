'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import { VideoFromTextDynamicButton } from '@/components/dynamic/video-from-text-button-event';
import MyAssets from '@/components/dynamic/my-assets';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';

export default function TextToVideoPage() {
  const userId = useUserId() || 'none';
  const userIp = useUserIp();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);

  const handleUserCreditsUpdate = (credits: number | null) => {
    setUserCredits(credits);
  };

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    ) {
      setIsLocalhost(true);
    }
  }, []);

  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container grid gap-4">
            <div className="grid gap-2 text-center">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl">
                GenTube.ai
              </h1>
              <h2 className="max-w-2xl m-auto mt-5 text-xl sm:text-center sm:text-2xl">
                Text to Video Generator
              </h2>
              {userId && userId === 'none' && (
                <h1 className="text-xl font-bold">
                  <button
                    onClick={() => (window.location.href = '/signin')}
                    className="font-light text-md"
                  >
                    Sign In for free credits (1 time).
                  </button>
                </h1>
              )}
            </div>

            <div className="grid gap-4">
              <nav className="flex flex-wrap justify-center gap-1">
                <Link href="/">
                  <Button variant="slim">Image Gen</Button>
                </Link>
                <Link href="/image-url-to-video">
                  <Button variant="slim">URL to Video</Button>
                </Link>
                <Link href="/text-to-video">
                  <Button
                    variant="slim"
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Video Gen
                  </Button>
                </Link>
                <Link href="/upload-to-video">
                  <Button variant="slim">Upload Image</Button>
                </Link>
                {userId && userId !== 'none' && isLocalhost && (
                  <Link href="/admin">
                    <Button variant="slim">Admin</Button>
                  </Link>
                )}
                <Link href="/start">
                  <Button variant="slim" className="btn-red">
                    Guide Me Now
                  </Button>
                </Link>
              </nav>

              <div className="my-assets-container">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-xl font-bold">Video Generation</h1>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">
                    Describe the video, be as detailed as possible.
                  </Label>
                </div>
              </div>
              <VideoFromTextDynamicButton
                userId={userId}
                userIp={userIp}
                onUserCreditsUpdate={handleUserCreditsUpdate}
              />
              <MyAssets autoRefreshQueued={true} />
            </div>
          </div>
        </main>
      </div>
    </UserCreditsProvider>
  );
}
