'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUserCredits,
  UserCreditsProvider
} from '@/context/UserCreditsContext';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import ProductImageGenerator from '@/components/dynamic/product-image-generator';
import '@/styles/main.css';
import MyAssets from '@/components/dynamic/my-assets';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import Uploader from '@/components/dynamic/uploader';

interface UserAsset {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType?: string | string[] | undefined;
  DateTime: Date;
}

function ProductImageContent() {
  const [error, setError] = useState<string | null>(null);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userIp, setUserIp] = useState<string>('127.0.0.1');
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openSteps, setOpenSteps] = useState<{ [key: number]: boolean }>({
    1: true,
    2: false,
    3: false
  });
  const [credits, setCredits] = useState<number | null>(null);
  const [imageGenerated, setImageGenerated] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

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
    setUploadedImageUrl(imageUrl);
    setError(null);
  };

  const handleUserCreditsUpdate = (newCredits: number | null) => {
    console.log('Credits updated:', newCredits);
    setImageGenerated(true);
    // After image generation is complete, expand step 3
    setOpenSteps((prev) => ({ ...prev, 3: true }));
  };

  const toggleStep = (stepNumber: number) => {
    setOpenSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 mt-16 pt-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Product Image Generator</h1>
        <p className="text-lg">
          Place your product in beautiful scenes and backgrounds
        </p>
        <p className="mt-2">
          {credits !== null
            ? `Available credits: ${credits}`
            : 'Loading credits...'}
        </p>
      </div>

      {error && (
        <div
          className="border px-4 py-3 rounded mb-4"
          style={{
            backgroundColor: 'rgba(241, 60, 77, 0.1)',
            borderColor: 'rgba(241, 60, 77, 0.3)',
            color: '#d8172a'
          }}
        >
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
          <h2 className="text-xl font-bold">Step 1: Upload Your Images</h2>
          <span className="flex items-center justify-center w-8 h-8">
            {openSteps[1] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[1] && (
          <div className="mt-4">
            <p className="mb-4">
              Upload your product and background images. You'll need at least
              one of each for Step 2.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div
                className="p-4 rounded-lg border shadow-sm"
                style={{ backgroundColor: 'var(--card-bg-color)' }}
              >
                <h3 className="font-semibold text-lg mb-3">
                  Upload Product Image
                </h3>
                <p className="instruction-text">
                  This is the main product you want to showcase. Upload a clear
                  image with transparent background for best results.
                </p>
                <Uploader
                  onImageUploaded={handleImageUploaded}
                  userId={userId || undefined}
                />
              </div>

              <div
                className="p-4 rounded-lg border shadow-sm"
                style={{ backgroundColor: 'var(--card-bg-color)' }}
              >
                <h3 className="font-semibold text-lg mb-3">
                  Upload Background Image
                </h3>
                <p className="instruction-text">
                  This is the scene where your product will be placed. Choose a
                  high-quality image that complements your product.
                </p>
                <Uploader
                  onImageUploaded={handleImageUploaded}
                  userId={userId || undefined}
                />
              </div>
            </div>

            {uploadedImageUrl && (
              <div className="mt-4 p-3 border rounded-md upload-success">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Image uploaded successfully!</span>
                </div>
                <p className="mt-1 text-sm">
                  Your image has been added to your assets. Proceed to Step 2 to
                  create your product image.
                </p>
              </div>
            )}

            <div className="mt-6">
              <MyAssets assetType="upl" />
            </div>
          </div>
        )}
      </div>

      <div
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'var(--secondary-color)' }}
      >
        <button
          onClick={() => toggleStep(2)}
          className="w-full text-left flex justify-between items-center"
        >
          <h2 className="text-xl font-bold">
            Step 2: Create Your Product Image
          </h2>
          <span className="flex items-center justify-center w-8 h-8">
            {openSteps[2] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[2] && (
          <div className="mt-4">
            <p className="instruction-text">
              Select your uploaded product and background images, describe the
              scene, and choose placement options to generate your professional
              product image.
            </p>

            {userId && (
              <ProductImageGenerator
                userId={userId}
                userIp={userIp}
                onUserCreditsUpdate={handleUserCreditsUpdate}
                uploadedImageUrl={uploadedImageUrl}
              />
            )}
          </div>
        )}
      </div>

      <div
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'var(--secondary-color)' }}
      >
        <button
          onClick={() => toggleStep(3)}
          className="w-full text-left flex justify-between items-center"
        >
          <h2 className="text-xl font-bold">
            Step 3: Refresh Your Product Images
          </h2>
          <span className="flex items-center justify-center w-8 h-8">
            {openSteps[3] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[3] && (
          <div className="mt-4">
            <MyAssets />
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/business" className="text-blue-600 hover:underline">
          ← Back to Business Workflow
        </Link>
      </div>
    </div>
  );
}

export default function ProductImagePage() {
  return (
    <UserCreditsProvider>
      <ProductImageContent />
    </UserCreditsProvider>
  );
}
