'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

const ImageGallery: React.FC = () => {
  const [media, setMedia] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const requiredClickCount = 20;

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const cachedMedia = localStorage.getItem('mediaUrls');
        if (cachedMedia) {
          setMedia(JSON.parse(cachedMedia));
        } else {
          await fetchAndSetMedia();
        }
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };

    fetchMedia();
  }, []);

  const fetchAndSetMedia = async () => {
    try {
      const response = await fetch('/api/getPublicAssets?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const mediaUrls = await response.json();
      const randomMedia = mediaUrls
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);
      setMedia(randomMedia);
      localStorage.setItem('mediaUrls', JSON.stringify(randomMedia));
      setClickCount(0); // Reset click count
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const handleMediaClick = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert('Media URL copied to clipboard');
      })
      .catch((error) => {
        console.error('Error copying URL to clipboard:', error);
      });
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : media.length - 1
    );
    setClickCount((prevCount) => prevCount + 1);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < media.length - 1 ? prevIndex + 1 : 0
    );
    setClickCount((prevCount) => prevCount + 1);
  };

  const renderMedia = (url: string) => {
    const isVideo = url.endsWith('.mp4');
    if (isVideo) {
      return (
        <video
          src={url}
          controls
          autoPlay
          className="w-3/5 cursor-pointer md:w-full"
          onClick={() => handleMediaClick(url)}
        />
      );
    } else {
      return (
        <img
          src={url}
          alt={`Media ${currentIndex + 1}`}
          className="w-3/5 cursor-pointer md:w-full"
          onClick={() => handleMediaClick(url)}
        />
      );
    }
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
            {clickCount >= requiredClickCount && (
              <Button
                variant="slim"
                onClick={fetchAndSetMedia}
                loading={isSubmitting}
              >
                More Media
              </Button>
            )}
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
