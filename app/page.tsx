'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaPalette } from 'react-icons/fa';
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
  // Now we can safely use contexts since we have error handling at the layout level
  const userId = useUserId() || 'none';
  const userIp = useUserIp();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);
  const pathname = usePathname();

  // IP fetching and error handling is now done at the layout level

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
    // Switch content based on pathname
    if (pathname === '/image-url-to-video') {
      return (
        <>
          <VideoFromUrlDynamicButton
            userId={userId}
            userIp={userIp}
            onUserCreditsUpdate={handleUserCreditsUpdate}
          />
          <MyAssets autoRefreshQueued={true} />
        </>
      );
    } else if (pathname === '/text-to-video') {
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
          <MyAssets autoRefreshQueued={true} />
        </>
      );
    } else if (pathname === '/upload-to-video') {
      return (
        <>
          <FileInterpreter userId={userId} userIp={userIp} />
        </>
      );
    } else if (isLocalhost && pathname === '/admin') {
      return (
        <>
          <GalleryAssets />
        </>
      );
    } else {
      // Default home page (image generation)
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
          <MyAssets autoRefreshQueued={true} />
        </>
      );
    }
  };

  // Error handling is now done at the layout level

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
                Generate AI Images and Videos
              </h2>
              {signInMessage && (
                <h1 className="text-xl font-bold">{signInMessage}</h1>
              )}
              <p>
                WIN 500 Free Credits for having the most{' '}
                <a href={'/gallery'}>gallery hearts</a> EVERY MONTH
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <FaPalette className="text-purple-500" />
                <p>
                  Keep the creative juices flowing!{' '}
                  <Link href="/pricing" className="text-blue-500 hover:text-blue-600 underline">
                    See pricing
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              <nav className="flex flex-wrap justify-center gap-1">
                <Link href="/">
                  <Button
                    variant="slim"
                    className={
                      pathname === '/'
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : ''
                    }
                  >
                    Image Gen
                  </Button>
                </Link>
                <Link href="/image-url-to-video">
                  <Button
                    variant="slim"
                    className={
                      pathname === '/image-url-to-video'
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : ''
                    }
                  >
                    URL to Video
                  </Button>
                </Link>
                <Link href="/text-to-video">
                  <Button
                    variant="slim"
                    className={
                      pathname === '/text-to-video'
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : ''
                    }
                  >
                    Video Gen
                  </Button>
                </Link>
                <Link href="/upload-to-video">
                  <Button
                    variant="slim"
                    className={
                      pathname === '/upload-to-video'
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : ''
                    }
                  >
                    Upload Image
                  </Button>
                </Link>
                {isLocalhost && (
                  <Link href="/admin">
                    <Button
                      variant="slim"
                      className={
                        pathname === '/admin'
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : ''
                      }
                    >
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/start">
                  <Button
                    variant="slim"
                    className={`btn-red ${pathname === '/start' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}`}
                  >
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
