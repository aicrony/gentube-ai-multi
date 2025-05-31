'use client';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { IconType } from 'react-icons';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaTiktok,
  FaPinterest,
  FaLinkedin,
  FaUnlink,
  FaLink,
  FaExclamationTriangle
} from 'react-icons/fa';

// Define supported social media platforms
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'pinterest'
  | 'linkedin';

interface SocialMediaAuthButtonProps {
  platform: SocialPlatform;
  isConnected?: boolean;
  onConnect?: (platform: SocialPlatform) => void;
  onDisconnect?: (platform: SocialPlatform) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
  isDarkMode?: boolean;
}

// Map of platform IDs to their brand colors
const platformColors: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  pinterest: '#E60023',
  linkedin: '#0A66C2'
};

// Map of platform IDs to their icons
const platformIcons: Record<SocialPlatform, IconType> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  twitter: FaTwitter,
  tiktok: FaTiktok,
  pinterest: FaPinterest,
  linkedin: FaLinkedin
};

// Map of platform IDs to their display names
const platformNames: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn'
};

export const SocialMediaAuthButton: React.FC<SocialMediaAuthButtonProps> = ({
  platform,
  isConnected = false,
  onConnect,
  onDisconnect,
  className = '',
  size = 'medium',
  showStatus = true,
  isDarkMode = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const Icon = platformIcons[platform];
  const platformColor = platformColors[platform];
  const platformName = platformNames[platform];

  const handleConnect = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      // For custom connect handler
      if (onConnect) {
        await onConnect(platform);
      } else {
        // Default OAuth behavior - redirect to OAuth endpoint
        window.location.href = `/api/social/oauth/${platform}`;
      }
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      // For custom disconnect handler
      if (onDisconnect) {
        await onDisconnect(platform);
      } else {
        // Default behavior - call disconnect API
        const response = await fetch('/api/social/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ platform })
        });

        if (!response.ok) {
          throw new Error(`Failed to disconnect from ${platform}`);
        }

        // Reload page to update UI
        window.location.reload();
      }
    } catch (error) {
      console.error(`Error disconnecting from ${platform}:`, error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle button click based on connection state
  const handleClick = () => {
    if (isConnected) {
      handleDisconnect();
    } else {
      handleConnect();
    }
  };

  // Icon size based on button size
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;

  // Button styling
  let buttonClasses = `flex items-center gap-2 transition-all ${className}`;

  // Size-specific classes
  switch (size) {
    case 'small':
      buttonClasses += ' px-2 py-1 text-sm';
      break;
    case 'large':
      buttonClasses += ' px-5 py-3 text-lg';
      break;
    default: // medium
      buttonClasses += ' px-4 py-2';
  }

  // Determine button styles (handle dark mode)
  let buttonStyle: React.CSSProperties = {};

  if (isConnected) {
    // Connected state
    if (isDarkMode) {
      buttonStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        border: `1px solid ${platformColor}`
      };
    } else {
      buttonStyle = {
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: `1px solid ${platformColor}`
      };
    }
  } else {
    // Default state - use platform brand color
    buttonStyle = {
      backgroundColor: platformColor,
      color: '#fff',
      border: `1px solid ${platformColor}`
    };
  }

  return (
    <Button
      onClick={handleClick}
      loading={isLoading}
      className={buttonClasses}
      style={buttonStyle}
    >
      {/* Main icon (platform logo) */}
      <Icon size={iconSize} />

      {/* Button text */}
      <span>
        {platformName}
        {showStatus && isConnected && <span className="ml-1">(Connected)</span>}
      </span>

      {/* Status indicator */}
      {showStatus && (
        <span className="ml-1">
          {hasError ? (
            <FaExclamationTriangle
              size={iconSize - 4}
              className="text-amber-500"
            />
          ) : isConnected ? (
            <FaUnlink size={iconSize - 4} />
          ) : (
            <FaLink size={iconSize - 4} />
          )}
        </span>
      )}
    </Button>
  );
};

export default SocialMediaAuthButton;
