'use client';
import React, { useState, useCallback } from 'react';
import { VideoDynamicButton } from '@/components/dynamic/video-button-event';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserCredits } from '@/context/UserCreditsContext';
import { CreditLimitNoticeButton } from '@/components/static/credit-limit-notice-button';

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
      let dataResponse: { result?: any; userCredits?: any } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        const { result, userCredits } = dataResponse;
        setIsSubmitting(false); // Response is received, enable the button
        console.log('Result:', result);
        console.log('UserCredits:', userCredits);
        setImageData(result); // set the url of the response
        setUserCreditsResponse(userCredits); // set user credits from response
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(userCredits); // update parent component if callback is provided
        }
      }
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div className="float-left">
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
        {userCreditsResponse !== null && (
          <div className={'padding-top-4'}>
            <p>Remaining Credits: {userCreditsResponse}</p>
          </div>
        )}
        {imageData && (
          <div className={'margin-top-8'}>
            <p>View Image</p>
            <a href={imageData} target={'_blank'} className={'textUnderline'}>
              {imageData}
            </a>
            {renderVideoButton()}
          </div>
        )}
      </div>
    </>
  );
};
