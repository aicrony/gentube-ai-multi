'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserCredits } from '@/context/UserCreditsContext';
import { CreditLimitNoticeButton } from '@/components/static/credit-limit-notice-button';
import GenericModal from '@/components/ui/GenericModal';
import ImageGallery from '@/functions/getGallery';
import { VideoDynamicButton } from '@/components/dynamic/video-button-event';
import {
  PromptInputWithStyles,
  getFormattedPrompt
} from '@/components/dynamic/prompt-input-with-styles';
import { handleApiError } from '@/utils/apiErrorHandler';

interface SocialMediaImageButtonProps {
  userId: string;
  userIp: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
  selectedStyles: string[];
  selectedEffects: string[];
  styleItems: { id: string; name: string; desc: string }[];
  effectItems: { id: string; name: string; desc: string }[];
  emotionItems?: { id: string; name: string; desc: string }[];
  onInputFocus?: () => void;
  selectedEmotions?: string[];
}

export const SocialMediaImageButton: React.FC<SocialMediaImageButtonProps> = ({
  userId,
  userIp,
  onUserCreditsUpdate,
  selectedStyles,
  selectedEffects,
  styleItems,
  effectItems,
  emotionItems = [],
  onInputFocus,
  selectedEmotions = []
}) => {
  const [basePrompt, setBasePrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [imageData, setImageData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageGalleryData, setImageGalleryData] = useState<any>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBasePrompt(event.target.value);
  };

  const renderVideoButton = useCallback(() => {
    if (!imageData) {
      return null;
    } else {
      let url = '';
      if (imageData && imageData.url) {
        url = imageData.url;
      } else if (imageData && typeof imageData === 'string') {
        url = imageData;
      }

      return (
        <VideoDynamicButton
          urlData={url}
          userId={userId}
          onUserCreditsUpdate={onUserCreditsUpdate}
        />
      );
    }
  }, [imageData, userId, onUserCreditsUpdate]);

  const handleGenerateImage = async () => {
    if (onInputFocus) {
      onInputFocus();
    }

    const finalPrompt = getFormattedPrompt(
      basePrompt,
      selectedStyles,
      selectedEffects,
      styleItems,
      effectItems,
      'Style: ',
      'Effect: ',
      selectedEmotions,
      emotionItems,
      'Emotion: '
    );

    if (!finalPrompt.trim()) {
      setErrorMessage(
        'Please enter a description or select styles/effects/emotions'
      );
      return;
    }

    setIsSubmitting(true);
    setImageData(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({ prompt: finalPrompt })
      });

      setIsSubmitting(false);

      // Use centralized error handler
      if (await handleApiError(response, { setErrorMessage })) {
        return; // Error was handled, exit the function
      }

      let dataResponse: { result?: any; credits?: any; error?: boolean } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        setIsSubmitting(false);

        if (dataResponse.error) {
          setErrorMessage(
            dataResponse.result === 'LimitExceeded'
              ? 'Credit limit exceeded. Purchase credits on the PRICING page.'
              : dataResponse.result === 'CreateAccount'
                ? 'Create an account for free credits.'
                : dataResponse.result === 'No image data was generated'
                  ? 'An error occurred while generating the image. Please try a different prompt.'
                  : dataResponse.result === ''
                    ? 'Error. Please try again.'
                    : dataResponse.result
          );
          setImageData(
            'https://storage.googleapis.com/gentube-upload-image-storage/79575369-69b3-489c-bbaf-e315bd7a8002.png'
          );
        } else if (!dataResponse.error) {
          if (dataResponse.result == 'InQueue') {
            setMessage('Click the Refresh Assets button to see your image');

            // Auto-clear the message after 30 seconds
            setTimeout(() => {
              setMessage('');
            }, 30000);
          }
        }

        setUserCreditsResponse(dataResponse.credits);
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(dataResponse.credits);
        }
        setModalImageUrl(dataResponse.result);
        setIsModalOpen(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('There was an error with the fetch operation:', error);
    }
  };

  const handleGalleryClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(null);
  };

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div className="social-media-container">
        <PromptInputWithStyles
          promptValue={basePrompt}
          onPromptChange={handleInputChange}
          selectedStyles={selectedStyles}
          selectedEffects={selectedEffects}
          selectedEmotions={selectedEmotions}
          styleItems={styleItems}
          effectItems={effectItems}
          emotionItems={emotionItems}
          stylePrefix="Style: "
          effectPrefix="Effect: "
          emotionPrefix="Emotion: "
          onFocus={onInputFocus}
        />

        <Button
          variant="slim"
          type="submit"
          className="mt-3"
          loading={isSubmitting}
          onClick={handleGenerateImage}
        >
          Generate Social Media Image
        </Button>
      </div>

      <div className="my-assets-container">
        {message && (
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-md shadow-sm flex justify-between items-center">
            <div className="flex items-center">
              <span className="mr-2">🔄</span>
              <h3 className="font-medium text-blue-800 dark:text-blue-200">
                {message}
              </h3>
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {imageData && imageData.code === 'ERR_NON_2XX_3XX_RESPONSE' && (
          <div className="margin-top-8">
            <div>
              <h3>Error. Please try again by refining your prompt.</h3>
            </div>
          </div>
        )}
      </div>

      <GenericModal isOpen={isModalOpen} onClose={closeModal}>
        <ImageGallery />
      </GenericModal>
    </>
  );
};
