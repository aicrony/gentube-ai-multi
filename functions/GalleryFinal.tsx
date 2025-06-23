'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  FaHeart,
  FaShare,
  FaExternalLinkAlt,
  FaCrown,
  FaTrophy,
  FaMedal,
  FaAward
} from 'react-icons/fa';
import { useUserId } from '@/context/UserIdContext';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import LoadingAnimation from '@/components/ui/LoadingAnimation';

interface GalleryItem {
  id?: string;
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
  UserId?: string | null;
  CreatorName?: string | null;
}

interface AssetLikeInfo {
  likesCount: number;
  isLiked: boolean;
}

interface GalleryFinalProps {
  forceEndedForTesting?: boolean;
}

const GalleryFinal: React.FC<GalleryFinalProps> = ({
  forceEndedForTesting = false
}) => {
  const [assets, setAssets] = useState<GalleryItem[]>([]);
  const [assetLikes, setAssetLikes] = useState<{
    [key: string]: AssetLikeInfo;
  }>({});
  const [isLiking, setIsLiking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);
  const userId = useUserId();
  const router = useRouter();

  // State for contest end
  const contestEndDate = new Date('2025-06-30T00:00:00');
  const [isContestEnded, setIsContestEnded] = useState(false);
  const [winningAssets, setWinningAssets] = useState<GalleryItem[]>([]);
  const [maxLikesCount, setMaxLikesCount] = useState(0);
  const [confettiKey, setConfettiKey] = useState(Date.now()); // Key for confetti animation reset

  // Regenerate confetti effect when manually clicked
  const resetConfetti = () => {
    setConfettiKey(Date.now());
  };

  // Use refs to track state across renders
  const dataFetchedOnce = useRef(false);

  // Fetch top gallery assets on component mount
  useEffect(() => {
    // Only fetch data once on initial mount
    if (!dataFetchedOnce.current) {
      const fetchInitialData = async () => {
        console.log('Initial data fetch on component mount');
        dataFetchedOnce.current = true;
        await fetchTopAssets();
      };

      fetchInitialData();
    }

    // Check if contest has ended
    const now = new Date();
    const hasEnded = forceEndedForTesting || now > contestEndDate;
    setIsContestEnded(hasEnded);
    console.log('Contest status check:', {
      now: now.toISOString(),
      contestEndDate: contestEndDate.toISOString(),
      hasEnded,
      forceEndedForTesting
    });

    // Set up auto-refresh every 60 seconds ONLY if contest is still active
    let refreshInterval: NodeJS.Timeout | null = null;
    if (!hasEnded) {
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing gallery assets (60s interval)');
        fetchTopAssets();
      }, 60000); // 60 seconds
    }

    // Clean up interval on component unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [forceEndedForTesting]);

  // Fetch asset likes for all assets
  useEffect(() => {
    const fetchAllLikes = async () => {
      if (!assets.length) return;

      try {
        const likesPromises = assets.map(async (asset) => {
          if (!asset.id) return null;

          const response = await fetch(
            `/api/getAssetLikes?assetId=${asset.id}${userId ? `&userId=${userId}` : ''}`
          );
          const likeInfo = await response.json();

          return { assetId: asset.id, likeInfo };
        });

        const likesResults = await Promise.all(likesPromises);

        const newAssetLikes = { ...assetLikes };
        likesResults.forEach((result) => {
          if (result && result.assetId) {
            newAssetLikes[result.assetId] = result.likeInfo;
          }
        });

        setAssetLikes(newAssetLikes);
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    fetchAllLikes();
  }, [assets, userId]);

  // Fetch top gallery assets
  const fetchTopAssets = async () => {
    console.log(
      'fetchTopAssets called - loading assets and determining winners'
    );
    setIsLoading(true);
    try {
      const response = await fetch('/api/getTopGalleryAssets');
      if (!response.ok) {
        throw new Error('Failed to fetch top gallery assets');
      }

      const data = await response.json();
      console.log(
        'Received assets data:',
        data.length > 0 ? `${data.length} assets` : 'no assets'
      );
      setAssets(data);

      // Always re-check contest end status for accurate winner determination
      const now = new Date();
      const hasEnded = forceEndedForTesting || now > contestEndDate;

      // Update the contest ended state if needed
      if (hasEnded !== isContestEnded) {
        console.log('Updating contest ended state to:', hasEnded);
        setIsContestEnded(hasEnded);
      }

      // If contest has ended, find the winning asset(s)
      console.log(
        'Checking for winners - hasEnded:',
        hasEnded,
        'forceEndedForTesting:',
        forceEndedForTesting,
        'data.length:',
        data.length
      );

      // Always create sample winning assets for testing when contest is ended
      if (forceEndedForTesting) {
        console.log('FORCING TEST WINNERS with data:', data);
        // Create dummy winners for testing if we have data
        if (data.length > 0) {
          // Use first asset as a winner for testing but get actual like count
          const testWinner = data[0];
          setWinningAssets([testWinner]);

          // Fetch actual likes count for the test winner
          if (testWinner.id) {
            const likeResponse = await fetch(
              `/api/getAssetLikes?assetId=${testWinner.id}`
            );
            const likeInfo = await likeResponse.json();
            setMaxLikesCount(likeInfo.likesCount || 0);
            console.log(
              `Using actual like count for test winner: ${likeInfo.likesCount || 0}`
            );
          } else {
            setMaxLikesCount(0);
          }
        }
      } else if (hasEnded && data.length > 0) {
        // First we need to get the likes count for all assets
        const likesPromises = data.map(async (asset: GalleryItem) => {
          if (!asset.id) return { asset, likesCount: 0 };

          const response = await fetch(
            `/api/getAssetLikes?assetId=${asset.id}`
          );
          const likeInfo = await response.json();

          return {
            asset,
            likesCount: likeInfo.likesCount || 0
          };
        });

        const assetsWithLikes = await Promise.all(likesPromises);

        // Find the maximum likes count
        const likesValues = assetsWithLikes.map((item) => item.likesCount);
        console.log('Like values for all assets:', likesValues);
        const maxLikes = Math.max(...likesValues);
        setMaxLikesCount(maxLikes);

        // Find all assets with the maximum likes count (handles ties)
        const winners = assetsWithLikes
          .filter((item) => item.likesCount === maxLikes)
          .map((item) => item.asset);

        setWinningAssets(winners);
        console.log(
          `Contest ended. Found ${winners.length} winner(s) with ${maxLikes} hearts.`
        );
      }
    } catch (error) {
      console.error('Error fetching top gallery assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refreshing the gallery
  const handleRefresh = async () => {
    console.log('Manual refresh requested by user');
    setIsRefreshing(true);
    await fetchTopAssets();
    setIsRefreshing(false);
  };

  // Handle toggling like/unlike
  const handleToggleLike = async (asset: GalleryItem) => {
    if (!asset.id) return;

    // Always check current contest status before allowing votes
    const now = new Date();
    const hasEnded =
      forceEndedForTesting || now > contestEndDate || isContestEnded;

    // If contest has ended, don't allow new votes
    if (hasEnded) {
      console.log('Voting has ended! The contest is complete.');
      alert('Voting has ended! The contest is complete.');
      return;
    }

    // If user is not logged in, redirect to sign in page
    if (!userId) {
      router.push('/signin');
      return;
    }

    try {
      setIsLiking(true);
      const assetId = asset.id;
      const currentLikeInfo = assetLikes[assetId] || {
        likesCount: 0,
        isLiked: false
      };
      const action = currentLikeInfo.isLiked ? 'unlike' : 'like';

      const response = await fetch('/api/toggleAssetLike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          assetId,
          action
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update the local state with the new like info
        setAssetLikes({
          ...assetLikes,
          [assetId]: {
            likesCount: result.likesCount,
            isLiked: result.isLiked
          }
        });

        // If we just liked or unliked, refresh the gallery to ensure proper ordering
        if (!isRefreshing) {
          handleRefresh();
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle sharing an asset
  const handleShareUrl = (asset: GalleryItem) => {
    if (!asset.id) return;

    // Create a URL that links directly to the gallery with this item
    const shareUrl = `${window.location.origin}/gallery?id=${asset.id}`;

    // Copy to clipboard with a custom message
    handleCopy(shareUrl, 'Share URL copied to clipboard!');
  };

  // Generic function to handle copying text to the clipboard with a notification
  const handleCopy = (
    text: string,
    message: string = 'Copied to clipboard!'
  ) => {
    navigator.clipboard.writeText(text);

    // Use a more user-friendly notification instead of an alert
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';

    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);

    // Fade out and remove after 2 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  // Handle opening the modal
  const openModal = (index: number) => {
    setCurrentModalIndex(index);

    if (isContestEnded) {
      setModalMediaUrl(winningAssets[index].CreatedAssetUrl);
    } else {
      setModalMediaUrl(assets[index].CreatedAssetUrl);
    }

    setIsModalOpen(true);
  };

  // Handle navigating to the next item in modal
  const handleNextInModal = () => {
    const nextIndex = currentModalIndex + 1;
    setCurrentModalIndex(nextIndex);

    if (isContestEnded) {
      if (nextIndex < winningAssets.length) {
        setModalMediaUrl(winningAssets[nextIndex].CreatedAssetUrl);
      }
    } else {
      if (nextIndex < assets.length) {
        setModalMediaUrl(assets[nextIndex].CreatedAssetUrl);
      }
    }
  };

  // Handle navigating to the previous item in modal
  const handlePreviousInModal = () => {
    const prevIndex = currentModalIndex - 1;
    setCurrentModalIndex(prevIndex);

    if (isContestEnded) {
      if (prevIndex >= 0) {
        setModalMediaUrl(winningAssets[prevIndex].CreatedAssetUrl);
      }
    } else {
      if (prevIndex >= 0) {
        setModalMediaUrl(assets[prevIndex].CreatedAssetUrl);
      }
    }
  };

  // Handle closing the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalMediaUrl('');
  };

  // Handle downloading the current media
  const handleDownload = async (url: string, isVideo: boolean) => {
    try {
      // Determine file extension based on media type
      const fileExtension = isVideo ? '.mp4' : '.jpg';
      const fileName = `gentube-download${fileExtension}`;

      // Fetch the file as a blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Create an object URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;

      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading media:', error);
      alert('Failed to download the media');
    }
  };

  // Track if we've already tried a retry for winners
  const hasTriedWinnerRetry = useRef(false);

  // Only try one retry for contest-ended mode if needed
  useEffect(() => {
    // Re-check contest end status every time this effect runs
    const now = new Date();
    const hasEnded = forceEndedForTesting || now > contestEndDate;

    if (
      (hasEnded || isContestEnded) &&
      assets.length > 0 &&
      winningAssets.length === 0 &&
      !hasTriedWinnerRetry.current
    ) {
      console.log('Contest ended but no winners yet - trying one final fetch');
      hasTriedWinnerRetry.current = true;
      fetchTopAssets();
    }
  }, [
    isContestEnded,
    forceEndedForTesting,
    assets.length,
    winningAssets.length,
    contestEndDate
  ]);

  // Show loading animation while fetching assets
  if (isLoading) {
    return (
      <LoadingAnimation
        size="large"
        message={
          isContestEnded || forceEndedForTesting
            ? 'And the winner is...'
            : 'Loading top gallery assets...'
        }
        fullScreen={false}
      />
    );
  }

  console.log('Rendering GalleryFinal with:', {
    isContestEnded,
    winningAssetsCount: winningAssets.length,
    assetsCount: assets.length
  });

  return (
    <div>
      {/* Add confetti animation styles */}
      <style jsx global>{`
        @keyframes confetti-explosion {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx, 0px), var(--ty, 0px))
              rotate(var(--r, 0deg));
            opacity: 0;
          }
        }

        .confetti-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          overflow: visible;
          z-index: 0;
        }

        .confetti {
          position: absolute;
          left: 0;
          top: 0;
          transform: translate(-50%, -50%);
          animation: confetti-explosion 2.5s ease-out forwards;
          z-index: 1;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      <h1 className="text-center text-2xl font-bold pt-5 mb-4">
        GenTube.ai Contest Gallery
      </h1>

      {/* Contest Status Message - evaluate contest end directly to ensure consistency */}
      <div className="text-center mb-6">
        {isContestEnded ||
        forceEndedForTesting ||
        new Date() > contestEndDate ? (
          <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-lg max-w-3xl mx-auto relative overflow-hidden">
            {/* One-time confetti explosion animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div key={confettiKey} className="confetti-container">
                {Array.from({ length: 150 }).map((_, i) => {
                  const hue = Math.random() * 360;
                  const size = Math.random() * 0.8 + 0.2;
                  // Shapes: 0 = square, 1 = circle, 2 = triangle
                  const shape = Math.floor(Math.random() * 3);

                  let style = {
                    '--tx': `${(Math.random() - 0.5) * 300}px`,
                    '--ty': `${(Math.random() - 0.5) * 300}px`,
                    '--r': `${Math.random() * 1080}deg`,
                    backgroundColor: `hsl(${hue}, 100%, 50%)`,
                    width: `${size}rem`,
                    height: `${size}rem`,
                    animationDelay: `${Math.random() * 0.3}s`
                  } as React.CSSProperties;

                  // Add specific styles for different shapes
                  if (shape === 1) {
                    style.borderRadius = '50%'; // Circle
                  } else if (shape === 2) {
                    style.backgroundColor = 'transparent';
                    style.borderBottom = `${size}rem solid hsl(${hue}, 100%, 50%)`;
                    style.borderLeft = `${size / 2}rem solid transparent`;
                    style.borderRight = `${size / 2}rem solid transparent`;
                    style.height = 0;
                  }

                  return <div key={i} className="confetti" style={style} />;
                })}
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <FaTrophy className="text-yellow-500 text-5xl animate-bounce" />
            </div>

            <h2
              className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4 relative cursor-pointer"
              onClick={resetConfetti} // Reset confetti animation on click
              title="Click for more confetti!"
            >
              <span className="relative inline-block">
                Contest Ended!
                <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></span>
              </span>
            </h2>

            <p className="mb-4 text-lg">
              Thank you to everyone who participated in our creative contest.
            </p>

            {winningAssets.length > 0 && (
              <div className="animate-fadeIn">
                {winningAssets.length === 1 ? (
                  <div className="py-3 px-4 bg-white/30 dark:bg-black/30 rounded-lg shadow-inner">
                    <div className="flex justify-center items-center mb-2">
                      <FaCrown className="text-yellow-500 text-2xl mr-2 animate-pulse" />
                      <h3 className="text-xl font-bold">Winner!</h3>
                      <FaCrown className="text-yellow-500 text-2xl ml-2 animate-pulse" />
                    </div>
                    <p className="font-medium text-lg">
                      Congratulations to{' '}
                      <span className="text-blue-600 dark:text-blue-300 font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                        {winningAssets[0].CreatorName || 'Anonymous'}
                      </span>{' '}
                      for winning with{' '}
                      <span className="inline-flex items-center font-bold">
                        {maxLikesCount}{' '}
                        <FaHeart className="ml-1 text-red-500" />
                      </span>
                      !
                    </p>
                  </div>
                ) : (
                  <div className="py-3 px-4 bg-white/30 dark:bg-black/30 rounded-lg shadow-inner">
                    <div className="flex justify-center items-center mb-2">
                      <FaMedal className="text-yellow-500 text-2xl mr-2" />
                      <h3 className="text-xl font-bold">We have a tie!</h3>
                      <FaMedal className="text-yellow-500 text-2xl ml-2" />
                    </div>
                    <p className="font-medium mb-2 text-lg">
                      {winningAssets.length}-way tie! Congratulations to all
                      winners with{' '}
                      <span className="inline-flex items-center font-bold">
                        {maxLikesCount}{' '}
                        <FaHeart className="ml-1 text-red-500" />
                      </span>
                      !
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {winningAssets.map((asset, idx) => (
                        <span
                          key={idx}
                          className="text-blue-600 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-full flex items-center"
                        >
                          <FaAward className="mr-1 text-yellow-500" />
                          {asset.CreatorName || 'Anonymous'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Contest In Progress!
            </h2>
            <p>
              Vote for your favorite creations by clicking the heart icon.
              Contest ends on June 30, 2025.
            </p>
            <p className="font-medium mt-2">The winner gets 500 Credits!</p>
          </div>
        )}
      </div>

      {/* Refresh button - only show during active contest */}
      {!(
        isContestEnded ||
        forceEndedForTesting ||
        new Date() > contestEndDate
      ) && (
        <div className="text-center mb-4">
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-500 hover:text-blue-700 underline"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-primary rounded-full mr-2"></div>
                Refreshing...
              </span>
            ) : (
              'Refresh Gallery'
            )}
          </button>
          <span className="text-xs text-gray-500 ml-2">
            (Showing top 10 assets by hearts)
          </span>
        </div>
      )}

      {/* Asset Grid - evaluate contest end directly to ensure consistency */}
      {assets.length > 0 ? (
        isContestEnded ||
        forceEndedForTesting ||
        new Date() > contestEndDate ? (
          /* Contest ended display - show only winning assets */
          <div
            className={`flex ${winningAssets.length > 1 ? 'flex-row flex-wrap justify-center' : 'justify-center'} gap-4 max-w-6xl mx-auto px-4`}
          >
            {winningAssets.map((asset, index) => (
              <div
                key={index}
                className={`relative rounded-lg overflow-hidden ${winningAssets.length === 1 ? 'w-full max-w-2xl' : 'w-full sm:w-80'}`}
              >
                {/* Winner badge with glow effect */}
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className="bg-yellow-500 text-white font-bold rounded-full px-3 py-1 text-sm shadow-lg animate-pulse"
                    style={{
                      boxShadow:
                        '0 0 15px rgba(234, 179, 8, 0.8), 0 0 30px rgba(234, 179, 8, 0.6), 0 0 45px rgba(234, 179, 8, 0.4)'
                    }}
                  >
                    {winningAssets.length > 1 ? 'Co-Winner!' : 'Winner!'}
                  </div>
                </div>

                {/* Hearts count badge with highlight */}
                <div className="absolute top-2 right-2 z-10">
                  <div
                    className="flex items-center bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full px-3 py-1 text-sm shadow-lg animate-pulse"
                    style={{
                      boxShadow:
                        '0 0 10px rgba(239, 68, 68, 0.7), 0 0 20px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <span className="mr-1 font-bold">{maxLikesCount}</span>
                    <FaHeart className="text-white" />
                  </div>
                </div>

                {/* Asset display */}
                <div
                  className={`${winningAssets.length === 1 ? 'aspect-video' : 'aspect-square'} bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden shadow-inner`}
                  style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.1)' }}
                >
                  <img
                    src={asset.CreatedAssetUrl}
                    alt={`Winning asset by ${asset.CreatorName || 'Anonymous'}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Asset details */}
                <div className="p-5 bg-white dark:bg-gray-800 border-t-4 border-yellow-500">
                  {/* Creator name with trophy icon */}
                  <div className="flex items-center justify-center mb-3">
                    <FaTrophy className="text-yellow-500 mr-2" />
                    <p className="text-lg font-bold">
                      By: {asset.CreatorName || 'Anonymous'}
                    </p>
                  </div>

                  {/* Prompt with decorative border */}
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
                    <p className="font-medium text-sm mb-1">Winning Prompt:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                      "{asset.Prompt}"
                    </p>
                  </div>

                  {/* Action buttons with gradient */}
                  <div className="flex justify-center mt-5 gap-4">
                    <button
                      onClick={() => openModal(winningAssets.indexOf(asset))}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-3 focus:outline-none transition-all shadow-lg transform hover:scale-105"
                      title="View fullscreen"
                    >
                      <FaExternalLinkAlt />
                    </button>

                    <button
                      onClick={() => handleShareUrl(asset)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full p-3 focus:outline-none transition-all shadow-lg transform hover:scale-105"
                      title="Share this winner"
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Normal display during contest */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-6xl mx-auto px-4">
            {assets.map((asset, index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden transition-transform duration-200 hover:scale-[0.98]"
              >
                {/* Status indicators */}
                <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 z-10">
                  {/* Asset Type Badge */}
                  <div className="bg-gray-800 bg-opacity-70 text-white rounded-full px-2 py-0.5 text-xs">
                    {asset.AssetType === 'vid' ? 'Video' : 'Image'}
                  </div>

                  {/* Hearts Count */}
                  {asset.id && assetLikes[asset.id]?.likesCount > 0 && (
                    <div className="flex items-center bg-gray-800 bg-opacity-70 text-white rounded-full px-2 py-0.5 text-xs">
                      <span className="mr-1">
                        {assetLikes[asset.id]?.likesCount}
                      </span>
                      <FaHeart className="text-red-500 text-xs" />
                    </div>
                  )}
                </div>

                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={asset.CreatedAssetUrl}
                    alt={`Gallery asset ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 opacity-0 hover:bg-opacity-70 hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                  {/* Prompt display */}
                  <div className="overflow-auto max-h-[60%] scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent text-white text-sm">
                    <div>
                      <p className="font-medium mb-1">Prompt:</p>
                      <p className="text-sm text-gray-200 break-words">
                        {asset.Prompt.length > 100
                          ? `${asset.Prompt.substring(0, 100)}...`
                          : asset.Prompt}
                      </p>
                    </div>
                    {/* Creator name */}
                    <p className="text-sm text-gray-400 mt-2">
                      By: {asset.CreatorName || 'Anonymous'}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {/* Fullscreen button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(index);
                      }}
                      className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                      title="View fullscreen"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                    </button>

                    {/* Share button */}
                    {asset.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareUrl(asset);
                        }}
                        className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                        title="Share"
                      >
                        <FaShare className="text-xs" />
                      </button>
                    )}

                    {/* Heart/Like button */}
                    {asset.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(asset);
                        }}
                        disabled={isLiking || isContestEnded}
                        className={`bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 ${
                          assetLikes[asset.id]?.isLiked
                            ? 'text-red-500'
                            : 'text-white'
                        } focus:outline-none transition-all shadow-md ${
                          isContestEnded ? 'cursor-not-allowed opacity-70' : ''
                        }`}
                        title={
                          isContestEnded
                            ? 'Voting has ended'
                            : assetLikes[asset.id]?.isLiked
                              ? 'Unlike'
                              : 'Like'
                        }
                      >
                        <FaHeart
                          className={`text-xs ${isLiking ? 'animate-pulse' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No gallery assets found.</p>
        </div>
      )}

      {/* Modal for viewing assets */}
      {isModalOpen && (
        <Modal
          mediaUrl={modalMediaUrl}
          onClose={closeModal}
          fullScreen={isFullScreenModal}
          onNext={
            isContestEnded
              ? winningAssets.length > 1 &&
                currentModalIndex < winningAssets.length - 1
                ? handleNextInModal
                : undefined
              : currentModalIndex < assets.length - 1
                ? handleNextInModal
                : undefined
          }
          onPrevious={
            isContestEnded
              ? winningAssets.length > 1 && currentModalIndex > 0
                ? handlePreviousInModal
                : undefined
              : currentModalIndex > 0
                ? handlePreviousInModal
                : undefined
          }
          hasNext={
            isContestEnded
              ? winningAssets.length > 1 &&
                currentModalIndex < winningAssets.length - 1
              : currentModalIndex < assets.length - 1
          }
          hasPrevious={
            isContestEnded
              ? winningAssets.length > 1 && currentModalIndex > 0
              : currentModalIndex > 0
          }
          onLike={
            isContestEnded
              ? undefined
              : () => handleToggleLike(assets[currentModalIndex])
          }
          isLiked={
            isContestEnded
              ? false
              : assets[currentModalIndex]?.id
                ? assetLikes[assets[currentModalIndex].id]?.isLiked
                : false
          }
          likesCount={
            isContestEnded
              ? maxLikesCount
              : assets[currentModalIndex]?.id
                ? assetLikes[assets[currentModalIndex].id]?.likesCount || 0
                : 0
          }
          showLikeButton={!isContestEnded}
          currentItemId={
            isContestEnded
              ? winningAssets[currentModalIndex]?.id
              : assets[currentModalIndex]?.id
          }
          onShare={() =>
            isContestEnded
              ? handleShareUrl(winningAssets[currentModalIndex])
              : handleShareUrl(assets[currentModalIndex])
          }
          showShareButton={true}
        />
      )}
    </div>
  );
};

export default GalleryFinal;
