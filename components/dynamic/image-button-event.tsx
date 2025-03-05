'use client';
import React, { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserCredits } from '@/context/UserCreditsContext';
import { CreditLimitNoticeButton } from '@/components/static/credit-limit-notice-button';
import GenericModal from '@/components/ui/GenericModal';
import ImageGallery from '@/functions/getGallery';
import { VideoDynamicButton } from '@/components/dynamic/video-button-event';

interface ImageDynamicButtonProps {
  userId: string;
  userIp: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
}

export const ImageDynamicButton: React.FC<ImageDynamicButtonProps> = ({
  userId,
  userIp,
  onUserCreditsUpdate
}) => {
  const [prompt, setPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
        <VideoDynamicButton
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
    setErrorMessage(null); // clear any previous error message
    console.log('PASS userId:', userId);
    console.log('PASS userIp:', userIp);
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-forwarded-for': userIp
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
      let dataResponse: { result?: any; credits?: any; error?: boolean } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        setIsSubmitting(false); // Response is received, enable the button
        console.log('Result:', dataResponse.result);
        console.log('UserCredits:', dataResponse.credits);
        if (dataResponse.error) {
          // Set response
          setErrorMessage(
            dataResponse.result === 'LimitExceeded'
              ? 'Credit limit exceeded. Purchase credits on the PRICING page.'
              : dataResponse.result === 'CreateAccount'
                ? 'Create an account for free credits.'
                : dataResponse.result === ''
                  ? 'Error. Please try again.'
                  : dataResponse.result
          );
          // Sample Image
          setImageData(
            'https://storage.googleapis.com/gen-image-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3.png'
          ); // set the url of the response
        } else if (!dataResponse.error) {
          if (dataResponse.result == 'InQueue') {
            setMessage('Refresh your assets to see your image in queue.');
          }
        }

        setUserCreditsResponse(dataResponse.credits); // set user credits from response
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(dataResponse.credits); // update parent component if callback is provided
        }
        setModalImageUrl(dataResponse.result); // Set the image URL for the modal
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
      <div className="my-assets-container">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Image Generation</h1>
        </div>
        <Label htmlFor="prompt">Describe an image to start your video.</Label>
        <Input
          as="textarea"
          className="min-h-[100px] text-xl"
          id="prompt"
          placeholder="Enter a description of your image."
          value={prompt}
          onChange={handleInputChange}
        />
        <Button
          variant="slim"
          type="submit"
          className="mt-3"
          loading={isSubmitting}
          onClick={handleGenerateImage}
        >
          Generate Image
        </Button>
      </div>
      <div>
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
        {userCreditsResponse !== null && (
          <div className={'padding-top-4'}>
            <h3>{message}</h3>
          </div>
        )}
        {imageData &&
          imageData !== '[object%20Object]' &&
          imageData.code !== 'ERR_NON_2XX_3XX_RESPONSE' && (
            <div className={'margin-top-8'}>
              <div>
                <a href={imageData} target="_blank">
                  Open Image <br /> {JSON.stringify(imageData.code)}
                </a>
              </div>
              <img src={imageData} alt="Generated Image" />
              {renderVideoButton()}
            </div>
          )}
        {imageData && imageData.code === 'ERR_NON_2XX_3XX_RESPONSE' && (
          <div className={'margin-top-8'}>
            <div>
              <h3>Error. Please try again by refining your prompt.</h3>
            </div>
          </div>
        )}
      </div>
      <GenericModal isOpen={isModalOpen} onClose={closeModal}>
        <ImageGallery />
      </GenericModal>
    </>
  );
};
