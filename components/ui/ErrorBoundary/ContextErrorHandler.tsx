'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface ContextErrorHandlerProps {
  children: ReactNode;
  onRetry?: () => void;
}

const ContextErrorHandler: React.FC<ContextErrorHandlerProps> = ({ 
  children, 
  onRetry = () => window.location.reload()
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);
  
  // Reset the error state when the component mounts
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setShowErrorMessage(false);
    
    // Set a timeout to stop the loading state
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      
      // If there's an error, wait a bit longer before showing the error UI
      if (hasError) {
        const errorTimer = setTimeout(() => {
          setShowErrorMessage(true);
        }, 5000); // 5 more seconds (10s total)
        
        return () => clearTimeout(errorTimer);
      }
    }, 5000);
    
    return () => clearTimeout(loadingTimer);
  }, [hasError]);
  
  // Function to handle context errors
  const handleContextError = (error: Error) => {
    console.error('Context error detected:', error);
    setHasError(true);
    // Don't show the error message immediately to avoid flashing
  };
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold mb-8">GenTube.ai</h1>
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="mt-6 text-gray-600">Loading your session...</p>
      </div>
    </div>
  );
  
  // Error message component
  const ErrorMessage = () => (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <div className="text-center p-8 max-w-lg">
        <h1 className="text-4xl font-extrabold mb-6">GenTube.ai</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Loading your session...
          </h2>
          <p className="text-gray-700 mb-4">
            We are preparing your session. If the page does not load, try
            clicking 'Reload Page' or 'Return to Home' to restart the session.
          </p>
          <Button
            variant="slim"
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Reload Page
          </Button>
        </div>
        <div className="mt-4">
          <Link href="/start">
            <Button variant="slim">Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
  
  // Decide what to render based on the state
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (hasError && showErrorMessage) {
    return <ErrorMessage />;
  }
  
  // Try to render the children, catch context errors
  try {
    return <>{children}</>;
  } catch (error) {
    // Handle the error and show loading initially
    handleContextError(error as Error);
    return <LoadingSpinner />;
  }
};

export default ContextErrorHandler;