// app/personal/page.tsx
'use client';

import Link from 'next/link';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function PersonalWorkflow() {
  const [userId, setUserId] = useState<string>('none');

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    };

    checkUser();
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
              <h2 className="text-2xl font-bold mt-6 pr-6">
                <Link href="/start" className="back-button">
                  ←
                </Link>
                Personal Workflow
              </h2>
              <p className="max-w-2xl m-auto mt-2 text-xl sm:text-center">
                Create amazing content for your personal projects
              </p>
              {signInMessage && (
                <h3 className="text-xl font-bold mt-4">{signInMessage}</h3>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-4">
              <Link href="/personal/social-media" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">
                    Social Media Post
                  </h3>
                  <p className="">
                    Create eye-catching images for Instagram, TikTok, and more
                  </p>
                </div>
              </Link>

              <Link href="/personal/story-video" className="no-underline">
                <div className="theme-card">
                  <h3 className="text-xl font-semibold mb-2">Story Video</h3>
                  <p className="">
                    Generate engaging videos from your text descriptions
                  </p>
                </div>
              </Link>

              <Link href="/personal/animate-photo" className="no-underline">
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
