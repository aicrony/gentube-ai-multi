'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { FaExternalLinkAlt } from 'react-icons/fa';

const ImageGallery: React.FC = () => {
  const [media, setMedia] = useState<{ CreatedAssetUrl: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting] = useState(false);

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
      const formattedMedia = mediaData.map((item: any) => ({
        CreatedAssetUrl: item.CreatedAssetUrl
      }));
      setMedia(formattedMedia);
      localStorage.setItem('mediaUrls', JSON.stringify(formattedMedia));
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

  const renderMedia = (mediaItem: { CreatedAssetUrl: string }) => {
    const url = mediaItem.CreatedAssetUrl;
    const isVideo = url && url.length > 0 && url.endsWith('.mp4');
    return (
      <div className="relative">
        <div className="flex justify-end">
          <FaExternalLinkAlt
            onClick={() => handleExternalLink(url)}
            className="relative mb-1 text-gray-500 cursor-pointer"
            title="Open in new tab"
          />
        </div>
        {isVideo ? (
          <video
            src={url}
            controls
            autoPlay
            className="w-3/5 cursor-pointer md:w-full"
          />
        ) : (
          <img
            src={url}
            alt={`Media ${currentIndex + 1}`}
            className="w-3/5 cursor-pointer md:w/full"
          />
        )}
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
          <div className="flex justify-center mt-5">
            {renderMedia(media[currentIndex])}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
