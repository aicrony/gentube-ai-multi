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
import MyAssets from '@/components/dynamic/my-assets';

interface SocialMediaImageButtonProps {
  userId: string;
  userIp: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
  selectedStyles: string[];
  selectedEffects: string[];
  styleItems: { id: string; name: string; desc: string }[];
  effectItems: { id: string; name: string; desc: string }[];
  onInputFocus?: () => void;
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
  const [showMyAssets, setShowMyAssets] = useState(false);
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
    console.log('Prompt construction:', {
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
    if (onInputFocus) {
      onInputFocus();
    }

    const finalPrompt = getFullPrompt();
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
              'Your image is being generated. The assets list below will refresh automatically.'
            );

            // Show the MyAssets component with auto refresh enabled
            setShowMyAssets(true);

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
        <div className="mb-4">
          <Label htmlFor="prompt" className="text-base font-medium mb-2 block">
            Describe your image
          </Label>
          <Input
            as="text"
            className="min-h-[50px] text-xl mb-2"
            id="prompt"
            placeholder="Enter a description of your image"
            value={basePrompt}
            onChange={handleInputChange}
          />
          <div className="text-sm text-gray-500 mt-1">
            {selectedStyles.length > 0 || selectedEffects.length > 0 ? (
              <div>
                <p>Your image will include:</p>
                <ul className="list-disc ml-5 mt-1">
                  {selectedStyles.length > 0 && (
                    <li>
                      Styles:{' '}
                      {selectedStyles
                        .map((id) => styleItems.find((s) => s.id === id)?.name)
                        .join(', ')}
                    </li>
                  )}
                  {selectedEffects.length > 0 && (
                    <li>
                      Effects:{' '}
                      {selectedEffects
                        .map((id) => effectItems.find((e) => e.id === id)?.name)
                        .join(', ')}
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <p>
                Select styles and effects from the options above to enhance your
                image.
              </p>
            )}
          </div>
        </div>

        <Button
          variant="slim"
          type="submit"
          className="mt-3"
          loading={isSubmitting}
          onClick={handleGenerateImage}
        >
          Generate Image
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

        {/* Show MyAssets component with auto-refresh enabled */}
        {(userId || userIp) && showMyAssets && (
          <div className="my-assets-section mt-8">
            <h2 className="text-xl font-bold mb-4">Your Generated Images</h2>
            <MyAssets autoRefreshQueued={true} />
          </div>
        )}
      </div>

      <GenericModal isOpen={isModalOpen} onClose={closeModal}>
        <ImageGallery />
      </GenericModal>
    </>
  );
};
