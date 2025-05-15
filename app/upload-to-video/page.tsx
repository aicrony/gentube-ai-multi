'use client';

import React, { useState } from 'react';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import { UserCreditsProvider } from '@/context/UserCreditsContext';
import FileInterpreter from '@/functions/FileInterpreter';
import { VideoFromUrlDynamicButton } from '@/components/dynamic/video-from-url-button-event';
import MyAssets from '@/components/dynamic/my-assets';

export default function UploadToVideoPage() {
  const userId = useUserId() || 'none';
  const userIp = useUserIp();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [showQueuedAssets, setShowQueuedAssets] = useState<boolean>(false);
  const [videoGenerated, setVideoGenerated] = useState<boolean>(false);

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
  };

  const handleUserCreditsUpdate = (credits: number | null) => {
    setUserCredits(credits);
  };
  
  const handleVideoGenerated = (result: string) => {
    setVideoGenerated(true);
    setShowQueuedAssets(true);
  };

  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container grid gap-4">
            <div className="grid gap-2 text-center">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl">
                GenTube.ai
              </h1>
              <h2 className="max-w-2xl m-auto mt-5 text-xl sm:text-center sm:text-2xl">
                Upload Image to Create Video
              </h2>
            </div>

            <div className="grid gap-4">
              {/* Upload section */}
              <FileInterpreter
                userId={userId}
                userIp={userIp}
                onImageUploaded={handleImageUploaded}
              />

              {/* Show video from URL component after successful upload */}
              {uploadedImageUrl && (
                <div className="mt-8 border-t pt-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Create Video from Your Uploaded Image
                  </h2>
                  <VideoFromUrlDynamicButton
                    userId={userId}
                    userIp={userIp}
                    urlData={uploadedImageUrl}
                    onUserCreditsUpdate={handleUserCreditsUpdate}
                    onVideoGenerated={handleVideoGenerated}
                  />
                </div>
              )}
              
              {/* Show assets with auto-refresh when video is generated/queued */}
              {showQueuedAssets && (
                <div className="mt-8 border-t pt-8">
                  <h2 className="text-2xl font-bold mb-4">Your Assets</h2>
                  <p className="mb-4">Your video is being generated and will appear below shortly.</p>
                  <MyAssets autoRefreshQueued={true} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </UserCreditsProvider>
  );
}
