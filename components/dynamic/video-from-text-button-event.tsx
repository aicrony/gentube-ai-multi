'use client';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Downloader from '@/components/dynamic/downloader';
import { useUserCredits } from '@/context/UserCreditsContext';
import CreditLimitNoticeButton from '@/components/static/credit-limit-notice-button';
import ImageGallery from '@/functions/getGallery';
import GenericModal from '@/components/ui/GenericModal/GenericModal';

interface VideoFromTextDynamicButtonProps {
  userId: string;
  userIp: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
}

export const VideoFromTextDynamicButton: React.FC<
  VideoFromTextDynamicButtonProps
> = ({ userId, userIp, onUserCreditsUpdate }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [imageGalleryData, setImageGalleryData] = useState<any>(null); // State for ImageGallery
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for Modal
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();

  const handleGenerateVideo = async () => {
    setIsSubmitting(true);
    setVideoData(null);
    setImageGalleryData(null); // Reset ImageGallery data
    setErrorMessage(null);
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({
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
            'Request Failed. Please check the description and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      let data: { result?: any; userCredits?: any; images?: any } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
        const { result, userCredits, images } = data;
        setIsSubmitting(false);
        setVideoData(result);
        setImageGalleryData(images); // Set ImageGallery data
        setUserCreditsResponse(userCredits); // set user credits from response
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(userCredits); // update parent component if callback is provided
        }
      }
    } catch (error) {
      setIsSubmitting(false);
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
      <h1 className="text-xl font-bold">Text to Video Generation</h1>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div>
        <Input
          type="text"
          placeholder={'What will happen in the video?'}
          className="min-h-[25px] text-xl"
          onChange={(e) => setVideoDescription(e.target.value)}
        />
        <Button
          variant="slim"
          type="submit"
          className="mt-1"
          loading={isSubmitting}
          onClick={handleGenerateVideo}
        >
          Generate Video
        </Button>
        {isSubmitting && (
          <div className="pt-4">
            <Button onClick={handleGalleryClick}>
              Check out the gallery while you wait for your video to generate...
            </Button>
          </div>
        )}
        {videoData && (
          <div className={'padding-top-4'}>
            <p>Video Generation Complete</p>
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
};
