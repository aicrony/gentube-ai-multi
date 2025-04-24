import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  userId?: string;
}

function Uploader({ onImageUploaded, userId }: UploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heif'];
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filteredFiles = acceptedFiles.filter((file: File) => {
      const fileExtension = file.name.split('.').pop();
      return allowedExtensions.includes(`.${fileExtension?.toLowerCase()}`);
    });

    if (filteredFiles.length === 0) {
      setUploadError("Please upload a supported image file (JPG, JPEG, PNG, HEIF)");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    for (const file of filteredFiles) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          try {
            // Call the API endpoint to upload the image
            const response = await fetch('/api/uploadImage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                image: base64data,
                userId: userId || '',
                userIp: '127.0.0.1' // This would be handled by the server in production
              })
            });

            if (!response.ok) {
              throw new Error('Failed to upload image');
            }

            const data = await response.json();
            console.log(`File uploaded to GCS: ${data.url}`);
            
            // Call the callback with the image URL if provided
            if (onImageUploaded && data.url) {
              onImageUploaded(data.url);
            }
          } catch (error) {
            console.error('Error uploading file:', error);
            setUploadError('Failed to upload image. Please try again.');
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUploaded, userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heif': ['.heif']
    }
  });

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop the image here ...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              {isUploading ? 'Uploading...' : 'Drag \'n\' drop your photo here, or click to select a file'}
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, JPEG, PNG, HEIF
            </p>
          </div>
        )}
      </div>
      
      {uploadError && (
        <div className="mt-2 text-red-500 text-sm">
          {uploadError}
        </div>
      )}
    </div>
  );
}

export default Uploader;
