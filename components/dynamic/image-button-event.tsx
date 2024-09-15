'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { VideoDynamicButton } from '@/components/dynamic/video-button-event';
import Button from '@/components/ui/Button';
import { handleRequest } from '@/utils/auth-helpers/client';
import { signInWithPassword } from '@/utils/auth-helpers/server';
import { useRouter } from 'next/navigation';

export function ImageDynamicButton({ prompt }: { prompt: string }) {
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
    console.log('Generate Image button clicked');
    setImageData(null); // clear the imageData state
    try {
      const response = await fetch(
        '/api/image?prompt=' + encodeURIComponent(prompt)
      );
      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let dataResponse = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        setIsSubmitting(false); // Response is received, enable the button
      }
      console.log('FrontEnd Received');
      console.log(dataResponse);
      // console.log(JSON.stringify(dataResponse.data[0].revised_prompt));
      // console.log(JSON.stringify(dataResponse.data[0].url));
      // @ts-ignore
      setImageData(dataResponse); // set the url of the response
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <div className="float-left">
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
  );
}
