import React from 'react';

interface LoadingAnimationProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  size = 'medium',
  message = 'Loading...',
  fullScreen = false,
  overlay = false
}) => {
  // Size classes for the spinner
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-12 w-12 border-4',
    large: 'h-20 w-20 border-4'
  };

  // Text size classes
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  // Container for the animation
  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    : overlay
      ? 'absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg'
      : 'flex flex-col items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className={`${fullScreen || overlay ? 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg' : ''} text-center`}>
        <div 
          className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent border-primary mx-auto mb-4`}
          style={{ borderTopColor: 'transparent', borderRightColor: 'var(--primary-color)', borderBottomColor: 'var(--primary-color)', borderLeftColor: 'var(--primary-color)' }}
        ></div>
        {message && (
          <p className={`${textSizeClasses[size]} font-semibold ${fullScreen || overlay ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingAnimation;