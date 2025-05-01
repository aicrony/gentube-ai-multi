'use client';
import React, { useEffect, useState } from 'react';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaTiktok,
  FaPinterest,
  FaLinkedin
} from 'react-icons/fa';
import { SocialPlatform } from './social-media-auth-button';

interface PlatformSelectionGridProps {
  selectedPlatforms: SocialPlatform[];
  onTogglePlatform: (platform: SocialPlatform) => void;
  connectedPlatforms?: SocialPlatform[];
  disabled?: boolean;
  className?: string;
  isDarkMode?: boolean;
}

// Platform configuration with icons and colors
const platforms: Array<{
  id: SocialPlatform;
  name: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <FaFacebook size={24} />,
    color: '#1877F2'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <FaInstagram size={24} />,
    color: '#E1306C'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <FaTwitter size={24} />,
    color: '#1DA1F2'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <FaTiktok size={24} />,
    color: '#000000'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: <FaPinterest size={24} />,
    color: '#E60023'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <FaLinkedin size={24} />,
    color: '#0A66C2'
  }
];

export const PlatformSelectionGrid: React.FC<PlatformSelectionGridProps> = ({
  selectedPlatforms,
  onTogglePlatform,
  connectedPlatforms = [],
  disabled = false,
  className = '',
  isDarkMode = false
}) => {
  // Auto-detect dark mode if not explicitly provided
  const [detectedDarkMode, setDetectedDarkMode] = useState(false);
  
  // Effect to detect dark mode from CSS variables if not explicitly provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if browser prefers dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Check if the body has a dark class or dark mode CSS variable
      const bodyHasDarkClass = document.body.classList.contains('dark');
      const darkModeVar = getComputedStyle(document.documentElement).getPropertyValue('--dark-mode');
      
      setDetectedDarkMode(prefersDark || bodyHasDarkClass || darkModeVar === 'true');
    }
  }, []);
  
  // Use provided dark mode value or detected value
  const effectiveDarkMode = isDarkMode !== undefined ? isDarkMode : detectedDarkMode;
  
  return (
    <div className={`platform-selection-grid flex flex-wrap gap-3 ${className}`}>
      {platforms.map((platform) => {
        const isSelected = selectedPlatforms.includes(platform.id);
        const isConnected = connectedPlatforms.includes(platform.id);
        
        // Determine button style based on selection state and dark mode
        let buttonStyle: React.CSSProperties = {
          color: isSelected ? platform.color : effectiveDarkMode ? '#fff' : '#333',
          borderColor: isSelected ? platform.color : effectiveDarkMode ? '#666' : '#e2e8f0',
        };
        
        // Determine background color
        let bgClass = '';
        if (isSelected) {
          bgClass = effectiveDarkMode 
            ? 'bg-opacity-25 bg-white' 
            : 'bg-opacity-20 bg-slate-100';
        } else {
          bgClass = effectiveDarkMode
            ? 'hover:bg-opacity-10 hover:bg-white'
            : 'hover:bg-gray-50';
        }
        
        return (
          <button
            key={platform.id}
            onClick={() => onTogglePlatform(platform.id)}
            disabled={disabled || !isConnected}
            className={`
              flex items-center gap-2 p-3 rounded-md border transition-all
              ${bgClass}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${!isConnected ? 'opacity-50' : ''}
            `}
            style={buttonStyle}
            title={!isConnected
              ? `Connect to ${platform.name} in step 1 to enable posting` 
              : `${isSelected ? 'Deselect' : 'Select'} ${platform.name}`}
          >
            <span style={{ color: platform.color }}>{platform.icon}</span>
            <span>{platform.name}</span>
            {!isConnected && (
              <span className="text-xs ml-1">(Connect first)</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PlatformSelectionGrid;