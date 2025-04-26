'use client';
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserCredits } from '@/context/UserCreditsContext';
import { CreditLimitNoticeButton } from '@/components/static/credit-limit-notice-button';
import GenericModal from '@/components/ui/GenericModal';
import MyAssets from '@/components/dynamic/my-assets';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface ProductImageGeneratorProps {
  userId: string;
  userIp: string;
  onUserCreditsUpdate?: (credits: number | null) => void;
  uploadedImageUrl?: string | null;
}

export const ProductImageGenerator: React.FC<ProductImageGeneratorProps> = ({
  userId,
  userIp,
  onUserCreditsUpdate,
  uploadedImageUrl
}) => {
  // State for image selection
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState<
    string | null
  >(null);
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState<
    string | null
  >(null);

  // State for form inputs
  const [sceneDescription, setSceneDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [placementType, setPlacementType] = useState('manual_placement');
  const [placement, setPlacement] = useState('bottom_center');

  // State for request handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Credits
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();

  // Placement options
  const placementOptions = [
    { value: 'upper_left', label: 'Upper Left' },
    { value: 'upper_right', label: 'Upper Right' },
    { value: 'bottom_left', label: 'Bottom Left' },
    { value: 'bottom_right', label: 'Bottom Right' },
    { value: 'right_center', label: 'Right Center' },
    { value: 'left_center', label: 'Left Center' },
    { value: 'upper_center', label: 'Upper Center' },
    { value: 'bottom_center', label: 'Bottom Center' },
    { value: 'center_vertical', label: 'Center Vertical' },
    { value: 'center_horizontal', label: 'Center Horizontal' }
  ];

  // Use uploadedImageUrl when provided
  useEffect(() => {
    if (uploadedImageUrl && !selectedProductImage) {
      setSelectedProductImage(uploadedImageUrl);
    }
  }, [uploadedImageUrl]);

  // Handle asset selection
  const handleProductSelect = (assetUrl: string) => {
    setSelectedProductImage(assetUrl);
    setIsProductModalOpen(false);
  };

  const handleBackgroundSelect = (assetUrl: string) => {
    setSelectedBackgroundImage(assetUrl);
    setIsBackgroundModalOpen(false);
  };

  // Generate product image
  const handleGenerateProductImage = async () => {
    // Validate inputs
    const trimmedDescription = sceneDescription.trim();
    const trimmedPrompt = prompt.trim();

    if (!selectedProductImage) {
      setErrorMessage('Please select a product image');
      return;
    }
    if (!selectedBackgroundImage) {
      setErrorMessage('Please select a background image');
      return;
    }
    if (!trimmedPrompt) {
      setErrorMessage('Please enter a prompt');
      return;
    }
    if (!trimmedDescription) {
      setErrorMessage('Please enter a scene description');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setResultImageUrl(null);
    setMessage(null); // Clear any previous messages

    // Add this before the fetch call
    console.log('Sending API request with:', {
      product_image_url: selectedProductImage,
      background_image_url: selectedBackgroundImage,
      prompt: trimmedPrompt,
      scene_description: trimmedDescription,
      placement_type: placementType,
      manual_placement_selection: placement
    });

    try {
      const response = await fetch('/api/product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({
          product_image_url: selectedProductImage,
          background_image_url: selectedBackgroundImage,
          prompt: trimmedPrompt,
          scene_description: trimmedDescription,
          placement_type: placementType,
          manual_placement_selection: placement
        })
      });

      if (!response.ok) {
        setIsSubmitting(false);
        setErrorMessage('Request failed. Please try again.');
        return;
      }

      const data = await response.json();
      setIsSubmitting(false);

      if (data.error) {
        setErrorMessage(
          data.result === 'LimitExceeded'
            ? 'Credit limit exceeded. Purchase credits on the PRICING page.'
            : data.result === 'CreateAccount'
              ? 'Create an account for free credits.'
              : data.result
        );
      } else {
        if (data.result === 'InQueue') {
          setMessage(
            'Your product image is in queue. Refresh your assets to see it when ready.'
          );
        } else {
          setResultImageUrl(data.result);
        }

        // Update credits
        setUserCreditsResponse(data.credits);
        if (onUserCreditsUpdate) {
          onUserCreditsUpdate(data.credits);
        }
      }
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage('An error occurred. Please try again.');
      console.error('Error generating product image:', error);
    }
  };

  // Asset Selection Modal
  const AssetSelectionModal = ({
    isOpen,
    onClose,
    onSelect,
    title
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    title: string;
  }) => {
    if (!isOpen) return null;

    return (
      <GenericModal isOpen={isOpen} onClose={onClose}>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          <div className="asset-selection">
            <MyAssets assetType="upl" onSelectAsset={onSelect} />
          </div>
        </div>
      </GenericModal>
    );
  };

  return (
    <>
      <CreditLimitNoticeButton errorMessage={errorMessage} />

      <div className="space-y-6">
        {/* Product Image Selection */}
        <div className="space-y-2">
          <Label htmlFor="productImage" className="font-medium">
            Product Image
          </Label>
          <div className="flex items-center space-x-3">
            <div
              className="border p-2 rounded w-24 h-24 flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--card-bg-color)' }}
              onClick={() => setIsProductModalOpen(true)}
            >
              {selectedProductImage ? (
                <img
                  src={selectedProductImage}
                  alt="Selected product"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-sm text-center">
                  Click to select product
                </div>
              )}
            </div>
            <Button onClick={() => setIsProductModalOpen(true)}>
              {selectedProductImage ? 'Change Product' : 'Select Product'}
            </Button>
          </div>
        </div>

        {/* Background Image Selection */}
        <div className="space-y-2">
          <Label htmlFor="backgroundImage" className="font-medium">
            Background Image
          </Label>
          <div className="flex items-center space-x-3">
            <div
              className="border p-2 rounded w-24 h-24 flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--card-bg-color)' }}
              onClick={() => setIsBackgroundModalOpen(true)}
            >
              {selectedBackgroundImage ? (
                <img
                  src={selectedBackgroundImage}
                  alt="Selected background"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-sm text-center">
                  Click to select background
                </div>
              )}
            </div>
            <Button onClick={() => setIsBackgroundModalOpen(true)}>
              {selectedBackgroundImage
                ? 'Change Background'
                : 'Select Background'}
            </Button>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="font-medium">
            Prompt / Product Description
          </Label>
          {/*<p className="instruction-text">*/}
          {/*  Enter a detailed prompt describing how you want your product to appear (e.g., professional product photo of a shoe with soft lighting on a wooden desk)*/}
          {/*</p>*/}
          <Input
            as="textarea"
            id="prompt"
            placeholder="Enter a detailed prompt for the AI (e.g., photo of a [product] on a desk with soft lighting, professional product photography)"
            className="min-h-[100px] text-base"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Scene Description */}
        <div className="space-y-2">
          <Label htmlFor="sceneDescription" className="font-medium">
            Scene Description
          </Label>
          {/*<p className="instruction-text">*/}
          {/*  Describe the specific scene or setting where your product should be*/}
          {/*  placed (e.g., on a beach, in a modern kitchen, on a mountain)*/}
          {/*</p>*/}
          <Input
            as="textarea"
            id="sceneDescription"
            placeholder="Describe the scene for your product (e.g., on a rock, next to the ocean, dark theme)"
            className="min-h-[100px] text-base"
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
          />
        </div>

        {/* Placement Options */}
        <div className="space-y-2">
          <Label htmlFor="placement" className="font-medium">
            Product Placement
          </Label>
          <select
            id="placement"
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="w-full p-2 border rounded-md text-base"
            style={{
              backgroundColor: 'var(--card-bg-color)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)'
            }}
          >
            {placementOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <Button
          variant="slim"
          type="submit"
          className="w-full"
          loading={isSubmitting}
          onClick={handleGenerateProductImage}
          disabled={
            isSubmitting || !selectedProductImage || !selectedBackgroundImage
          }
        >
          Generate Product Image (10 credits)
        </Button>

        {/* Status Messages */}
        {message && (
          <div
            className="border p-3 rounded"
            style={{
              backgroundColor: 'rgba(74, 144, 226, 0.1)',
              borderColor: 'rgba(74, 144, 226, 0.3)',
              color: 'var(--primary-color)'
            }}
          >
            {message}
          </div>
        )}

        {/* Result Image */}
        {resultImageUrl && (
          <h3 className="font-semibold text-lg mb-3">
            Your Product Image is Generating
          </h3>
        )}
      </div>

      {/* Asset Selection Modals */}
      <AssetSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleProductSelect}
        title="Select Product Image"
      />

      <AssetSelectionModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        onSelect={handleBackgroundSelect}
        title="Select Background Image"
      />
    </>
  );
};

export default ProductImageGenerator;
