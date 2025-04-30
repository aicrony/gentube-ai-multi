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
      setErrorMessage('Please enter a description or select styles/effects/emotions');
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

      if (!response.ok) {
        setIsSubmitting(false);
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
        setIsSubmitting(false);

        if (dataResponse.error) {
          setErrorMessage(
            dataResponse.result === 'LimitExceeded'
              ? 'Credit limit exceeded. Purchase credits on the PRICING page.'
              : dataResponse.result === 'CreateAccount'
                ? 'Create an account for free credits.'
                : dataResponse.result === ''
                  ? 'Error. Please try again.'
                  : dataResponse.result
          );
          setImageData(
            'https://storage.googleapis.com/gen-image-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3.png'
          );
        } else if (!dataResponse.error) {
          if (dataResponse.result == 'InQueue') {
            setMessage(
              'Your image is being generated. The assets list below will refresh automatically.'
            );
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
          <div className="mt-3">
            <div className="text-green-600 font-semibold mb-3">{message}</div>
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
