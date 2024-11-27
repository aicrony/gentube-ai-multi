'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { VideoDynamicButton } from '@/components/dynamic/video-button-event';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function ImageDynamicButton() {
  const [prompt, setPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };
  const [imageData, setImageData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderVideoButton = useCallback(() => {
    if (!imageData) {
      return null;
    } else {
      return <VideoDynamicButton url={imageData} />;
    }
  }, [imageData]);

  const handleGenerateImage = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    setImageData(null); // clear the imageData state
    setErrorMessage(null); // clear any previous error message
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt })
      });

      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        if (response.status === 429) {
          setErrorMessage(
            'Daily IMAGE request limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      let dataResponse = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        setIsSubmitting(false); // Response is received, enable the button
      }
      setImageData(dataResponse); // set the url of the response
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <>
      {errorMessage && (
        <div className="error-message-large">{errorMessage}</div>
      )}
      <div className="float-left">
        <Label htmlFor="prompt">
          Describe and generate an image. Then optionally create a video.
        </Label>
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
}
