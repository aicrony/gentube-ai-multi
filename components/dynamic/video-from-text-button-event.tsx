'use client';
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/Button';
import Downloader from '@/components/dynamic/downloader';

export function VideoFromTextDynamicButton() {
  const [videoData, setVideoData] = useState<any>(null);
  // const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDescription, setVideoDescription] = useState<string>('');

  const handleGenerateVideo = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    console.log('Video Generation from TEXT button clicked');
    setVideoData(null); // clear the videoData state
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: videoDescription })
      });
      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        throw new Error(`HTTP error! status: ${response.status}`);
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
    <div className={'pt-5'}>
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
          Generate Video from Text
        </Button>
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
  );
}
