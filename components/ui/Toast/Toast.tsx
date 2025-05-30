import React, { useEffect, useState } from 'react';
import { FaTimes, FaImage, FaVideo, FaEdit, FaExclamationTriangle } from 'react-icons/fa';

interface ToastProps {
  id: string;
  type: 'image' | 'video' | 'image-edit' | 'error';
  prompt: string;
  onClose: (id: string) => void;
  onClick: (id: string) => void;
  duration?: number; // in milliseconds, default 15000 (15 seconds)
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  prompt,
  onClose,
  onClick,
  duration = 15000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-close timer
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, duration);

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(autoCloseTimer);
      clearInterval(countdownTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Wait for fade out animation
  };

  const handleClick = () => {
    onClick(id);
  };

  const getIcon = () => {
    switch (type) {
      case 'image':
        return <FaImage className="text-white" />;
      case 'video':
        return <FaVideo className="text-white" />;
      case 'image-edit':
        return <FaEdit className="text-white" />;
      case 'error':
        return <FaExclamationTriangle className="text-white" />;
      default:
        return <FaImage className="text-white" />;
    }
  };

  const getTypeText = () => {
    switch (type) {
      case 'image':
        return 'Image';
      case 'video':
        return 'Video';
      case 'image-edit':
        return 'Edited Image';
      case 'error':
        return 'Error';
      default:
        return 'Asset';
    }
  };

  const truncatePrompt = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getToastColors = () => {
    if (type === 'error') {
      return 'bg-red-600 border-red-500';
    }
    return 'bg-blue-600 border-blue-500';
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-2xl ${getToastColors()} text-white rounded-lg shadow-lg z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ minHeight: '80px', width: '32rem' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-semibold text-sm">{getTypeText()} Ready!</span>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
            title="Close notification"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>

        {/* Content */}
        <div 
          className={`cursor-pointer ${type === 'error' ? 'hover:bg-red-700' : 'hover:bg-blue-700'} -m-4 p-4 rounded-lg transition-colors`}
          onClick={handleClick}
          title={type === 'error' 
            ? "Click to go to pricing page" 
            : type === 'image-edit' 
              ? "Click to view edited image with options"
              : "Click to open in edit mode"}
        >
          <p className={`text-xs mb-2 ${type === 'error' ? 'text-red-100' : 'text-blue-100'}`}>
            "{truncatePrompt(prompt)}"
          </p>
          <p className={`text-xs ${type === 'error' ? 'text-red-200' : 'text-blue-200'}`}>
            {type === 'error' 
              ? 'Click to get credits' 
              : type === 'image-edit' 
                ? 'Click to view edited image'
                : 'Click to view'} • Auto-close in {timeLeft}s
          </p>
        </div>
      </div>
    </div>
  );
};

export default Toast;