'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VideoFromUrlDynamicButton } from '@/components/dynamic/video-from-url-button-event';
import { ImageDynamicButton } from '@/components/dynamic/image-button-event';
import { VideoFromTextDynamicButton } from '@/components/dynamic/video-from-text-button-event';
import MyAssets from '@/components/dynamic/my-assets';
import Button from '@/components/ui/Button';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import FileInterpreter from '@/functions/FileInterpreter';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import GalleryAssets from '@/components/dynamic/gallery-assets';
import { Label } from '@/components/ui/label';

export default function Home() {
  // Safely use context hooks with error handling
  let initialUserId: string | 'none' = 'none';
  let initialUserIp: string = 'unknown';

  try {
    initialUserId = useUserId() || 'none';
  } catch (error) {
    console.error('Error accessing UserIdContext:', error);
  }

  try {
    initialUserIp = useUserIp();
  } catch (error) {
    console.error('Error accessing UserIpContext:', error);
  }

  const [userId, setUserId] = useState<string | 'none'>(initialUserId);
  const [userIp, setUserIp] = useState<string>(initialUserIp);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);
  const [contextError, setContextError] = useState<boolean>(
    initialUserId === 'none' || initialUserIp === 'unknown'
  );
  const pathname = usePathname();

  // If we couldn't get the userIp from context, try to fetch it directly
  useEffect(() => {
    if (userIp === 'unknown') {
      const fetchUserIp = async () => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          setUserIp(data.ip);
          setContextError(false);
        } catch (error) {
          console.error('Error fetching user IP:', error);
        }
      };

      fetchUserIp();
    }
  }, [userIp]);

  const handleUserCreditsUpdate = useCallback((credits: number | null) => {
    setUserCredits(credits);
  }, []);

  const signInMessage =
    userId && userId == 'none' ? (
      <button
        onClick={() => (window.location.href = '/signin')}
        className="font-light text-md"
      >
        Sign In for free credits (1 time).
      </button>
    ) : (
      ''
    );

  useEffect(() => {
    if (userCredits !== null) {
      setDisplayName(` - Credits: ${userCredits}`);
    }
  }, [userCredits]);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    ) {
      setIsLocalhost(true);
    }
  }, []);

  const renderContent = () => {
    if (pathname === '/freeflow' || pathname === '/freeflow/') {
      return (
        <>
          <div className="my-assets-container">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Image Generation</h1>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">
                Describe an image to start your video.
              </Label>
            </div>
          </div>
          <ImageDynamicButton
            userId={userId}
            userIp={userIp}
            onUserCreditsUpdate={handleUserCreditsUpdate}
          />
          <MyAssets />
        </>
      );
    } else if (pathname === '/freeflow/image-url-to-video') {
      return (
        <>
          <VideoFromUrlDynamicButton
            userId={userId}
            userIp={userIp}
            onUserCreditsUpdate={handleUserCreditsUpdate}
          />
          <MyAssets />
        </>
      );
    } else if (pathname === '/freeflow/text-to-video') {
      return (
        <>
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
          <MyAssets />
        </>
      );
    } else if (pathname === '/freeflow/signin/signup') {
      return (
        <>
          <VideoFromTextDynamicButton
            userId={userId}
            userIp={userIp}
            onUserCreditsUpdate={handleUserCreditsUpdate}
          />
          <MyAssets />
        </>
      );
    } else if (pathname === '/freeflow/upload-to-video') {
      return (
        <>
          <FileInterpreter userId={userId} userIp={userIp} />
        </>
      );
    } else if (isLocalhost && pathname === '/freeflow/admin') {
      return (
        <>
          <GalleryAssets />
        </>
      );
    }
    return null;
  };

  // If there's a context error, show a recovery UI
  if (contextError) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="text-center p-8 max-w-lg">
          <h1 className="text-4xl font-extrabold mb-6">GenTube.ai</h1>
          <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Loading your session...
            </h2>
            <p className="text-gray-700 mb-4">
              We are preparing your session. If the page does not load, try
              clicking 'Reload Page' or 'Return to Home' to restart the session.
            </p>
            <Button
              variant="slim"
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reload Page
            </Button>
          </div>
          <div className="mt-4">
            <Link href="/start">
              <Button variant="slim">Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container grid gap-4">
            <div className="grid gap-2 text-center">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl">
                GenTube.ai
              </h1>
              <h2 className="max-w-2xl m-auto mt-5 text-xl sm:text-center sm:text-2xl pr-6">
                <Link href="/start" className="back-button">
                  ←
                </Link>
                Generate AI Images and Videos - Free Flow
              </h2>
              {signInMessage && (
                <h1 className="text-xl font-bold">{signInMessage}</h1>
              )}
            </div>
            <div className="grid gap-4">
              <nav className="flex flex-wrap justify-center gap-1">
                <Link href="/freeflow">
                  <Button variant="slim">Image Gen</Button>
                </Link>
                <Link href="/freeflow/image-url-to-video">
                  <Button variant="slim">URL to Video</Button>
                </Link>
                <Link href="/freeflow/text-to-video">
                  <Button variant="slim">Video Gen</Button>
                </Link>
                <Link href="/freeflow/upload-to-video">
                  <Button variant="slim">Upload Image</Button>
                </Link>
                {isLocalhost && (
                  <Link href="/freeflow/admin">
                    <Button variant="slim">Admin</Button>
                  </Link>
                )}
                <Link href="/start">
                  <Button variant="slim" className="btn-red">
                    Guide Me Now
                  </Button>
                </Link>
              </nav>
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </UserCreditsProvider>
  );
}
