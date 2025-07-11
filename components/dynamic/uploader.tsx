import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { handleApiError } from '@/utils/apiErrorHandler';

interface UploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  userId?: string;
}

function Uploader({ onImageUploaded, userId }: UploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heif'];
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const filteredFiles = acceptedFiles.filter((file: File) => {
        const fileExtension = file.name.split('.').pop();
        return allowedExtensions.includes(`.${fileExtension?.toLowerCase()}`);
      });

      if (filteredFiles.length === 0) {
        setUploadError(
          'Please upload a supported image file (JPG, JPEG, PNG, HEIF)'
        );
        return;
      }

      // Get the file
      const file = filteredFiles[0]; // Just use the first file

      // Check file size - 10MB limit (with some buffer below the 12MB server limit)
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

      if (file.size > maxSizeInBytes) {
        setUploadError(
          `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Please upload an image smaller than 10MB.`
        );
        return;
      }

      // Reset states
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      // Read and upload the file
      const reader = new FileReader();
      reader.onload = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          try {
            // For larger files, we'll use a two-step approach:
            // 1. Get a signed URL from our backend
            // 2. Upload directly to Google Cloud Storage using that URL

            // First get a signed upload URL from our backend
            const getSignedUrlResponse = await fetch(
              '/api/getSignedUploadUrl',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': userId || 'none',
                  'x-forwarded-for': '127.0.0.1'
                },
                body: JSON.stringify({
                  contentType: file.type,
                  fileName: file.name
                })
              }
            );

            if (!getSignedUrlResponse.ok) {
              // Handle 413 Payload Too Large specifically before other errors
              if (getSignedUrlResponse.status === 413) {
                setUploadError(
                  'File size too large. Please upload a smaller image (less than 10MB).'
                );
                setIsUploading(false);
                setPreviewImage(null);
                return;
              }

              // Use centralized error handler for other errors
              if (
                await handleApiError(getSignedUrlResponse, {
                  setErrorMessage: (msg) => setUploadError(msg)
                })
              ) {
                return; // Error was handled, exit the function
              }
            }

            const { signedUrl, finalUrl } = await getSignedUrlResponse.json();

            // Convert base64 to binary data
            // Note: We can't use Buffer in the browser, so we'll use Uint8Array instead
            const binaryString = atob(base64data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            // Create blob with the correct content type
            const fileBlob = new Blob([bytes], { type: file.type });

            // Upload directly to GCS using the signed URL
            // Note: We're using XMLHttpRequest instead of fetch for better CORS support
            const uploadResult = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('PUT', signedUrl, true);
              xhr.setRequestHeader('Content-Type', file.type);

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve({ ok: true });
                } else {
                  reject(new Error(`Upload failed with status ${xhr.status}`));
                }
              };

              xhr.onerror = () => {
                reject(new Error('XHR error occurred during upload'));
              };

              xhr.send(fileBlob);
            });

            // After successful upload to GCS using XMLHttpRequest, we continue with saving the activity
            // No need to check uploadResult since any error would be caught in the promise

            // Now save the user activity by calling our API
            const activityResponse = await fetch('/api/saveUploadActivity', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId || 'none',
                'x-forwarded-for': '127.0.0.1'
              },
              body: JSON.stringify({
                imageUrl: finalUrl
              })
            });

            if (!activityResponse.ok) {
              if (
                await handleApiError(activityResponse, {
                  setErrorMessage: (msg) => setUploadError(msg)
                })
              ) {
                return; // Error was handled, exit the function
              }
            }

            const data = await activityResponse.json();
            console.log(`File uploaded to GCS: ${finalUrl}`);

            // Set success state
            setUploadSuccess(true);

            // Call the callback with the image URL if provided
            if (onImageUploaded) {
              // Use the URL from the response if available, otherwise use the finalUrl
              const imageUrl = data.url || finalUrl;
              onImageUploaded(imageUrl);
            }
          } catch (error) {
            console.error('Error uploading file:', error);
            setUploadError('Failed to upload image. Please try again.');
            setPreviewImage(null); // Clear preview on error
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);

      // Clean up function to revoke the object URL when component unmounts
      return () => {
        if (previewImage) {
          URL.revokeObjectURL(previewImage);
        }
      };
    },
    [onImageUploaded, userId, allowedExtensions]
  );

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
      {!uploadSuccess ? (
        <div
          {...getRootProps()}
          className={`upload-dropzone ${isDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
        >
          <input {...getInputProps()} disabled={isUploading} />

          {previewImage ? (
            // Show preview if available
            <div className="upload-preview">
              <img src={previewImage} alt="Upload preview" />
            </div>
          ) : (
            // Show upload icon if no preview
            <div className="upload-icon">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
          )}

          {isDragActive ? (
            <p className="text-lg font-medium">Drop the image here ...</p>
          ) : (
            <div>
              <p className="text-lg font-medium">
                {isUploading
                  ? 'Uploading...'
                  : 'Drag & drop your photo here, or click to select'}
              </p>
              <p
                className="text-sm"
                style={{ color: 'var(--text-color)', opacity: 0.7 }}
              >
                Supported formats: JPG, JPEG, PNG, HEIF (max 10MB)
              </p>
            </div>
          )}

          {isUploading && (
            <div className="upload-progress">
              <div
                className="upload-progress-bar"
                style={{ width: '100%' }}
              ></div>
            </div>
          )}
        </div>
      ) : (
        // Show success UI when upload completes
        <div className="upload-dropzone">
          <div className="upload-preview">
            <img src={previewImage || ''} alt="Uploaded image" />
          </div>
          <div className="upload-success">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>Image uploaded successfully</p>
          </div>
          <button
            className="mt-3 text-sm py-1 px-3 rounded"
            style={{
              backgroundColor: 'var(--secondary-color)',
              color: 'var(--text-color)'
            }}
            onClick={() => {
              setUploadSuccess(false);
              setPreviewImage(null);
            }}
          >
            Upload another
          </button>
        </div>
      )}

      {uploadError && (
        <div className="mt-2 text-red-500 text-sm">{uploadError}</div>
      )}
    </div>
  );
}

export default Uploader;
