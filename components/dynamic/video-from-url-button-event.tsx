import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/Button';
import Downloader from '@/components/dynamic/downloader';
import { useUserCredits } from '@/context/UserCreditsContext';
import CreditLimitNoticeButton from '@/components/static/credit-limit-notice-button';
import ImageGallery from '@/functions/getGallery';
import GenericModal from '@/components/ui/GenericModal/GenericModal';

interface VideoFromUrlDynamicButtonProps {
  userId: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
}

export function VideoFromUrlDynamicButton({
  userId,
  onUserCreditsUpdate
}: VideoFromUrlDynamicButtonProps) {
  const [videoData, setVideoData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();

  let videoGenButtonLabel: string;
  let videoGenCompleteMessage: string;

  videoGenButtonLabel = 'Generate Video from Image URL';
  videoGenCompleteMessage = 'Video Generation Complete';

  const handleGenerateVideo = async () => {
    setIsSubmitting(true);
    console.log('Video Generation from URL button clicked');
    console.log(imageUrl);
    setVideoData(null);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          url: imageUrl,
          description: videoDescription
        })
      });
      if (!response.ok) {
        setIsSubmitting(false);
        if (response.status === 429) {
          const errorData = await response.json();
          setErrorMessage(
            errorData.error ||
              'VIDEO request limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          setErrorMessage(
            'Request Failed. Please check the image URL and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      let data: { result?: any; userCredits?: any } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
        const { result, userCredits } = data;
        setIsSubmitting(false);
        console.log('Result: ', result);
        console.log('UserCredits: ', userCredits);
        console.log(
          'video-from-url-button-event DATA RECEIVED:' + JSON.stringify(data)
        );
        setVideoData(result);
        setUserCreditsResponse(userCredits);
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(userCredits);
        }
      }
    } catch (error) {
      setIsSubmitting(false);
      console.log(error);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  const handleGalleryClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <h1 className="text-xl font-bold">Image URL to Video Generation</h1>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div className={'pt-5'}>
        <div className="grid gap-2">
          <Label htmlFor="imageUrl">
            Enter a URL of an image to start creating your video.
          </Label>
          <Input
            as="textarea"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="min-h-[25px] text-xl"
            placeholder="Enter image URL"
          />
        </div>
        <div className={'pt-4'}>
          <Input
            type="text"
            placeholder={'What will happen in the video?'}
            className="min-h-[25px] text-xl"
            onChange={(e) => setVideoDescription(e.target.value)}
          />
        </div>
        <div className={'pt-4'}>
          <Button
            variant="slim"
            type="submit"
            className="mt-1"
            loading={isSubmitting}
            onClick={handleGenerateVideo}
          >
            {videoGenButtonLabel}
          </Button>
        </div>
        {isSubmitting && (
          <div className="pt-4">
            <Button onClick={handleGalleryClick}>
              Check out the gallery while you wait for your video to generate...
            </Button>
          </div>
        )}
        {videoData && (
          <div className={'padding-top-4'}>
            <p>{videoGenCompleteMessage}</p>
            <div>
              <video width="600" controls>
                <source src={videoData} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div>
              <Downloader fileUrl={videoData} />
            </div>
          </div>
        )}
        {userCreditsResponse !== null && (
          <div className={'padding-top-4'}>
            <p>Remaining Credits: {userCreditsResponse}</p>
          </div>
        )}
      </div>
      <GenericModal isOpen={isModalOpen} onClose={closeModal}>
        <ImageGallery />
      </GenericModal>
    </>
  );
}
