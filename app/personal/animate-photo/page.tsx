'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUserCredits,
  UserCreditsProvider
} from '@/context/UserCreditsContext';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

function AnimatePhotoContent() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        router.push('/signin');
      }
    };

    checkUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const animatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoFile) {
      setError('Please select a photo to animate');
      return;
    }

    if (!userCreditsResponse || userCreditsResponse < 10) {
      setError('Not enough credits. You need 10 credits to animate a photo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Here you would implement the API call to your animation service
      // This is a placeholder for the actual implementation

      // Simulate API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // After successful animation, update credits and set result
      setUserCreditsResponse(userCreditsResponse - 10);
      setResult('https://example.com/animated-video.mp4'); // Placeholder result URL
    } catch (err) {
      setError('Failed to animate photo. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

      <form onSubmit={animatePhoto} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Upload your photo (10 credits)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm rounded p-2"
          />
          {photoPreview && (
            <div className="mt-2">
              <Image
                src={photoPreview}
                alt="Photo preview"
                width={300}
                height={300}
                className="object-contain rounded"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Describe how you want your photo to be animated
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded p-2"
            placeholder="E.g., 'Make the water ripple and the leaves gently sway in the wind'"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !photoFile}
          className={`w-full py-2 px-4 rounded font-medium ${
            loading || !photoFile
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Animate Photo'}
        </button>
      </form>

      {result && (
        <div className="mt-8 p-4 border border-green-300 rounded bg-green-50">
          <h3 className="text-xl font-semibold mb-2">
            Your animated video is ready!
          </h3>
          <div className="aspect-video bg-black rounded overflow-hidden">
            <video src={result} controls className="w-full h-full" />
          </div>
          <div className="mt-4 flex justify-between">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
              Download Video
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              Share Video
            </button>
          </div>
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
