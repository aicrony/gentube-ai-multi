'use client';
import React from 'react';
import Button from '@/components/ui/Button';
export function VideoDynamicButton(urlData: any) {
  const [videoData, setVideoData] = React.useState<any>(null);

  const handleGenerateVideo = async () => {
    console.log('Video Generation button clicked');
    console.log(urlData.url);
    setVideoData(null); // clear the videoData state
    try {
      const response = await fetch(
        '/api/video?url=' + encodeURIComponent(urlData.url)
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data = {};
      if (response.headers) {
        data = await response.text();
      }
      // console.log("FrontEnd Video ID Received:");
      console.log('VIDEO URL RECEIVED:' + data);
      setVideoData(data); // set the state with the received data
    } catch (error) {
      console.log(error);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  return (
    <div className={'margin-top-8'}>
      <Button className={'margin-right-4'} onClick={handleGenerateVideo}>
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
