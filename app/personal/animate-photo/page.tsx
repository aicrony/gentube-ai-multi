'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUserCredits,
  UserCreditsProvider
} from '@/context/UserCreditsContext';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Uploader from '@/components/dynamic/uploader';
import { VideoFromUrlDynamicButton } from '@/components/dynamic/video-from-url-button-event';
import '@/styles/main.css';

function AnimatePhotoContent() {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userCreditsResponse } = useUserCredits();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userIp, setUserIp] = useState<string>('127.0.0.1');

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        // Getting IP is typically handled by middleware in a real app
        // For now, we'll use a placeholder
      } else {
        router.push('/signin');
      }
    };

    checkUser();
  }, [router]);

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setError(null);
  };

  const handleUserCreditsUpdate = (newCredits: number | null) => {
    // This function will be passed to the VideoFromUrlDynamicButton
    // and will be called when credits are updated
    console.log('Credits updated:', newCredits);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 mt-16 pt-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Animate Your Photo</h1>
        <p className="text-lg">
          Transform your still images into dynamic videos
        </p>
        <p className="mt-2">Available credits: {userCreditsResponse || 0}</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'var(--secondary-color)' }}
      >
        <h2 className="text-xl font-bold mb-4">Step 1: Upload Your Photo</h2>
        <div className="upload-dropzone">
          <Uploader
            onImageUploaded={handleImageUploaded}
            userId={userId || undefined}
          />
        </div>
        {uploadedImageUrl && (
          <div className="mt-4 text-green-600">
            Image uploaded successfully! Proceed to Step 2.
          </div>
        )}
      </div>

      {userId && (
        <div
          className="p-6 rounded-lg mb-8"
          style={{ backgroundColor: 'var(--secondary-color)' }}
        >
          <h2 className="text-xl font-bold mb-4">Step 2: Animate Your Photo</h2>
          <VideoFromUrlDynamicButton
            userId={userId}
            userIp={userIp}
            onUserCreditsUpdate={handleUserCreditsUpdate}
            urlData={uploadedImageUrl || ''}
          />
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/personal" className="text-blue-600 hover:underline">
          ← Back to Personal Workflow
        </Link>
      </div>
    </div>
  );
}

export default function AnimatePhotoPage() {
  return (
    <UserCreditsProvider>
      <AnimatePhotoContent />
    </UserCreditsProvider>
  );
}
