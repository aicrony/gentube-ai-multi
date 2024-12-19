'use client';
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/Button';
import Downloader from '@/components/dynamic/downloader';

interface VideoFromTextDynamicButtonProps {
  productName: string;
  subscriptionStatus: string;
}

export const VideoFromTextDynamicButton: React.FC<
  VideoFromTextDynamicButtonProps
> = ({ productName, subscriptionStatus }) => {
  const [videoData, setVideoData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  let hqLink: boolean = false;

  // console.log('Product Name (video button): ' + productName);
  // console.log('Subscription Status (video button): ' + subscriptionStatus);

  if (
    subscriptionStatus === '"active"' &&
    productName === '"HQ Video Creator"'
  ) {
    hqLink = true;
  }

  const handleGenerateVideo = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    console.log('Video Generation from TEXT button clicked');
    setVideoData(null); // clear the videoData state
    setErrorMessage(null); // clear any previous error message
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-product-name': productName,
          'x-subscription-status': subscriptionStatus
        },
        body: JSON.stringify({
          url: 'none',
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
            'Request Failed. Please check the prompt and try again.'
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
    <>
      {errorMessage && (
        <div className="error-message-large">{errorMessage}</div>
      )}
      <div className={'pt-5'}>
        <div className={'pt-4'}>
          <Label>Describe the video you want to create.</Label>
          <Input
            type="text"
            placeholder={'What will happen in the video?'}
            className="min-h-[25px] text-xl"
            onChange={(e) => setVideoDescription(e.target.value)}
          />
        </div>
        <div className="flex space-x-4 pt-4">
          <div>
            <Button
              variant="slim"
              type="submit"
              className="mt-1"
              loading={isSubmitting}
              onClick={handleGenerateVideo}
            >
              Generate Video from Text
            </Button>
          </div>
          {hqLink && (
            <div className="pt-2">
              <p>
                Note:{' '}
                <a href="/image-url-to-video">
                  High Quality video must be created from an existing image.
                </a>
              </p>
            </div>
          )}
        </div>
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
      </div>
    </>
  );
};
