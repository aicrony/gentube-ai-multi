import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Downloader from '@/components/dynamic/downloader';
import { useUserCredits } from '@/context/UserCreditsContext';
import CreditLimitNoticeButton from '@/components/static/credit-limit-notice-button';

interface UploadImageDynamicButtonProps {
  userId: string;
  base64Image: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
}

export const UploadImageDynamicButton: React.FC<
  UploadImageDynamicButtonProps
> = ({ userId, base64Image, onUserCreditsUpdate }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [videoDescription, setVideoDescription] = useState<string>('');
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();

  let videoGenButtonLabel: string;
  let videoGenCompleteMessage: string;

  videoGenButtonLabel = 'Generate Video';
  videoGenCompleteMessage = 'Video Generation Complete';

  const handleUploadImage = async () => {
    setIsSubmitting(true);
    setUploadResponse(null);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/uploadImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ image: base64Image })
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
    } catch (error) {
      setIsSubmitting(false);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div>
        <Button
          variant="slim"
          type="submit"
          className="mt-1"
          loading={isSubmitting}
          onClick={handleUploadImage}
        >
          Upload Image
        </Button>
        {uploadResponse && (
          <div className={'margin-top-8'}>
            <p>Image Uploaded</p>
            <p>View Image</p>
            <a
              href={uploadResponse}
              target={'_blank'}
              className={'textUnderline'}
            >
              {uploadResponse}
            </a>
          </div>
        )}
      </div>
    </>
  );
};
