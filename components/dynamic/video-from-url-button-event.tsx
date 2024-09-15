'use client';
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/Button';

export function VideoFromUrlDynamicButton() {
  const [videoData, setVideoData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleGenerateVideo = async () => {
    console.log('Video Generation from URL button clicked');
    console.log(imageUrl);
    setVideoData(null); // clear the videoData state
    try {
      const response = await fetch(
        '/api/video?url=' + encodeURIComponent(imageUrl)
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data = {};
      if (response.headers) {
        data = await response.text();
      }
      console.log('FrontEnd Video ID Received');
      console.log('DATA RECEIVED:' + data);
      setVideoData(data); // set the state with the received data
    } catch (error) {
      console.log(error);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <div className={'pt-5'}>
      <div className="grid gap-2">
        <Label htmlFor="imageUrl">
          Enter a URL of an image to start your video.
        </Label>
        <Input
          as="textarea"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="min-h-[25px]"
          placeholder="Enter image URL"
        />
      </div>
      <div className={'pt-4'}>
        <Button className={'margin-right-4'} onClick={handleGenerateVideo}>
          Generate Video from Image URL
        </Button>
      </div>
      {videoData && (
        <div className={'padding-top-4'}>
          <p>Video Generation Complete</p>
          <a href={videoData} target={'_blank'} className={'textUnderline'}>
            {videoData}
          </a>
        </div>
      )}
    </div>
  );
}
