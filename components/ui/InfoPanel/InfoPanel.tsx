'use client';

import React, { useState, useEffect } from 'react';
import {
  FaInfoCircle,
  FaTimes,
  FaPaperPlane,
  FaImage,
  FaPlay,
  FaFolder,
  FaStar,
  FaHeart,
  FaTrophy,
  FaExternalLinkAlt
} from 'react-icons/fa';
// Don't import useUserId to avoid hook issues - we'll get userId from props or context differently

interface InfoPanelProps {
  className?: string;
  userId?: string;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ className = '', userId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || !userId) {
      setSubmitMessage('Please enter feedback and ensure you are signed in.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          feedback: feedback.trim()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setFeedback('');
        setSubmitMessage('Thank you for your feedback! ✨');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSubmitMessage('');
        }, 3000);
      } else {
        setSubmitMessage(
          result.error || 'Failed to submit feedback. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureClick = (featureTitle: string) => {
    setIsOpen(false); // Close the modal first

    switch (featureTitle) {
      case 'Asset Groups':
        // Check if user is signed in before opening groups panel
        if (userId) {
          window.dispatchEvent(new CustomEvent('openGroupsPanel'));
        } else {
          // Redirect to sign in if not authenticated
          window.location.href = '/signin';
        }
        break;
      case 'Group Slideshows':
        // Try to start slideshow with demo image if no assets
        window.dispatchEvent(
          new CustomEvent('startDemoSlideshow', {
            detail: { demoImage: '/panda-demo-image.png' }
          })
        );
        break;
      case 'Image Editing':
        // Try to open image editing with demo image if no assets
        window.dispatchEvent(
          new CustomEvent('openImageEdit', {
            detail: { demoImage: '/panda-demo-image.png' }
          })
        );
        break;
      default:
        break;
    }
  };

  const latestFeatures = [
    {
      icon: <FaFolder className="text-blue-500" />,
      title: 'Asset Groups',
      description: userId
        ? 'Organize your assets into custom groups for better management'
        : 'Organize your assets into custom groups for better management (requires sign in)',
      clickable: true
    },
    {
      icon: <FaPlay className="text-green-500" />,
      title: 'Group Slideshows',
      description:
        'Create and share slideshows from asset groups - customize timing, direction, and looping',
      clickable: true
    },
    {
      icon: <FaImage className="text-purple-500" />,
      title: 'Image Editing',
      description: 'Edit your images directly with AI-powered modifications',
      clickable: true
    },
    {
      icon: <FaStar className="text-yellow-500" />,
      title: 'Gallery & Hearts',
      description: (
        <>
          Star your asset to add it to the{' '}
          <a
            href="/gallery"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            public gallery
          </a>
          . Heart your asset to be first to love it.
        </>
      )
    },
    {
      icon: <FaTrophy className="text-orange-500" />,
      title: 'Monthly Contest',
      description: (
        <>
          WIN 500 Credits EVERY MONTH for the most hearts in the{' '}
          <a
            href="/gallery"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            GenTube.ai gallery
          </a>
          . Next winner: June 30, 2025.
        </>
      )
    }
  ];

  return (
    <>
      {/* Info Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${className}`}
        title="App Info & Feedback"
        aria-label="Open app information and feedback panel"
      >
        <FaInfoCircle className="w-4 h-4" />
      </button>

      {/* Info Panel Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-4xl max-h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <FaInfoCircle className="text-blue-600 text-lg sm:text-xl" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  App Info & Feedback
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Close panel"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Latest Features */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  Latest Features
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {latestFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${
                        feature.clickable
                          ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'
                          : ''
                      }`}
                      onClick={
                        feature.clickable
                          ? () => handleFeatureClick(feature.title)
                          : undefined
                      }
                    >
                      <div className="flex-shrink-0 mt-0.5">{feature.icon}</div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-medium text-gray-900 dark:text-white text-sm sm:text-base ${
                            feature.clickable
                              ? 'text-blue-600 dark:text-blue-400'
                              : ''
                          }`}
                        >
                          {feature.title}
                          {feature.clickable && (
                            <FaExternalLinkAlt className="inline ml-1 w-3 h-3 opacity-60" />
                          )}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Section */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <FaPaperPlane className="text-blue-500" />
                  Share Your Feedback
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What is the one feature that would make you a subscriber for life? Share feature requests, bug reports, or general feedback... "
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {feedback.length}/1000 characters
                    </span>
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={!feedback.trim() || !userId || isSubmitting}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="w-3 h-3" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </div>
                  {submitMessage && (
                    <div
                      className={`text-xs sm:text-sm p-2 rounded ${
                        submitMessage.includes('Thank you')
                          ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20'
                          : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/20'
                      }`}
                    >
                      {submitMessage}
                    </div>
                  )}
                  {!userId && (
                    <div className="text-xs sm:text-sm text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/20 p-2 rounded">
                      Please sign in to submit feedback.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Your feedback helps us improve GenTube.ai • Thank you for being
                part of our community!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoPanel;
