'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Button from '@/components/ui/Button';
import MyAssets from '@/components/dynamic/my-assets';
import GenericModal from '@/components/ui/GenericModal';
import { FaImage, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import GuidedMessage from '@/components/ui/GuidedMessage/GuidedMessage';
import SocialMediaAuthButton, {
  SocialPlatform
} from './social-media-auth-button';
import SocialMediaPostButton from './social-media-post-button';
import PlatformSelectionGrid from './platform-selection-grid';

interface SocialMediaPostCreatorProps {
  userId: string;
  userIp: string;
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(
    []
  );
  const [connectedPlatforms, setConnectedPlatforms] = useState<
    SocialPlatform[]
  >(['facebook']); // For demo purposes, assume Facebook is connected
  const [postCharCount, setPostCharCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [link, setLink] = useState<string>(''); // For posts with links (Pinterest, etc.)
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);

  // Update character count whenever post text changes
  useEffect(() => {
    setPostCharCount(postText.length);
  }, [postText]);

  // Fetch connected platforms when component mounts
  useEffect(() => {
    // Get all platforms the user has connected to
    const fetchConnectedPlatforms = async () => {
      try {
        const response = await fetch('/api/social/connected-platforms');
        if (response.ok) {
          const data = await response.json();
          if (data.platforms && Array.isArray(data.platforms)) {
            setConnectedPlatforms(data.platforms);
          }
        }
      } catch (error) {
        console.error('Error fetching connected platforms:', error);
      }
    };

    fetchConnectedPlatforms();

    // Also check the URL for error parameters (from OAuth redirects)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const error = url.searchParams.get('error');
      if (error) {
        setErrorMessage(`Authentication failed: ${error.replace(/_/g, ' ')}`);

        // Remove the error parameter from the URL
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  // Handle selecting/deselecting platforms
  const togglePlatform = (platformId: SocialPlatform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        return prev.filter((p) => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  // Handle platform connection
  const handleConnectPlatform = async (platform: SocialPlatform) => {
    // In a real implementation, this would initiate OAuth flow with the platform
    // For demo purposes, we'll just simulate a successful connection

    // Simulate API call delay
    setIsCreatingPost(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Add platform to connected list
    if (!connectedPlatforms.includes(platform)) {
      setConnectedPlatforms((prev) => [...prev, platform]);
    }

    setIsCreatingPost(false);
  };

  // Handle platform disconnection
  const handleDisconnectPlatform = async (platform: SocialPlatform) => {
    // In a real implementation, this would revoke OAuth tokens

    // Simulate API call delay
    setIsCreatingPost(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Remove platform from connected list
    setConnectedPlatforms((prev) => prev.filter((p) => p !== platform));

    // Also remove from selected platforms if present
    setSelectedPlatforms((prev) => prev.filter((p) => p !== platform));

    setIsCreatingPost(false);
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

  // Handle successful post
  const handlePostSuccess = (result: any) => {
    console.log('Post success:', result);

    // Generate success message
    const successfulPlatforms = result.results
      .filter((r: any) => r.success)
      .map((r: any) => r.platform);

    const platformNames = successfulPlatforms
      .map((p: string) => {
        const nameMap: Record<string, string> = {
          facebook: 'Facebook',
          instagram: 'Instagram',
          twitter: 'X (Twitter)',
          tiktok: 'TikTok',
          pinterest: 'Pinterest',
          linkedin: 'LinkedIn'
        };
        return nameMap[p] || p;
      })
      .join(', ');

    setPostResult(
      `Your post has been successfully shared to ${platformNames}!`
    );

    // Reset form
    setPostText('');
    setSelectedImage(null);
    setSelectedPlatforms([]);
    setLink('');
    setIsLinkInputOpen(false);
    setErrorMessage(null);
  };

  // Handle post error
  const handlePostError = (error: any) => {
    console.error('Post error:', error);
    setErrorMessage(
      error.message || 'Failed to post to social media. Please try again.'
    );
  };

  // Get character limit warning based on selected platforms
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

      {/* Platform Authentication Section */}
      <div className="mb-6">
        <Label className="block mb-2 font-medium">
          Connect to social platforms:
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SocialMediaAuthButton
            platform="facebook"
            isConnected={connectedPlatforms.includes('facebook')}
            onConnect={handleConnectPlatform}
            onDisconnect={handleDisconnectPlatform}
          />
          <SocialMediaAuthButton
            platform="instagram"
            isConnected={connectedPlatforms.includes('instagram')}
            onConnect={handleConnectPlatform}
            onDisconnect={handleDisconnectPlatform}
          />
          <SocialMediaAuthButton
            platform="twitter"
            isConnected={connectedPlatforms.includes('twitter')}
            onConnect={handleConnectPlatform}
            onDisconnect={handleDisconnectPlatform}
          />
          <SocialMediaAuthButton
            platform="linkedin"
            isConnected={connectedPlatforms.includes('linkedin')}
            onConnect={handleConnectPlatform}
            onDisconnect={handleDisconnectPlatform}
          />
          <SocialMediaAuthButton
            platform="pinterest"
            isConnected={connectedPlatforms.includes('pinterest')}
            onConnect={handleConnectPlatform}
            onDisconnect={handleDisconnectPlatform}
          />
          <SocialMediaAuthButton
            platform="tiktok"
            isConnected={connectedPlatforms.includes('tiktok')}
            onConnect={handleConnectPlatform}
            onDisconnect={handleDisconnectPlatform}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Connect to your social media accounts to enable posting.
        </div>
      </div>

      {/* Platform Selection */}
      <div className="mb-6">
        <Label className="block mb-2 font-medium">
          Select platforms to post to:
        </Label>
        <PlatformSelectionGrid
          selectedPlatforms={selectedPlatforms}
          onTogglePlatform={togglePlatform}
          connectedPlatforms={connectedPlatforms}
          disabled={isCreatingPost}
        />
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
            disabled={isCreatingPost}
          >
            <FaImage /> Select from your assets
          </Button>
        )}
      </div>

      {/* Link Input - shows when Pinterest is selected */}
      {(selectedPlatforms.includes('pinterest') || isLinkInputOpen) && (
        <div className="mb-6">
          <Label htmlFor="linkInput" className="block mb-2 font-medium">
            Add a link (optional):
          </Label>
          <Input
            id="linkInput"
            type="url"
            placeholder="https://example.com/my-page"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={isCreatingPost}
          />
          <div className="mt-1 text-sm text-gray-500">
            Adding a link is recommended for Pinterest and useful for other
            platforms.
          </div>
        </div>
      )}

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
          disabled={isCreatingPost}
          maxLength={selectedPlatforms.includes('twitter') ? 280 : 2200}
        />
        <div className="mt-1 flex justify-between text-sm">
          <span>
            {postCharCount} /{' '}
            {selectedPlatforms.includes('twitter') ? 280 : 2200} characters
          </span>
          {getCharacterLimitWarning() && (
            <span className="text-red-500">{getCharacterLimitWarning()}</span>
          )}
        </div>

        {/* Platform-specific character limits */}
        {selectedPlatforms.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Character limits:</p>
            <ul className="mt-1 list-disc ml-5">
              {selectedPlatforms.includes('twitter') && (
                <li>Twitter: 280 characters</li>
              )}
              {selectedPlatforms.includes('instagram') && (
                <li>Instagram: 2,200 characters</li>
              )}
              {selectedPlatforms.includes('facebook') && (
                <li>Facebook: 63,206 characters</li>
              )}
              {selectedPlatforms.includes('linkedin') && (
                <li>LinkedIn: 3,000 characters</li>
              )}
              {selectedPlatforms.includes('pinterest') && (
                <li>Pinterest: 500 characters</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <SocialMediaPostButton
          platforms={selectedPlatforms}
          message={postText}
          imageUrl={selectedImage || undefined}
          link={link || undefined}
          userId={userId}
          className="w-full py-3"
          onSuccess={handlePostSuccess}
          onError={handlePostError}
        />
      </div>

      {/* Asset Selection Modal */}
      <GenericModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Select an Image</h2>
          <MyAssets
            assetType="img,upl"
            onSelectAsset={handleSelectImage}
            autoRefreshQueued={true}
          />
        </div>
      </GenericModal>
    </div>
  );
};

export default SocialMediaPostCreator;
