/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/GWPlXLgL8q7
 */

'use client';
import React, { useState } from 'react';
import { VideoFromUrlDynamicButton } from '@/components/dynamic/video-from-url-button-event';
import { ImageDynamicButton } from '@/components/dynamic/image-button-event';
// import { VideoFromUploadedImageDynamicButton } from '@/components/dynamic/video-from-uploaded-image';
import Image from 'next/image';
import { VideoFromTextDynamicButton } from '@/components/dynamic/video-from-text-button-event';

export default function Home() {
  const videos = {
    // "1": "./generated_videos/2b03e7198c241c9cc304feda700452490ad2305ac22df7929817862b391d597e.mp4",
    // "2": "./generated_videos/5f3aeb4f6e7f430bee6c93b79e9dda62462cccfc579ce650bf594c7d905123be.mp4",
    // "3": "./generated_videos/006dbf3f6b2bc5f9103704acf23a58d82eec81f0c73a100d6ce501eba97cfc6b.mp4",
    'John Sentient Self-Portrait':
      './generated_videos/john-sentient-self-portrait.mp4',
    // "5": "./generated_videos/77d082cf2208c11f4e3c052a87758c302c5f33c2226be1984dec83ecabb06048.mp4",
    'Fireflies in Forrest v1': './generated_videos/fireflies-in-forrest-v1.mp4',
    'Shooting Stars v1': './generated_videos/shooting-stars-v1.mp4',
    'Godzilla v2': './generated_videos/godzilla-v2.mp4',
    // "8": "./generated_videos/a6a3a1ebbd9bd6cf27be15d1726dbaa974b68f9abde0df841e73c8334a466701.mp4",
    // "9": "./generated_videos/d726ea47c697e8350524f6102266893b9c8e0f20ee0fa617fde360f83212180e.mp4",
    'Godzilla v3': './generated_videos/godzilla-v3.mp4',
    'Godzilla v4': './generated_videos/godzilla-v4.mp4',
    'Firey Sky v1': './generated_videos/firey-sky-v1.mp4'
  };

  return (
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
            {/*<form className="grid gap-4">*/}
            <div className="grid gap-2">
              <ImageDynamicButton />

              {/*<VideoFromUploadedImageDynamicButton />*/}

              <VideoFromUrlDynamicButton />

              <VideoFromTextDynamicButton />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 pt-10">
            {/*<VideoList videos={videos} />*/}
            {/*<YouTubeVideoList videos={videos} />*/}
          </div>
        </div>
      </main>
    </div>
  );
}

function PlayCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function UserCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <div
      style={{
        display: 'inline-block',
        backgroundColor: 'white',
        borderRadius: '50%',
        padding: '10px'
      }}
    >
      <Image
        src="/logo.png"
        alt={'Logo'}
        width={50} // specify width
        height={50} // specify height
      />
    </div>
  );
}
