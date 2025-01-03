'use client';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Downloader from '@/components/dynamic/downloader';

interface VideoDynamicButtonProps {
  urlData: string;
  productName: string;
  subscriptionStatus: string;
  userId: string;
}

export function VideoDynamicButton({
  urlData,
  productName,
  subscriptionStatus,
  userId
}: VideoDynamicButtonProps) {
  const url = urlData;

  const [videoData, setVideoData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  let videoGenButtonLabel: string;
  let videoGenCompleteMessage: string;

  // console.log('Product Name (video button): ' + productName);
  if (productName === '"HQ Video Creator"') {
    videoGenButtonLabel = 'Generate HQ Video';
    videoGenCompleteMessage = 'HQ Video Generation Complete';
  } else {
    videoGenButtonLabel = 'Generate Video';
    videoGenCompleteMessage = 'Video Generation Complete';
  }

  const handleGenerateVideo = async () => {
    // console.log('Product Name (video button): ' + productName);
    // console.log('Subscription Status (video button): ' + subscriptionStatus);

    setIsSubmitting(true); // Disable the button while the request is being handled
    console.log('Video Generation button clicked');
    setVideoData(null); // clear the videoData state
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-product-name': productName,
          'x-subscription-status': subscriptionStatus,
          'x-user-id': userId
        },
        body: JSON.stringify({
          url: url,
          description: videoDescription
        })
      });
      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        if (response.status === 429) {
          setErrorMessage(
            'Daily VIDEO request limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          setErrorMessage(
            'Request Failed. Please check that the prompt is appropriate and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      let data = {};
      if (response.headers) {
        setIsSubmitting(false); // Response is received, enable the button
        data = await response.text();
      }
      console.log('FrontEnd Video ID Received');
      console.log('DATA RECEIVED:' + data);
      setVideoData(data); // set the state with the received data
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.log(error);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <div className={'margin-top-8'}>
      {errorMessage && (
        <div className="error-message-large">{errorMessage}</div>
      )}
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
      </div>
    </div>
  );
}
