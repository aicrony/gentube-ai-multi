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
import { handleApiError } from '@/utils/apiErrorHandler';
import {
  imageCategories,
  getCategories,
  getStylesByCategory,
  getStyleById,
  ImageStyle
} from '@/data/imageStyles';

interface ImageDynamicButtonProps {
  userId: string;
  userIp: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
}

export const ImageDynamicButton: React.FC<ImageDynamicButtonProps> = ({
  userId,
  userIp,
  onUserCreditsUpdate
}) => {
  const [prompt, setPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [imageData, setImageData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for Modal
  const [imageGalleryData, setImageGalleryData] = useState<any>(null); // State for ImageGallery
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null); // State for Modal Image URL
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();

  // New state variables for style selection
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [availableStyles, setAvailableStyles] = useState<ImageStyle[]>([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  // Update available styles when category changes
  useEffect(() => {
    if (selectedCategory) {
      const styles = getStylesByCategory(selectedCategory);
      setAvailableStyles(styles);
      // Reset selected style when category changes
      setSelectedStyle('');
    } else {
      setAvailableStyles([]);
    }
  }, [selectedCategory]);

  // Handle category selection
  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCategory(event.target.value);
  };

  // Handle style selection
  const handleStyleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStyle(event.target.value);
  };

  const renderVideoButton = useCallback(() => {
    if (!imageData) {
      return null;
    } else {
      let url = '';
      if (imageData && imageData.url) {
        url = imageData.url;
        console.log('URL Data: ' + JSON.stringify(imageData));
        console.log('imageData.url: ' + url);
      } else if (imageData && typeof imageData === 'string') {
        url = imageData;
        console.log('imageData: ' + url);
      }

      return (
        <VideoDynamicButton
          urlData={url}
          userId={userId}
          onUserCreditsUpdate={onUserCreditsUpdate}
        />
      );
    }
  }, [imageData]);

  const handleGenerateImage = async () => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    setImageData(null); // clear the imageData state
    setErrorMessage(null); // clear any previous error message
    console.log('PASS userId:', userId);
    console.log('PASS userIp:', userIp);

    // Validate that prompt is not empty or just whitespace
    if (!prompt || !prompt.trim()) {
      setErrorMessage('Please enter a description for your image.');
      setIsSubmitting(false);
      return;
    }

    // Create the final prompt with the style if selected
    let finalPrompt = prompt.trim();
    if (selectedStyle) {
      const style = getStyleById(selectedStyle);
      if (style) {
        // Remove trailing punctuation if it exists
        finalPrompt = finalPrompt.replace(/[.!,;:?]$/, '');
        // Add space and style suffix
        finalPrompt = `${finalPrompt} ${style.promptSuffix}`;
        console.log('Final prompt with style:', finalPrompt);
      }
    }
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

      setIsSubmitting(false); // Response is received, enable the button
      setMessage('Click the Refresh Assets button to see your image');

      // Use the centralized error handler
      if (await handleApiError(response, { setErrorMessage })) {
        return; // Error was handled, exit the function
      }
      let dataResponse: { result?: any; credits?: any; error?: boolean } = {};
      if (response.headers.get('content-type')?.includes('application/json')) {
        dataResponse = await response.json();
        setIsSubmitting(false); // Response is received, enable the button
        console.log('Result:', dataResponse.result);
        console.log('UserCredits:', dataResponse.credits);
        if (dataResponse.error) {
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
          setImageData(
            'https://storage.googleapis.com/gen-image-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3.png'
          ); // set the url of the response
        } else if (!dataResponse.error) {
          if (dataResponse.result == 'InQueue') {
            setMessage('Click the Refresh Assets button to see your image');

            // Auto-clear the message after 30 seconds
            setTimeout(() => {
              setMessage('');
            }, 30000);
          }
        }

        setUserCreditsResponse(dataResponse.credits); // set user credits from response
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(dataResponse.credits); // update parent component if callback is provided
        }
        setModalImageUrl(dataResponse.result); // Set the image URL for the modal
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
    setModalImageUrl(null); // Clear the modal image URL
  };

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />
      <div className="my-assets-container">
        <Input
          as="text"
          className="min-h-[50px] text-xl"
          id="prompt"
          placeholder="Enter a description of your image."
          value={prompt}
          onChange={handleInputChange}
        />

        {/* Style Selection Dropdowns */}
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          {/* Category Selection */}
          <div className="flex-1">
            <Label htmlFor="category-select" className="mb-1 block text-sm">
              Image Category (optional)
            </Label>
            <select
              id="category-select"
              className="w-full min-h-[40px] rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">Select a category</option>
              {getCategories().map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style Selection - only shown if a category is selected */}
          <div className="flex-1">
            <Label htmlFor="style-select" className="mb-1 block text-sm">
              Image Style (optional)
            </Label>
            <select
              id="style-select"
              className="w-full min-h-[40px] rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStyle}
              onChange={handleStyleChange}
              disabled={!selectedCategory}
            >
              <option value="">
                {selectedCategory
                  ? 'Select a style'
                  : 'Select a category first'}
              </option>
              {availableStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
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
        {/*        Check out the gallery while you wait for your image to*/}
        {/*        generate...*/}
        {/*      </Button>*/}
        {/*    </div>*/}
        {/*    <div className={'padding-top-4'}>*/}
        {/*      <p>Remaining Credits: {userCreditsResponse}</p>*/}
        {/*    </div>*/}
        {/*  </>*/}
        {/*)}*/}
        {userCreditsResponse !== null && message && (
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-md shadow-sm flex justify-between items-center">
            <div className="flex items-center">
              <span className="mr-2">🔄</span>
              <h3 className="font-medium text-blue-800 dark:text-blue-200">{message}</h3>
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
        {imageData &&
          imageData !== '[object%20Object]' &&
          imageData.code !== 'ERR_NON_2XX_3XX_RESPONSE' && (
            <div className={'margin-top-8'}>
              <div>
                <a href={imageData} target="_blank">
                  Open Image <br /> {JSON.stringify(imageData.code)}
                </a>
              </div>
              <img src={imageData} alt="Generated Image" />
              {renderVideoButton()}
            </div>
          )}
        {imageData && imageData.code === 'ERR_NON_2XX_3XX_RESPONSE' && (
          <div className={'margin-top-8'}>
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
