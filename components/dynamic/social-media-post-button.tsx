'use client';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { FaPaperPlane } from 'react-icons/fa';
import { SocialPlatform } from './social-media-auth-button';

interface SocialMediaPostButtonProps {
  platforms: SocialPlatform[];
  message: string;
  imageUrl?: string;
  title?: string; // For Pinterest
  description?: string; // For Pinterest
  link?: string; // For Pinterest links
  userId: string;
  className?: string;
  onSuccess?: (results: any) => void;
  onError?: (error: any) => void;
}

export const SocialMediaPostButton: React.FC<SocialMediaPostButtonProps> = ({
  platforms,
  message,
  imageUrl,
  title,
  description,
  link,
  userId,
  className = '',
  onSuccess,
  onError
}) => {
  const [isPosting, setIsPosting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Function to post content to selected social media platforms
  const handlePost = async () => {
    if (platforms.length === 0) {
      onError?.({ error: 'No platforms selected' });
      return;
    }

    if (!message && !imageUrl) {
      onError?.({ error: 'Please provide text or an image to post' });
      return;
    }

    setIsPosting(true);

    try {
      // Call the multipost API endpoint
      const response = await fetch('/api/social/multipost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platforms,
          message,
          imageUrl,
          title: title || message.substring(0, 100), // For Pinterest
          description: description || message, // For Pinterest
          link, // For Pinterest and other platforms that support links
          userId
        })
      });

      const result = await response.json();
      setLastResult(result);

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result);
      }
    } catch (error) {
      console.error('Error posting to social media:', error);
      setLastResult({ error: 'Failed to post to social media' });
      onError?.(error);
    } finally {
      setIsPosting(false);
    }
  };

  // Get platform names for display
  const getPlatformNames = (platforms: SocialPlatform[]): string => {
    const platformMap: Record<SocialPlatform, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'X (Twitter)',
      tiktok: 'TikTok',
      pinterest: 'Pinterest',
      linkedin: 'LinkedIn'
    };

    return platforms.map((p) => platformMap[p]).join(', ');
  };

  // Check for character limits based on platforms
  const getCharacterWarning = (): string | null => {
    if (platforms.includes('twitter') && message.length > 280) {
      return 'Twitter limits posts to 280 characters';
    }

    if (platforms.includes('instagram') && message.length > 2200) {
      return 'Instagram captions are limited to 2,200 characters';
    }

    return null;
  };

  const warning = getCharacterWarning();
  const isDisabled =
    platforms.length === 0 || (!message && !imageUrl) || isPosting;

  return (
    <div className="social-media-post-button">
      {warning && (
        <div className="text-red-500 text-sm mb-2">Warning: {warning}</div>
      )}

      <Button
        onClick={handlePost}
        loading={isPosting}
        disabled={isDisabled}
        className={`w-full py-3 flex items-center justify-center gap-2 ${className}`}
      >
        <FaPaperPlane />
        Post to{' '}
        {platforms.length > 0
          ? getPlatformNames(platforms)
          : 'Selected Platforms'}
      </Button>

      {lastResult && lastResult.error && (
        <div className="mt-2 text-red-500 text-sm">
          {typeof lastResult.error === 'string'
            ? lastResult.error
            : 'Error posting to social media'}
        </div>
      )}
    </div>
  );
};

export default SocialMediaPostButton;
