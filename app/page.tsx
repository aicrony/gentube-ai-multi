'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { VideoFromUrlDynamicButton } from '@/components/dynamic/video-from-url-button-event';
import { ImageDynamicButton } from '@/components/dynamic/image-button-event';
import { VideoFromTextDynamicButton } from '@/components/dynamic/video-from-text-button-event';
import ImageGallery from '@/functions/getGallery';
import Button from '@/components/ui/Button';

const BrowserRouter = dynamic(
  () => import('react-router-dom').then((mod) => mod.BrowserRouter),
  { ssr: false }
);

export default function Home() {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center">
          <div className="container grid gap-4">
            <div className="grid gap-2 text-center">
              <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
                GenTube.ai
              </h1>
              <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
                Generate AI Images and Videos
              </p>
              <p className="text-gray-500 max-w-md dark:text-gray-400" />
            </div>
            <div className="grid gap-4">
              <nav className="flex flex-wrap justify-center gap-1">
                <Link to="/" className="text-white">
                  <Button variant="slim">Image Gen</Button>
                </Link>
                <Link to="/image-url-to-video" className="text-white">
                  <Button variant="slim">Image to Video</Button>
                </Link>
                <Link to="/text-to-video" className="text-white">
                  <Button variant="slim">Video Gen</Button>
                </Link>
              </nav>
              <Routes>
                <Route path="/" element={<ImageDynamicButton />} />
                <Route
                  path="/image-url-to-video"
                  element={<VideoFromUrlDynamicButton />}
                />
                <Route
                  path="/text-to-video"
                  element={<VideoFromTextDynamicButton />}
                />
              </Routes>
            </div>
            <ImageGallery />
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
