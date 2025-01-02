import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Downloader from '@/components/dynamic/downloader';

interface UploadImageDynamicButtonProps {
  productName: string;
  subscriptionStatus: string;
  userId: string;
  base64Image: string;
}

export const UploadImageDynamicButton: React.FC<
  UploadImageDynamicButtonProps
> = ({ productName, subscriptionStatus, userId, base64Image }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [videoDescription, setVideoDescription] = useState<string>('');

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

  const handleUploadImage = async () => {
    setIsSubmitting(true);
    setUploadResponse(null);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/uploadImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-product-name': productName,
          'x-subscription-status': subscriptionStatus,
          'x-user-id': userId
        },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) {
        setIsSubmitting(false);
        if (response.status === 429) {
          setErrorMessage(
            'Daily IMAGE upload limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          setErrorMessage(
            'Upload Failed. Please check the image data and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      const dataResponse = await response.json();
      setIsSubmitting(false);
      setUploadResponse(
        JSON.stringify(dataResponse.url, null, 2).replace(/^"|"$/g, '')
      );
    } catch (error) {
      setIsSubmitting(false);
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  const handleGenerateVideo = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    console.log('Video Generation from Uploaded Image button clicked');
    console.log(uploadResponse);
    setVideoData(null); // clear the videoData state
    setErrorMessage(null); // clear any previous error message
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
          url: uploadResponse,
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
            'Request Failed. Please check the uploaded image and try again.'
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
      <div>
        <Button
          variant="slim"
          type="submit"
          className="mt-1"
          loading={isSubmitting}
          onClick={handleUploadImage}
        >
          Upload Image
        </Button>
        {uploadResponse && (
          <div className={'margin-top-8'}>
            <p>Image Uploaded</p>
            <p>View Image</p>
            <a
              href={uploadResponse}
              target={'_blank'}
              className={'textUnderline'}
            >
              {uploadResponse}
            </a>
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
            </div>
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
        )}
      </div>
    </>
  );
};
