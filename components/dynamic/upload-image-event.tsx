import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useUserIp } from '@/context/UserIpContext';
import { useUserCredits } from '@/context/UserCreditsContext';
import CreditLimitNoticeButton from '@/components/static/credit-limit-notice-button';
import MyAssets from '@/components/dynamic/my-assets';

interface UploadImageDynamicButtonProps {
  userId: string;
  userIp: string;
  base64Image: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
  onUploadSuccess?: () => void;
}

export const UploadImageDynamicButton: React.FC<
  UploadImageDynamicButtonProps
> = ({ userId, userIp, base64Image, onUserCreditsUpdate, onUploadSuccess }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string | null>(null);
  const [base64Img, setBase64Img] = useState<string | null>(base64Image);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setBase64Img(base64Image);
    setUploadResponse(null);
  }, [base64Image]);

  const handleUploadImage = async () => {
    setIsSubmitting(true);
    setUploadResponse(null);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/uploadImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({ image: base64Image, userId, userIp })
      });

      if (!response.ok) {
        setIsSubmitting(false);
        if (response.status === 429) {
          setErrorMessage(
            'IMAGE upload limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          setErrorMessage(
            'Upload Failed. Please check the image data and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      const dataResponse = await response.json();
      setIsSubmitting(false);
      setUploadResponse(
        JSON.stringify(dataResponse.url, null, 2).replace(/^"|"$/g, '')
      );

      // Call the onUploadSuccess function if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  if (!userId) {
    return (
      <p>
        Please <a href="/signin">sign in</a> to upload an image.
      </p>
    );
  }

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div>
        {!uploadResponse && (
          <Button
            variant="slim"
            type="submit"
            className="mt-1"
            loading={isSubmitting}
            onClick={handleUploadImage}
          >
            Upload Image
          </Button>
        )}
        {uploadResponse && (
          <>
            <div className={'margin-top-8'}>
              {uploadResponse && (
                <>
                  <div className="margin-top-8">
                    <p>Image Uploaded</p>
                    <div
                      onClick={() => {
                        navigator.clipboard
                          .writeText(uploadResponse)
                          .then(() => {
                            // Create and show notification
                            const notification = document.createElement('div');
                            notification.textContent =
                              'URL copied to clipboard!';
                            notification.style.position = 'fixed';
                            notification.style.bottom = '20px';
                            notification.style.right = '20px';
                            notification.style.padding = '10px 15px';
                            notification.style.backgroundColor = '#4CAF50';
                            notification.style.color = 'white';
                            notification.style.borderRadius = '4px';
                            notification.style.zIndex = '1000';
                            notification.style.boxShadow =
                              '0 2px 5px rgba(0,0,0,0.2)';
                            document.body.appendChild(notification);

                            setTimeout(() => {
                              document.body.removeChild(notification);
                            }, 1500);
                          })
                          .catch((err) => {
                            console.error('Failed to copy URL: ', err);
                          });
                      }}
                      className="underline cursor-pointer text-blue-600"
                      role="button"
                      tabIndex={0}
                      aria-label="Copy URL to clipboard"
                    >
                      {uploadResponse}
                    </div>
                  </div>
                  <div>
                    <MyAssets assetType={'upl'} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
