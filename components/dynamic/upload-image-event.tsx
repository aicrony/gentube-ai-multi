import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { useUserIp } from '@/context/UserIpContext';
import { useUserCredits } from '@/context/UserCreditsContext';
import CreditLimitNoticeButton from '@/components/static/credit-limit-notice-button';
import MyAssets from '@/components/dynamic/my-assets';

interface UploadImageDynamicButtonProps {
  userId: string;
  base64Image: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
  onUploadSuccess?: () => void;
}

export const UploadImageDynamicButton: React.FC<
  UploadImageDynamicButtonProps
> = ({ userId, base64Image, onUserCreditsUpdate, onUploadSuccess }) => {
  const { userIp } = useUserIp();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              <p>Image Uploaded</p>
              <a
                href={uploadResponse}
                target={'_blank'}
                className={'textUnderline'}
              >
                {uploadResponse}
              </a>
            </div>
            <div>
              <MyAssets assetType={'upl'} />
            </div>
          </>
        )}
      </div>
    </>
  );
};
