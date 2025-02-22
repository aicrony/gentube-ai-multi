'use client';
import React, { useState, useCallback } from 'react';
import { VideoDynamicButton } from '@/components/dynamic/video-button-event';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserCredits } from '@/context/UserCreditsContext';
import { CreditLimitNoticeButton } from '@/components/static/credit-limit-notice-button';
import GenericModal from '@/components/ui/GenericModal';
import ImageGallery from '@/functions/getGallery';
import { VideoFromUrlDynamicButton } from '@/components/dynamic/video-from-url-button-event';

interface ImageDynamicButtonProps {
  userId: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
}

export const ImageDynamicButton: React.FC<ImageDynamicButtonProps> = ({
  userId,
  onUserCreditsUpdate
}) => {
  const [prompt, setPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageData, setImageData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for Modal
  const [imageGalleryData, setImageGalleryData] = useState<any>(null); // State for ImageGallery
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null); // State for Modal Image URL
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const renderVideoButton = useCallback(() => {
    if (!imageData) {
      return null;
    } else {
      let url = '';
      if (imageData && imageData.url) {
        url = imageData.url;
        console.log('URL Data: ' + JSON.stringify(imageData));
        console.log('imageData.url: ' + url);
      } else if (imageData && typeof imageData === 'string') {
        url = imageData;
        console.log('imageData: ' + url);
      }

      return (
        <VideoFromUrlDynamicButton
          urlData={url}
          userId={userId}
          onUserCreditsUpdate={onUserCreditsUpdate}
        />
      );
    }
  }, [imageData]);

  const handleGenerateImage = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    setImageData(null); // clear the imageData state
    setImageGalleryData(null); // Reset ImageGallery data
    setErrorMessage(null); // clear any previous error message
    console.log('PASS userId:', userId);
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ prompt: prompt })
      });

      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        if (response.status === 429) {
          const errorData = await response.json();
          setErrorMessage(
            errorData.error ||
              'IMAGE request limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          setErrorMessage(
            'Request Failed. Please check that the prompt is appropriate and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      let dataResponse: { result?: any; userCredits?: any; images?: any } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        const { result, userCredits, images } = dataResponse;
        setIsSubmitting(false); // Response is received, enable the button
        console.log('Result:', result);
        console.log('UserCredits:', userCredits);
        setImageData(result); // set the url of the response
        setImageGalleryData(images); // Set ImageGallery data
        setUserCreditsResponse(userCredits); // set user credits from response
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(userCredits); // update parent component if callback is provided
        }
        setModalImageUrl(result); // Set the image URL for the modal
        setIsModalOpen(false); // Open the modal
      }
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  const handleGalleryClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(null); // Clear the modal image URL
  };

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div className="float-left">
        <h1 className="text-xl font-bold">Image Generation</h1>
        <Label htmlFor="prompt">Describe an image to start your video.</Label>
        <Input
          as="textarea"
          className="min-h-[100px] text-xl"
          id="prompt"
          placeholder="Enter a description of your image."
          value={prompt}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Button
          variant="slim"
          type="submit"
          className="mt-1"
          loading={isSubmitting}
          onClick={handleGenerateImage}
        >
          Generate Image
        </Button>
        {isSubmitting && (
          <div className="pt-4">
            <Button onClick={handleGalleryClick}>
              Check out the gallery while you wait for your image to generate...
            </Button>
          </div>
        )}
        {userCreditsResponse !== null && (
          <div className={'padding-top-4'}>
            <p>Remaining Credits: {userCreditsResponse}</p>
          </div>
        )}
        {imageData && imageData !== '[object%20Object]' && (
          <div className={'margin-top-8'}>
            <div>
              <a href={imageData} target="_blank">
                Open Image
              </a>
            </div>
            <img src={imageData} alt="Generated Image" />
            {renderVideoButton()}
          </div>
        )}
      </div>
      <GenericModal isOpen={isModalOpen} onClose={closeModal}>
        <ImageGallery />
      </GenericModal>
    </>
  );
};
