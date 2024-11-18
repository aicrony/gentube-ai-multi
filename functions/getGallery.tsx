import React, { useEffect, useState } from 'react';

const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);

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

  return (
    <div>
      <h1>Image Gallery</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {images.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Image ${index + 1}`}
            style={{
              width: '200px',
              height: '200px',
              margin: '10px',
              cursor: 'pointer'
            }}
            onClick={() => handleImageClick(url)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
