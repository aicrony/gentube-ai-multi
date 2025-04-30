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
  onInputFocus?: () => void; // New prop for input focus
}

export const SocialMediaImageButton: React.FC<SocialMediaImageButtonProps> = ({
  userId,
  userIp,
  onUserCreditsUpdate,
  selectedStyles,
  selectedEffects,
  styleItems,
  effectItems,
  onInputFocus
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

  // Build the full prompt from base prompt, styles, and effects
  const getFullPrompt = useCallback(() => {
    // Process the base prompt to handle punctuation correctly
    let processedBasePrompt = basePrompt.trim();

    // Add selected styles
    const styleTexts: string[] = [];
    selectedStyles.forEach((styleId) => {
      const style = styleItems.find((s) => s.id === styleId);
      if (style) styleTexts.push(style.desc);
    });

    // Add selected effects
    const effectTexts: string[] = [];
    selectedEffects.forEach((effectId) => {
      const effect = effectItems.find((e) => e.id === effectId);
      if (effect) effectTexts.push(effect.desc);
    });

    // Combine all styles and effects
    const stylesAndEffects = [...styleTexts, ...effectTexts].join(', ');

    // No styles or effects selected, just return the base prompt
    if (!stylesAndEffects) {
      return processedBasePrompt;
    }

    // Handle empty base prompt case
    if (!processedBasePrompt) {
      return stylesAndEffects;
    }

    // Check the ending punctuation of the base prompt
    const endsWithPunctuation = /[.!?;]$/.test(processedBasePrompt);
    const endsWithComma = /,$/.test(processedBasePrompt);

    // Combine based on the punctuation
    let fullPrompt;
    if (endsWithPunctuation) {
      // If ends with sentence-ending punctuation, start a new sentence for styles
      fullPrompt = `${processedBasePrompt} ${stylesAndEffects}`;
    } else if (endsWithComma) {
      // If already ends with a comma, just add the styles without comma
      fullPrompt = `${processedBasePrompt} ${stylesAndEffects}`;
    } else {
      // No ending punctuation, add with a comma
      fullPrompt = `${processedBasePrompt}, ${stylesAndEffects}`;
    }

    // Log for debugging
    console.log('Social media prompt construction:', {
      basePrompt: processedBasePrompt,
      endsWithPunctuation: /[.!?;]$/.test(processedBasePrompt),
      endsWithComma: /,$/.test(processedBasePrompt),
      stylesAndEffects,
      fullPrompt
    });

    return fullPrompt;
  }, [basePrompt, selectedStyles, selectedEffects, styleItems, effectItems]);

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
    const finalPrompt = getFormattedPrompt(
      basePrompt,
      selectedStyles,
      selectedEffects,
      styleItems,
      effectItems,
      'Style: ',
      'Effect: '
    );

    if (!finalPrompt.trim()) {
      setErrorMessage('Please enter a description or select styles/effects');
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
              'Refresh your assets below in Step 3 to see your image in queue.'
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
          styleItems={styleItems}
          effectItems={effectItems}
          stylePrefix="Style: "
          effectPrefix="Effect: "
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
        {/*{userCreditsResponse !== null && (*/}
        {/*  <>*/}
        {/*    <div className="pt-4">*/}
        {/*      <Button onClick={handleGalleryClick}>*/}
        {/*        Check out the gallery while you wait for your image to generate...*/}
        {/*      </Button>*/}
        {/*    </div>*/}
        {/*  </>*/}
        {/*)}*/}

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
