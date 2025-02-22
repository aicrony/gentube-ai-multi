'use client';

import dynamic from 'next/dynamic';
import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { VideoFromUrlDynamicButton } from '@/components/dynamic/video-from-url-button-event';
import { ImageDynamicButton } from '@/components/dynamic/image-button-event';
import { VideoFromTextDynamicButton } from '@/components/dynamic/video-from-text-button-event';
import MyAssets from '@/components/dynamic/my-assets';
import ImageGallery from '@/functions/getGallery';
import Button from '@/components/ui/Button';
import { useUserId } from '@/context/UserIdContext';
import { UserIpProvider } from '@/context/UserIpContext';
import FileInterpreter from '@/functions/FileInterpreter';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import GalleryAssets from '@/components/dynamic/gallery-assets';

const BrowserRouter = dynamic(
  () => import('react-router-dom').then((mod) => mod.BrowserRouter),
  { ssr: false }
);

export default function Home() {
  const [userId] = useState<string | 'none'>(useUserId() || 'none');
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);

  const handleUserCreditsUpdate = useCallback((credits: number | null) => {
    setUserCredits(credits);
  }, []);

  const signInMessage =
    userId && userId == 'none' ? (
      <span>
        <a href="/signin" className="font-light text-md">
          Sign In for 110 free credits (1 time).
        </a>
      </span>
    ) : (
      ''
    );

  useEffect(() => {
    if (userCredits !== null) {
      setDisplayName(` - Credits: ${userCredits}`);
    }
  }, [userCredits]);

  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      setIsLocalhost(true);
    }
  }, []);

  return (
    <UserCreditsProvider>
      <UserIpProvider>
        <BrowserRouter>
          <div className="w-full min-h-screen flex flex-col gap-2">
            <main className="flex-1 items-center justify-center">
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
                    <Link to="/">
                      <Button variant="slim">Image Gen</Button>
                    </Link>
                    <Link to="/image-url-to-video">
                      <Button variant="slim">URL to Video</Button>
                    </Link>
                    <Link to="/text-to-video">
                      <Button variant="slim">Video Gen</Button>
                    </Link>
                    <Link to="/upload-to-video">
                      <Button variant="slim">Upload Image</Button>
                    </Link>
                    {isLocalhost && (
                      <Link to="/admin">
                        <Button variant="slim">Admin</Button>
                      </Link>
                    )}
                  </nav>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <>
                          <ImageDynamicButton
                            userId={userId}
                            onUserCreditsUpdate={handleUserCreditsUpdate}
                          />
                          <MyAssets />
                        </>
                      }
                    />
                    <Route
                      path="/image-url-to-video"
                      element={
                        <>
                          <VideoFromUrlDynamicButton
                            userId={userId}
                            onUserCreditsUpdate={handleUserCreditsUpdate}
                          />
                          <MyAssets />
                        </>
                      }
                    />
                    <Route
                      path="/text-to-video"
                      element={
                        <>
                          <VideoFromTextDynamicButton
                            userId={userId}
                            onUserCreditsUpdate={handleUserCreditsUpdate}
                          />
                          <MyAssets />
                        </>
                      }
                    />
                    <Route
                      path="/signin/signup"
                      element={
                        <>
                          <VideoFromTextDynamicButton
                            userId={userId}
                            onUserCreditsUpdate={handleUserCreditsUpdate}
                          />
                          <MyAssets />
                        </>
                      }
                    />
                    <Route
                      path="/upload-to-video"
                      element={
                        <>
                          <FileInterpreter />
                        </>
                      }
                    />
                    {isLocalhost && (
                      <Route
                        path="/admin"
                        element={
                          <>
                            <GalleryAssets />
                          </>
                        }
                      />
                    )}
                  </Routes>
                </div>
              </div>
            </main>
          </div>
        </BrowserRouter>
      </UserIpProvider>
    </UserCreditsProvider>
  );
}
