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
import { VideoFromUploadedImage } from '@/components/dynamic/video-from-uploaded-image';
import '@/styles/main.css';
import MyAssets from '@/components/dynamic/my-assets';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface UserAsset {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType?: string | string[] | undefined;
  DateTime: Date;
}

function AnimatePhotoContent() {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userIp, setUserIp] = useState<string>('127.0.0.1');
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openSteps, setOpenSteps] = useState<{
    [key: string | number]: boolean;
  }>({
    1: true,
    2: false,
    3: false,
    assets: false // Default to hidden assets
  });
  const [credits, setCredits] = useState<number | null>(null);

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

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        if (!userId || userIp === 'unknown') return;

        const response = await fetch(
          `/api/getUserCredits?userId=${userId}&userIp=${userIp}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch user credits');
        }
        const data = await response.json();
        setCredits(data.credits);
        if (setUserCreditsResponse) {
          setUserCreditsResponse(data.credits);
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    };

    if (userId && userIp !== 'unknown') {
      fetchCredits();
    }
  }, [userId, userIp, setUserCreditsResponse]);

  // Auto-expand Step 2 when upload is complete
  useEffect(() => {
    if (uploadedImageUrl) {
      setOpenSteps((prev) => ({ ...prev, 2: true }));
    }
  }, [uploadedImageUrl]);

  const handleImageUploaded = (imageUrl: string) => {
    // If empty string is passed, it means deselection
    if (imageUrl === '') {
      setUploadedImageUrl(null);
    } else {
      setUploadedImageUrl(imageUrl);
    }
    setError(null);
  };

  const handleUserCreditsUpdate = (newCredits: number | null) => {
    console.log('Credits updated:', newCredits);
    // After animation is complete, expand step 3
    setOpenSteps((prev) => ({ ...prev, 3: true }));
  };

  const toggleStep = (stepNumber: number) => {
    setOpenSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  return (
    <div className="steps-container py-8 pt-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 pr-6">
          <Link href="/business" className="back-button">
            ←
          </Link>
          Animate Your Photo
        </h1>
        <p className="text-lg">
          Transform your still images into dynamic videos
        </p>
        <p className="mt-2">
          {credits !== null
            ? `Available credits: ${credits}`
            : 'Loading credits...'}
        </p>
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
        <button
          onClick={() => toggleStep(1)}
          className="w-full text-left flex justify-between items-center"
        >
          <h2 className="text-xl font-bold">Step 1: Select Your Photo</h2>
          <span>
            {openSteps[1] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[1] && (
          <div className="mt-4">
            {!openSteps['assets'] && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">
                  Upload a new photo:
                </h3>
                <Uploader
                  onImageUploaded={handleImageUploaded}
                  userId={userId || undefined}
                />
              </div>
            )}

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">
                  {openSteps['assets']
                    ? 'Select from your assets:'
                    : 'Or select from your assets:'}
                </h3>
                <button
                  onClick={() =>
                    setOpenSteps((prev) => ({
                      ...prev,
                      assets: !prev['assets']
                    }))
                  }
                  className="text-sm px-3 py-1 rounded-md toggle-button"
                >
                  {openSteps['assets']
                    ? 'Upload Image Instead ↑'
                    : 'Select From Assets ↓'}
                </button>
              </div>
              {openSteps['assets'] && (
                <MyAssets
                  assetType="upl,img"
                  selectedUrl={uploadedImageUrl || undefined}
                  onSelectAsset={(url) => handleImageUploaded(url)}
                />
              )}
            </div>

            {uploadedImageUrl && (
              <div className="mt-4 text-green-600">
                Image selected successfully! Proceed to Step 2.
              </div>
            )}
          </div>
        )}
      </div>

      {userId && (
        <div
          className="p-6 rounded-lg mb-8"
          style={{ backgroundColor: 'var(--secondary-color)' }}
        >
          <button
            onClick={() => toggleStep(2)}
            className="w-full text-left flex justify-between items-center"
          >
            <h2 className="text-xl font-bold">Step 2: Animate Your Photo</h2>
            <span>
              {openSteps[2] ? (
                <FaChevronDown size={18} />
              ) : (
                <FaChevronRight size={18} />
              )}
            </span>
          </button>

          {openSteps[2] && (
            <div className="mt-4">
              <VideoFromUploadedImage
                userId={userId}
                userIp={userIp}
                onUserCreditsUpdate={handleUserCreditsUpdate}
                urlData={uploadedImageUrl || ''}
              />
            </div>
          )}
        </div>
      )}

      <div
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'var(--secondary-color)' }}
      >
        <button
          onClick={() => toggleStep(3)}
          className="w-full text-left flex justify-between items-center"
        >
          <h2 className="text-xl font-bold">Step 3: Refresh Your Assets</h2>
          <span>
            {openSteps[3] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[3] && (
          <div className="mt-4">
            <MyAssets autoRefreshQueued={true} />
          </div>
        )}
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
