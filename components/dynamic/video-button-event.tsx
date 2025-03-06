import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Downloader from '@/components/dynamic/downloader';
import { useUserCredits } from '@/context/UserCreditsContext';
import CreditLimitNoticeButton from '@/components/static/credit-limit-notice-button';
import GenericModal from '@/components/ui/GenericModal';
import ImageGallery from '@/functions/getGallery';
import getFileNameFromUrl from '@/utils/stringUtils';

interface VideoDynamicButtonProps {
  urlData: string;
  userId: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
}

export function VideoDynamicButton({
  urlData,
  userId,
  onUserCreditsUpdate
}: VideoDynamicButtonProps) {
  const url = urlData;

  const [videoData, setVideoData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [duration, setDuration] = useState<string>('5');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [motion, setMotion] = useState<string>('Static');
  const [loop, setLoop] = useState<string>('false');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string>('');

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

  videoGenButtonLabel = 'Generate Video';
  videoGenCompleteMessage = 'Video Generation Complete';

  useEffect(() => {
    if (loop === 'true') {
      alert('Looping will be enabled.');
    }
  }, [loop]);

  useEffect(() => {
    if (
      videoData &&
      videoData.webhook &&
      videoData.response &&
      videoData.response.status
    ) {
      setMessage('Refresh your assets to see your queued video.');
      const timer = setTimeout(() => {
        setMessage('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [videoData]);

  const handleGenerateVideo = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    console.log('Video Generation button clicked');
    setVideoData(null); // clear the videoData state
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          url: url,
          description: videoDescription,
          duration: duration,
          aspectRatio: aspectRatio,
          motion: motion,
          loop: loop === 'true'
        })
      });
      if (!response.ok) {
        setIsSubmitting(false); // Response is received, enable the button
        if (response.status === 429) {
          const errorData = await response.json();
          setErrorMessage(
            errorData.error ||
              'VIDEO request limit exceeded. Please subscribe on the PRICING page.'
          );
        } else {
          setErrorMessage(
            'Request Failed. Please check that the prompt is appropriate and try again.'
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }
      let data: { result?: any; userCredits?: any } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
        const { result, userCredits } = data;
        setIsSubmitting(false); // Response is received, enable the button
        console.log('Result: ', result);
        console.log('UserCredits: ', userCredits);
        console.log('video-button-event DATA RECEIVED:' + JSON.stringify(data));
        setVideoData(result);
        setUserCreditsResponse(userCredits); // set user credits from response
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(userCredits); // update parent component if callback is provided
        }
      }
    } catch (error) {
      setIsSubmitting(false); // Response is received, enable the button
      console.log(error);
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
    <div className={'margin-top-8'}>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div className={'pt-4'}>
        <Input
          as="text"
          id="imageUrl"
          placeholder={'What will happen in the video?'}
          className="min-h-[25px] text-xl"
          onChange={(e) => setVideoDescription(e.target.value)}
        />
      </div>
      {/* VIDEO OPTIONS */}
      <div className="flex-container pt-4">
        <div>
          <label htmlFor="duration">Duration (in sec): </label>
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
          <label htmlFor="aspectRatio">Aspect Ratio: </label>
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
          <label htmlFor="motion">Motion: </label>
          <select
            id="motion"
            value={motion}
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
          <label htmlFor="loop">Loop: </label>
          <select
            id="loop"
            value={loop}
            onChange={(e) => setLoop(e.target.value)}
            className="min-h-[25px] text-xl gray-text rounded-corners border border-black"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
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
        {isSubmitting && (
          <div className="pt-4">
            <Button onClick={handleGalleryClick}>
              Check out the gallery while you wait for your video to generate...
            </Button>
          </div>
        )}
        {videoData &&
        videoData.webhook &&
        videoData.response &&
        videoData.response.status ? (
          <div>
            <h3>{message}</h3>
          </div>
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
    </div>
  );
}
