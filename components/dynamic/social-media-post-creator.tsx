'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Button from '@/components/ui/Button';
import MyAssets from '@/components/dynamic/my-assets';
import GenericModal from '@/components/ui/GenericModal';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaTiktok,
  FaPinterest,
  FaLinkedin,
  FaImage,
  FaTimesCircle,
  FaPaperPlane
} from 'react-icons/fa';
import GuidedMessage from '@/components/ui/GuidedMessage/GuidedMessage';

interface SocialMediaPostCreatorProps {
  userId: string;
  userIp: string;
}

interface PlatformType {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  color: string;
}

export const SocialMediaPostCreator: React.FC<SocialMediaPostCreatorProps> = ({
  userId,
  userIp
}) => {
  // State for post content
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postCharCount, setPostCharCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Define available platforms
  const platforms: PlatformType[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FaFacebook size={24} />,
      connected: false,
      color: '#1877F2'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <FaInstagram size={24} />,
      connected: false,
      color: '#E1306C'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <FaTwitter size={24} />,
      connected: false,
      color: '#1DA1F2'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <FaTiktok size={24} />,
      connected: false,
      color: '#000000'
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: <FaPinterest size={24} />,
      connected: false,
      color: '#E60023'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <FaLinkedin size={24} />,
      connected: false,
      color: '#0A66C2'
    }
  ];

  // Update character count whenever post text changes
  useEffect(() => {
    setPostCharCount(postText.length);
  }, [postText]);

  // Handle selecting/deselecting platforms
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        return prev.filter((p) => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  // Handle platform connection
  const connectToPlatform = (platformId: string) => {
    // In a real implementation, this would initiate OAuth flow
    alert(`Connecting to ${platformId}...`);
    // For demonstration purposes, we'll just pretend it's connected
    // In a real app, you would save the OAuth tokens
  };

  // Handle image selection from assets
  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsAssetModalOpen(false);
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
  };

  // Handle post submission
  const handleSubmitPost = async () => {
    // Validate post content
    if (!postText.trim()) {
      setErrorMessage('Please enter some text for your post');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setErrorMessage('Please select at least one platform to post to');
      return;
    }

    setIsCreatingPost(true);
    setErrorMessage(null);

    try {
      // In a real implementation, this would call your backend API
      // which would then use the social media platform APIs

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success message
      const platformNames = selectedPlatforms
        .map((id) => platforms.find((p) => p.id === id)?.name)
        .join(', ');

      setPostResult(
        `Your post has been successfully shared to ${platformNames}!`
      );

      // Reset form after successful post
      setPostText('');
      setSelectedImage(null);
      setSelectedPlatforms([]);
    } catch (error) {
      console.error('Error posting to social media:', error);
      setErrorMessage('Failed to post to social media. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const getCharacterLimitWarning = () => {
    // Check different platform character limits
    if (selectedPlatforms.includes('twitter') && postCharCount > 280) {
      return 'Twitter posts are limited to 280 characters';
    }

    if (postCharCount > 2200) {
      return "Your post exceeds Instagram's character limit (2,200)";
    }

    return null;
  };

  return (
    <div className="social-media-post-creator">
      {/* Error messages */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Success message */}
      {postResult && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          {postResult}
        </div>
      )}

      {/* Platform Selection */}
      <div className="mb-6">
        <Label className="block mb-2 font-medium">
          Select platforms to post to:
        </Label>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="platform-selection">
              <button
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-2 p-2 rounded-md border transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                style={{ color: platform.color }}
              >
                {platform.icon}
                <span>{platform.name}</span>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Note: Social media integrations are simulated in this demo.
        </div>
      </div>

      {/* Image Selection */}
      <div className="mb-6">
        <Label className="block mb-2 font-medium">Select an image:</Label>
        {selectedImage ? (
          <div className="relative inline-block">
            <img
              src={selectedImage}
              alt="Selected media"
              className="max-w-full h-auto max-h-64 rounded-md border border-gray-300"
            />
            <button
              onClick={clearSelectedImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              aria-label="Remove image"
            >
              <FaTimesCircle size={16} />
            </button>
          </div>
        ) : (
          <Button
            onClick={() => setIsAssetModalOpen(true)}
            className="flex items-center gap-2"
          >
            <FaImage /> Select from your assets
          </Button>
        )}
      </div>

      {/* Post Text */}
      <div className="mb-6">
        <Label htmlFor="postText" className="block mb-2 font-medium">
          Write your post:
        </Label>
        <Input
          as="textarea"
          id="postText"
          className="min-h-[120px] text-base w-full p-3"
          placeholder="What would you like to share?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
        <div className="mt-1 flex justify-between text-sm">
          <span>{postCharCount} characters</span>
          {getCharacterLimitWarning() && (
            <span className="text-red-500">{getCharacterLimitWarning()}</span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <Button
          onClick={handleSubmitPost}
          loading={isCreatingPost}
          disabled={
            isCreatingPost || !postText.trim() || selectedPlatforms.length === 0
          }
          className="w-full py-3 flex items-center justify-center gap-2"
        >
          <FaPaperPlane /> Post to Selected Platforms
        </Button>
      </div>

      {/* Asset Selection Modal */}
      <GenericModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Select an Image</h2>
          <MyAssets assetType="img,upl" onSelectAsset={handleSelectImage} />
        </div>
      </GenericModal>
    </div>
  );
};

export default SocialMediaPostCreator;
