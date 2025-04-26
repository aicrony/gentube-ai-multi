// app/business/page.tsx
'use client';

import Link from 'next/link';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import Button from '@/components/ui/Button';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import React from 'react';

export default function BusinessWorkflow() {
  const userId = useUserId() || 'none';
  const userIp = useUserIp();

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
              <h2 className="text-2xl font-bold mt-6 pr-6">
                <Link href="/start" className="back-button">
                  ←
                </Link>
                Business Workflow
              </h2>
              <p className="max-w-2xl m-auto mt-2 text-xl sm:text-center">
                Professional videos and images for your brand
              </p>
              {signInMessage && (
                <h3 className="text-xl font-bold mt-4">{signInMessage}</h3>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mt-4">
              <Link href="/business/logo-animation" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Logo Animation</h3>
                  <p className="">
                    Turn your logo into a dynamic animated video
                  </p>
                </div>
              </Link>

              <Link href="/business/brand-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Brand Image</h3>
                  <p className="">
                    Create professional images aligned with your brand identity
                  </p>
                </div>
              </Link>

              <Link href="/business/product-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">
                    Product Placement
                  </h3>
                  <p className="">
                    Place your products in professional, custom scenes
                  </p>
                </div>
              </Link>

              <Link href="/business/product-video" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Product Video</h3>
                  <p className="">
                    Showcase your products with engaging videos
                  </p>
                </div>
              </Link>

              <Link href="/business/social-media" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">
                    Social Media Post
                  </h3>
                  <p className="">
                    Create business social posts for LinkedIn, Facebook, and
                    more
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </UserCreditsProvider>
  );
}
