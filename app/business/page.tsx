// app/business/page.tsx
'use client';

import Link from 'next/link';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import Button from '@/components/ui/Button';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import React from 'react';
import PricingBadge from '@/components/ui/Pricing/PricingBadge';

export default function BusinessWorkflow() {
  const userId = useUserId() || 'none';
  const userIp = useUserIp();

  const signInMessage =
    userId === 'none' ? (
      <button
        onClick={() => (window.location.href = '/signin')}
        className="font-light text-md"
      >
        Sign In for free credits (1 time).
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
                Business Workflows
              </h2>
              <p className="max-w-2xl m-auto mt-2 text-xl sm:text-center">
                Professional videos and images for your brand
              </p>
              {signInMessage && (
                <h3 className="text-xl font-bold mt-4">{signInMessage}</h3>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mt-4">
              <Link href="/business/logo-creation" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">
                    Logo & Meme Creation
                  </h3>
                  <p className="">
                    Create professional logos, memes, and digital assets.
                  </p>
                </div>
              </Link>

              <Link href="/business/business-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Business Image</h3>
                  <p className="">
                    {/*Create professional images aligned with your brand identity*/}
                    Create professional images for commercial use.
                  </p>
                </div>
              </Link>

              <Link href="/business/product-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Product Image</h3>
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
                <div className="theme-card relative">
                  <PricingBadge label="Coming Soon!" />
                  <h3 className="text-xl font-semibold mb-2">
                    Share Social Post
                  </h3>
                  <p className="">Share your created assets on social sites</p>
                </div>
              </Link>

              <Link href="/business/brand-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Brand Image</h3>
                  <p className="">
                    Combine logo with images to create professional mashups.
                  </p>
                </div>
              </Link>

              <Link href="/business/manage-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">
                    View & Manage Assets
                  </h3>
                  <p className="">
                    View, delete, and download images and videos
                  </p>
                </div>
              </Link>

              <Link href="/business/upload-image" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">
                    Upload Multiple Images
                  </h3>
                  <p className="">
                    Prepare your work by uploading multiple assets
                  </p>
                </div>
              </Link>

              <Link href="/business/animate-photo" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">
                    Animate Your Photo
                  </h3>
                  <p className="">
                    Turn your still images into stunning videos
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
