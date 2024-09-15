'use client';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
export function VideoDynamicButton(urlData: any) {
  const [videoData, setVideoData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateVideo = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    console.log('Video Generation button clicked');
    console.log(urlData.url);
    setVideoData(null); // clear the videoData state
    try {
      const response = await fetch(
        '/api/video?url=' + encodeURIComponent(urlData.url)
      );
      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data = {};
      if (response.headers) {
        data = await response.text();
        setIsSubmitting(false); // Response is received, enable the button
      }
      // console.log("FrontEnd Video ID Received:");
      console.log('VIDEO URL RECEIVED:' + data);
      setVideoData(data); // set the state with the received data
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.log(error);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <div className={'margin-top-8'}>
      <Button
        variant="slim"
        type="submit"
        className="mt-1"
        loading={isSubmitting}
        onClick={handleGenerateVideo}
      >
        Generate Video
      </Button>
      {videoData && (
        <div className={'margin-top-8'}>
          <p>Video Generation Complete</p>
          <a href={videoData} target={'_blank'} className={'textUnderline'}>
            {videoData}
          </a>
        </div>
      )}
    </div>
  );
}
