'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { FaExternalLinkAlt, FaImage, FaVideo, FaLink } from 'react-icons/fa';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import { useRouter } from 'next/navigation';
import MyAssets from '@/components/dynamic/my-assets';

interface GalleryItem {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
}

const ImageGallery: React.FC = () => {
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting] = useState(false);
  const [regenerateInProgress, setRegenerateInProgress] = useState(false);
  const [showMyAssets, setShowMyAssets] = useState(false);
  const userId = useUserId();
  const userIp = useUserIp();
  const router = useRouter();

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const cachedMedia = localStorage.getItem('mediaUrls');
        const cachedTimestamp = localStorage.getItem('mediaUrlsTimestamp');
        const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

        if (cachedMedia && cachedTimestamp) {
          const parsedTimestamp = new Date(cachedTimestamp).getTime();
          const currentTime = new Date().getTime();

          if (currentTime - parsedTimestamp < twelveHours) {
            const parsedMedia = JSON.parse(cachedMedia);
            if (parsedMedia.length > 0 && parsedMedia[0].CreatedAssetUrl) {
              setMedia(parsedMedia);
              return;
            }
          }
        }

        await fetchAndSetMedia();
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };

    fetchMedia();
  }, []);

  const fetchAndSetMedia = async () => {
    try {
      const response = await fetch('/api/getGalleryAssets?limit=60', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const mediaData = await response.json();
      
      // Log the media data to debug missing prompts
      console.log('Gallery assets fetched:', mediaData);
      
      // Ensure each item has a Prompt property with a fallback
      const processedMedia = mediaData.map((item: any) => ({
        ...item,
        Prompt: item.Prompt || 'No prompt available'
      }));
      
      setMedia(processedMedia);
      localStorage.setItem('mediaUrls', JSON.stringify(processedMedia));
      localStorage.setItem('mediaUrlsTimestamp', new Date().toISOString());
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : media.length - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < media.length - 1 ? prevIndex + 1 : 0
    );
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const handleCreateImage = async (prompt: string) => {
    if (!userId) {
      router.push('/signin');
      return;
    }
    
    if (!prompt || prompt.trim() === '') {
      alert('Cannot create image: No prompt available');
      return;
    }

    setRegenerateInProgress(true);
    setShowMyAssets(true);

    try {
      console.log('Creating image with prompt:', prompt);
      
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'none',
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({ prompt: prompt })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create image:', data);
        alert('Failed to create image. Please try again.');
      } else {
        console.log('Image creation response:', data);
        if (data.result === 'InQueue') {
          alert('Your image has been added to the queue. Check My Assets for updates.');
        }
      }
    } catch (error) {
      console.error('Error creating image:', error);
      alert('An error occurred while creating the image. Please try again.');
    } finally {
      setRegenerateInProgress(false);
    }
  };

  const handleCreateVideo = async (item: GalleryItem) => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    setRegenerateInProgress(true);
    setShowMyAssets(true);

    try {
      // Use AssetSource if the current item is a video, otherwise use CreatedAssetUrl
      const imageUrl = item.AssetType === 'vid' ? item.AssetSource : item.CreatedAssetUrl;
      
      // Log data being sent for debugging
      console.log('Creating video with:', {
        imageUrl,
        prompt: item.Prompt,
        assetType: item.AssetType
      });
      
      // Don't proceed if we don't have an image URL
      if (!imageUrl) {
        console.error('Cannot create video: Missing image URL');
        alert('Cannot create video: Missing source image');
        setRegenerateInProgress(false);
        return;
      }
      
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'none',
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({
          url: imageUrl,
          description: item.Prompt || 'Generate a video from this image',
          duration: '5',
          aspectRatio: '16:9',
          motion: 'Static',
          loop: false
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create video:', data);
        alert('Failed to create video. Please try again.');
      } else {
        console.log('Video creation response:', data);
        if (data.result === 'InQueue') {
          alert('Your video has been added to the queue. Check My Assets for updates.');
        }
      }
    } catch (error) {
      console.error('Error creating video:', error);
      alert('An error occurred while creating the video. Please try again.');
    } finally {
      setRegenerateInProgress(false);
    }
  };

  const renderMedia = (mediaItem: GalleryItem) => {
    const url = mediaItem.CreatedAssetUrl;
    const isVideo = url && url.length > 0 && url.endsWith('.mp4');
    
    // Determine source image URL for video items
    const sourceImageUrl = mediaItem.AssetType === 'vid' && mediaItem.AssetSource 
      ? mediaItem.AssetSource 
      : null;
      
    console.log('Rendering media item:', {
      type: mediaItem.AssetType,
      url,
      sourceUrl: mediaItem.AssetSource,
      isVideo
    });
    
    return (
      <div className="relative">
        <div className="flex justify-end">
          <FaExternalLinkAlt
            onClick={() => handleExternalLink(url)}
            className="relative mb-1 text-gray-500 cursor-pointer"
            title="Open in new tab"
          />
        </div>
        
        {/* Main media display */}
        {isVideo ? (
          <>
            <video
              src={url}
              controls
              autoPlay
              className="w-full cursor-pointer md:w-full max-w-2xl mx-auto"
            />
            
            {/* Show source image if available for videos and not empty or "none" */}
            {sourceImageUrl && sourceImageUrl !== 'none' && sourceImageUrl !== '' && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500 mb-1">Source image:</p>
                <img
                  src={sourceImageUrl}
                  alt="Source image"
                  className="w-full md:w-full max-w-lg mx-auto border border-gray-300"
                />
              </div>
            )}
          </>
        ) : (
          <img
            src={url}
            alt={`Media ${currentIndex + 1}`}
            className="w-full cursor-pointer md:w-full max-w-2xl mx-auto"
          />
        )}
        
        {/* Prompt Display */}
        <div className="my-4 text-center max-w-2xl mx-auto">
          <h3 className="font-bold mb-2">Prompt:</h3>
          <p className="mb-4">{mediaItem.Prompt || 'No prompt available'}</p>
          
          {/* Debug Info */}
          <div className="text-xs text-gray-500 mb-2">
            <p>Asset Type: {mediaItem.AssetType || 'Unknown'}</p>
            {mediaItem.AssetSource && (
              <p>Source: {mediaItem.AssetSource.substring(0, 40)}...</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            <Button 
              variant="slim"
              onClick={() => handleCreateImage(mediaItem.Prompt || '')}
              disabled={regenerateInProgress || !mediaItem.Prompt}
              title={!mediaItem.Prompt ? "No prompt available for regeneration" : "Create image using this prompt"}
              loading={regenerateInProgress}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <FaImage /> Create Image
            </Button>
            
            <Button 
              variant="slim"
              onClick={() => handleCreateVideo(mediaItem)}
              disabled={regenerateInProgress}
              title="Create video from this media"
              loading={regenerateInProgress}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <FaVideo /> Create Video
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-center text-2xl font-bold pt-5">
        Public Media Gallery
      </h1>
      {media.length > 0 && (
        <div className="mt-1">
          <div className="flex justify-center gap-1">
            <Button
              variant="slim"
              onClick={handlePrevious}
              loading={isSubmitting}
            >
              Previous
            </Button>
            <Button variant="slim" onClick={handleNext} loading={isSubmitting}>
              Next
            </Button>
          </div>
          <div className="flex justify-center mt-5 flex-col">
            {renderMedia(media[currentIndex])}
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {regenerateInProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Processing your request...</p>
            <p className="text-sm text-gray-600 mt-2">This may take a few moments.</p>
          </div>
        </div>
      )}
      
      {/* Show MyAssets component when regenerate is triggered */}
      {showMyAssets && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-center mb-4">Your Generated Assets</h2>
          <MyAssets autoRefreshQueued={true} />
        </div>
      )}
    </div>
  );
};

export default ImageGallery;