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

export default function Home() {
  const [userId] = useState<string | 'none'>(useUserId() || 'none');
  const userIp = useUserIp();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);
  const pathname = usePathname();

  const handleUserCreditsUpdate = useCallback((credits: number | null) => {
    setUserCredits(credits);
  }, []);

  const signInMessage =
    userId && userId == 'none' ? (
      <button
        onClick={() => (window.location.href = '/signin')}
        className="font-light text-md"
      >
        Sign In for 110 free credits (1 time).
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

  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container grid gap-4">
            <div className="grid gap-2 text-center">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl">
                GenTube.ai
              </h1>
              <p className="max-w-2xl m-auto mt-5 text-xl sm:text-center sm:text-2xl">
                Generate AI Images and Videos
              </p>
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
                <Link href="/">
                  <Button variant="slim">Guide Me</Button>
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
