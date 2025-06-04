import React, { useEffect, useState } from 'react';
import {
  FaTimes,
  FaImage,
  FaVideo,
  FaEdit,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';

interface ToastProps {
  id: string;
  type: 'image' | 'video' | 'image-edit' | 'error' | 'success';
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
      case 'success':
        return <FaCheckCircle className="text-white" />;
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
      case 'success':
        return 'Success';
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
    if (type === 'success') {
      return 'bg-green-600 border-green-500';
    }
    return 'bg-blue-600 border-blue-500';
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 lg:w-[36rem] xl:w-[42rem] 2xl:w-[48rem] ${getToastColors()} text-white rounded-lg shadow-lg z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ minHeight: '80px' }}
    >
      <div className="p-4 lg:p-5">
        {/* Header and Content in horizontal layout on larger screens */}
        <div className="lg:flex lg:items-start lg:gap-4">
          {/* Icon and Title section */}
          <div className="flex items-center justify-between mb-2 lg:mb-0 lg:flex-shrink-0">
            <div className="flex items-center gap-2">
              {getIcon()}
              <span className="font-semibold text-sm lg:text-base">
                {getTypeText()} Ready!
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors lg:hidden"
              title="Close notification"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>

          {/* Content section - grows to fill available space */}
          {type === 'success' ? (
            /* Non-clickable success toast */
            <div className="flex-grow -m-4 p-4 lg:-m-5 lg:p-5 rounded-lg">
              <p className="text-xs lg:text-sm mb-1 text-green-100">
                {truncatePrompt(prompt)}
              </p>
              <p className="text-xs text-green-200">
                Auto-close in {timeLeft}s
              </p>
            </div>
          ) : (
            /* Clickable toast for other types */
            <div
              className={`cursor-pointer flex-grow ${
                type === 'error' 
                  ? 'hover:bg-red-700' 
                  : 'hover:bg-blue-700'
              } -m-4 p-4 lg:-m-5 lg:p-5 rounded-lg transition-colors`}
              onClick={handleClick}
              title={
                type === 'error'
                  ? 'Click to go to pricing page'
                  : type === 'image-edit'
                    ? 'Click to view edited image'
                    : 'Click to view'
              }
            >
              <p
                className={`text-xs lg:text-sm mb-1 ${
                  type === 'error' ? 'text-red-100' : 'text-blue-100'
                }`}
              >
                &quot;{truncatePrompt(prompt)}&quot;
              </p>
              <p
                className={`text-xs ${
                  type === 'error' ? 'text-red-200' : 'text-blue-200'
                }`}
              >
                {type === 'error'
                  ? 'Click to get credits'
                  : type === 'image-edit'
                    ? 'Click to view edited image'
                    : 'Click to view'}{' '}
                • Auto-close in {timeLeft}s
              </p>
            </div>
          )}

          {/* Close button for larger screens */}
          <button
            onClick={handleClose}
            className="hidden lg:block text-white hover:text-gray-200 transition-colors lg:ml-2"
            title="Close notification"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
