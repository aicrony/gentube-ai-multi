'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { VideoDynamicButton } from '@/components/dynamic/video-button-event';
import Button from '@/components/ui/Button';

export function ImageDynamicButton({ prompt }: { prompt: string }) {
  const [imageData, setImageData] = React.useState<any>(null);

  const renderVideoButton = useCallback(() => {
    if (!imageData) {
      return null;
    } else {
      return <VideoDynamicButton url={imageData} />;
    }
  }, [imageData]);

  const handleGenerateImage = async () => {
    console.log('Generate Image button clicked');
    setImageData(null); // clear the imageData state
    try {
      const response = await fetch(
        '/api/image?prompt=' + encodeURIComponent(prompt)
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let dataResponse = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
      }
      console.log('FrontEnd Received');
      console.log(dataResponse);
      // console.log(JSON.stringify(dataResponse.data[0].revised_prompt));
      // console.log(JSON.stringify(dataResponse.data[0].url));
      // @ts-ignore
      setImageData(dataResponse); // set the url of the response
    } catch (error) {
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <div className="float-left">
      <Button variant="slim" onClick={handleGenerateImage}>
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
