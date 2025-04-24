import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/Button';
import Downloader from '@/components/dynamic/downloader';
import { useUserCredits } from '@/context/UserCreditsContext';
import CreditLimitNoticeButton from '@/components/static/credit-limit-notice-button';
import ImageGallery from '@/functions/getGallery';
import GenericModal from '@/components/ui/GenericModal/GenericModal';
import '@/styles/main.css';
import getFileNameFromUrl from '@/utils/stringUtils'; // Import the CSS file

interface VideoFromUrlDynamicButtonProps {
  userId: string;
  userIp: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
  urlData?: string;
}

export function VideoFromUrlDynamicButton({
  userId,
  userIp,
  onUserCreditsUpdate,
  urlData
}: VideoFromUrlDynamicButtonProps) {
  const [videoData, setVideoData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [duration, setDuration] = useState<string>('5');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [motion, setMotion] = useState<string>('Static');
  const [loop, setLoop] = useState<string>('false');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (urlData && urlData.length > 0) {
      setImageUrl(urlData);
    }
  }, [urlData]);

  let videoGenButtonLabel: string;
  let videoGenCompleteMessage: string;
  const motionOptions = [
    'Static',
    'Move Left',
    'Move Right',
    'Move Up',
    'Move Down',
    'Push In',
    'Pull Out',
    'Zoom In',
    'Zoom Out',
    'Pan Left',
    'Pan Right',
    'Orbit Left',
    'Orbit Right',
    'Crane Up',
    'Crane Down'
  ];

  videoGenButtonLabel = 'Generate Video from Image URL';
  videoGenCompleteMessage = 'Video Generation Complete';

  useEffect(() => {
    if (loop === 'true' && duration === '10') {
      alert(
        'Looping is not available for 10-second videos. Please choose a 5-second video for looping.'
      );
      setLoop('false');
    }
  }, [loop, duration]);

  // Disable looping option when 10-second duration is selected
  useEffect(() => {
    if (duration === '10' && loop === 'true') {
      setLoop('false');
    }
  }, [duration]);

  useEffect(() => {
    if (videoData && videoData.result === 'InQueue') {
      setMessage('Refresh your assets to see your queued video.');
      const timer = setTimeout(() => {
        setMessage('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [videoData]);

  const handleGenerateVideo = async () => {
    setIsSubmitting(true);
    console.log('Video Generation from URL button clicked');
    console.log(imageUrl);
    setVideoData(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({
          url: imageUrl,
          description: videoDescription,
          duration: duration,
          aspectRatio: aspectRatio,
          motion: motion, // Use the state value for motion
          loop: loop === 'true'
        })
      });
      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        if (response.status === 429) {
          const errorData = await response.json();
          setErrorMessage(
            errorData.error ||
              'IMAGE request limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          setErrorMessage(
            'Request Failed. Please check that the prompt is appropriate and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      let dataResponse: { result?: any; credits?: any; error?: boolean } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        setIsSubmitting(false); // Response is received, enable the button
        console.log('Result:', dataResponse.result);
        console.log('UserCredits:', dataResponse.credits);
        if (dataResponse.error) {
          console.log('ERROR FOUND');
          // Set response
          setErrorMessage(
            dataResponse.result === 'LimitExceeded'
              ? 'Credit limit exceeded. Purchase credits on the PRICING page.'
              : dataResponse.result === 'CreateAccount'
                ? 'Create an account for free credits.'
                : dataResponse.result === ''
                  ? 'Error. Please try again.'
                  : dataResponse.result
          );
          // Sample Image
          setVideoData(
            'https://storage.googleapis.com/gen-image-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3-fake.mp4'
          ); // set the url of the response
        } else {
          console.log('NO ERROR FOUND');
          if (dataResponse.result == 'InQueue') {
            setMessage('Refresh your assets to see your image in queue.');
          }
        }

        setUserCreditsResponse(dataResponse.credits); // set user credits from response
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(dataResponse.credits); // update parent component if callback is provided
        }
        // setModalVideoUrl(dataResponse.result); // Set the image URL for the modal
        setVideoData(dataResponse);
        console.log('dataResponse: ' + JSON.stringify(dataResponse));
        setIsModalOpen(false); // Open the modal
      }
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.error('There was an error with the fetch operation: ', error);
    }
  };

  const handleGalleryClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div className="my-assets-container">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Image URL to Video Generation</h1>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="imageUrl">
            Enter a URL of an image to start creating your video.
          </Label>
          <Input
            as="text"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="min-h-[25px] text-xl"
            placeholder="Enter image URL"
          />
        </div>
        <div className={'pt-4'}>
          <Input
            as="textarea"
            placeholder={'What will happen in the video?'}
            className="min-h-[100px] text-xl"
            onChange={(e) => setVideoDescription(e.target.value)}
          />
        </div>
        {/* VIDEO OPTIONS */}
        <div className="flex-container pt-4">
          <div>
            <Label htmlFor="duration">Duration (in sec): </Label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="min-h-[25px] text-xl gray-text rounded-corners border border-black"
            >
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </div>
          <div>
            <Label htmlFor="aspectRatio">Aspect Ratio: </Label>
            <select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="min-h-[25px] text-xl gray-text rounded-corners border border-black"
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
            </select>
          </div>
          <div>
            <Label htmlFor="motion">Motion: </Label>
            <select
              id="motion"
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              className="min-h-[25px] text-xl gray-text rounded-corners border border-black"
            >
              {motionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="loop">Loop: </Label>
            <select
              id="loop"
              value={loop}
              onChange={(e) => setLoop(e.target.value)}
              className="min-h-[25px] text-xl gray-text rounded-corners border border-black"
              disabled={duration === '10'}
              title={
                duration === '10'
                  ? 'Looping is not available for 10-second videos'
                  : 'Enable or disable video looping'
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            {duration === '10' && (
              <div className="text-xs text-gray-500 mt-1">
                (Disabled for 10-second videos)
              </div>
            )}
          </div>
        </div>
        <div className={'pt-4'}>
          <Button
            variant="slim"
            type="submit"
            className="mt-1"
            loading={isSubmitting}
            onClick={handleGenerateVideo}
            disabled={isSubmitting || message !== ''}
          >
            {videoGenButtonLabel}
          </Button>
        </div>

        {/*Display Status*/}
        {videoData && videoData.result === 'InQueue' ? (
          <>
            <div>
              <h3>{message}</h3>
            </div>
            <div className="pt-4">
              <Button onClick={handleGalleryClick}>
                Check out the gallery while you wait for your video to
                generate...
              </Button>
            </div>
          </>
        ) : (
          ''
        )}

        {videoData && getFileNameFromUrl(videoData) !== '' && (
          <div className={'padding-top-4'}>
            <p>{videoGenCompleteMessage}</p>
            <div>
              <video width="600" controls>
                <source src={videoData} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div>
              {JSON.stringify(videoData)}
              <Downloader fileUrl={videoData} />
            </div>
          </div>
        )}
        {userCreditsResponse !== null && (
          <div className={'padding-top-4'}>
            <p>Remaining Credits: {userCreditsResponse}</p>
          </div>
        )}
      </div>
      <GenericModal isOpen={isModalOpen} onClose={closeModal}>
        <ImageGallery />
      </GenericModal>
    </>
  );
}
