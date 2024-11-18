import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const cachedImages = localStorage.getItem('imageUrls');
        if (cachedImages) {
          setImages(JSON.parse(cachedImages));
        } else {
          const response = await fetch('/api/getImages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const imageUrls = await response.json();
          setImages(imageUrls);
          localStorage.setItem('imageUrls', JSON.stringify(imageUrls));
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  const handleImageClick = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert('Image URL copied to clipboard');
      })
      .catch((error) => {
        console.error('Error copying URL to clipboard:', error);
      });
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : images.length - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < images.length - 1 ? prevIndex + 1 : 0
    );
  };

  return (
    <div>
      <h1>Public Image Gallery</h1>
      {images.length > 0 && (
        <div>
          <div
            style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}
          >
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px'
            }}
          >
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              style={{
                width: '60%',
                cursor: 'pointer'
              }}
              onClick={() => handleImageClick(images[currentIndex])}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
