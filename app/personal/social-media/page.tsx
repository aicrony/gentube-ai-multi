'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUserCredits,
  UserCreditsProvider
} from '@/context/UserCreditsContext';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { SocialMediaImageButton } from '@/components/dynamic/social-media-image-button';
import '@/styles/main.css';
import MyAssets from '@/components/dynamic/my-assets';
import Button from '@/components/ui/Button';
import { SocialMediaPostCreator } from '@/components/dynamic/social-media-post-creator';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaTiktok,
  FaPinterest,
  FaLinkedin,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa';
import { StyleItem, EffectItem, styles, effects } from '@/constants';
import PricingBadge from '@/components/ui/Pricing/PricingBadge';

interface UserAsset {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType?: string | string[] | undefined;
  DateTime: Date;
}

function SocialMediaContent() {
  const [error, setError] = useState<string | null>(null);
  const { userCreditsResponse, setUserCreditsResponse } = useUserCredits();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userIp, setUserIp] = useState<string>('127.0.0.1');
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openSteps, setOpenSteps] = useState<{ [key: number]: boolean }>({
    1: true,
    2: false,
    3: false,
    4: false
  });
  const [credits, setCredits] = useState<number | null>(null);
  const [imageGenerated, setImageGenerated] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);

  const imageGenerationRef = React.useRef<HTMLDivElement>(null);

  // Using styles and effects imported from constants

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        router.push('/signin');
      }
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        if (!userId || userIp === 'unknown') return;

        const response = await fetch(
          `/api/getUserCredits?userId=${userId}&userIp=${userIp}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch user credits');
        }
        const data = await response.json();
        setCredits(data.credits);
        if (setUserCreditsResponse) {
          setUserCreditsResponse(data.credits);
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    };

    if (userId && userIp !== 'unknown') {
      fetchCredits();
    }
  }, [userId, userIp, setUserCreditsResponse]);

  // Handle style and effect selection
  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) => {
      if (prev.includes(styleId)) {
        return prev.filter((id) => id !== styleId);
      } else {
        return [...prev, styleId];
      }
    });
  };

  const toggleEffect = (effectId: string) => {
    setSelectedEffects((prev) => {
      if (prev.includes(effectId)) {
        return prev.filter((id) => id !== effectId);
      } else {
        return [...prev, effectId];
      }
    });
  };

  // Handle custom prompt input
  const handleCustomPromptChange = (text: string) => {
    setCustomPrompt(text);
  };

  // Build the full prompt when styles or effects change
  useEffect(() => {
    let basePrompt = customPrompt;

    // Add selected styles
    const styleTexts: string[] = [];
    selectedStyles.forEach((styleId) => {
      const style = styles.find((s) => s.id === styleId);
      if (style) styleTexts.push(style.desc);
    });

    // Add selected effects
    const effectTexts: string[] = [];
    selectedEffects.forEach((effectId) => {
      const effect = effects.find((e) => e.id === effectId);
      if (effect) effectTexts.push(effect.desc);
    });

    // Add to input field - this will be handled by the ImageDynamicButton component
    const stylesAndEffects = [...styleTexts, ...effectTexts].join(', ');

    // For display purpose only - not directly setting the input field
    console.log(
      `Full prompt would be: ${basePrompt}${stylesAndEffects ? ', ' + stylesAndEffects : ''}`
    );
  }, [customPrompt, selectedStyles, selectedEffects]);

  const handleUserCreditsUpdate = (newCredits: number | null) => {
    console.log('Credits updated:', newCredits);
    setImageGenerated(true);
    // After image generation is complete, expand steps 3 and 4
    setOpenSteps((prev) => ({ ...prev, 3: true, 4: true }));
  };

  const toggleStep = (stepNumber: number) => {
    setOpenSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const handleSocialLogin = (platform: string) => {
    // This would normally redirect to the platform's OAuth login
    alert(`Redirecting to ${platform} login...`);
    // In a real app, you would implement OAuth
  };

  return (
    <div className="steps-container py-8 pt-4">
      <div className="mb-8 text-center">
        <div className="relative inline-block">
          <h1 className="text-3xl font-bold mb-2 pr-6">
            <Link href="/personal" className="back-button">
              ←
            </Link>
            Share Social Post
          </h1>
          <PricingBadge label="Coming Soon!" />
        </div>
        <p className="text-lg">
          Create stunning images to share on your favorite platforms
        </p>
        <p className="mt-2">
          {credits !== null
            ? `Available credits: ${credits}`
            : 'Loading credits...'}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/*<div*/}
      {/*  className="p-6 rounded-lg mb-8"*/}
      {/*  style={{ backgroundColor: 'var(--secondary-color)' }}*/}
      {/*>*/}
      {/*  <button*/}
      {/*    onClick={() => toggleStep(1)}*/}
      {/*    className="w-full text-left flex justify-between items-center"*/}
      {/*  >*/}
      {/*    <h2 className="text-xl font-bold">*/}
      {/*      Step 1: Choose Your Platform (optional)*/}
      {/*    </h2>*/}
      {/*    <span className="flex items-center justify-center w-8 h-8">*/}
      {/*      {openSteps[1] ? (*/}
      {/*        <FaChevronDown size={18} />*/}
      {/*      ) : (*/}
      {/*        <FaChevronRight size={18} />*/}
      {/*      )}*/}
      {/*    </span>*/}
      {/*  </button>*/}

      {/*  {openSteps[1] && (*/}
      {/*    <div className="mt-4">*/}
      {/*      <p className="mb-4">*/}
      {/*        Select the platform where you'll share your image:*/}
      {/*      </p>*/}
      {/*      <div className="flex flex-wrap gap-3 justify-center">*/}
      {/*        <Button*/}
      {/*          className="flex items-center gap-2 px-4"*/}
      {/*          onClick={() => handleSocialLogin('Facebook')}*/}
      {/*        >*/}
      {/*          <FaFacebook size={20} /> Facebook*/}
      {/*        </Button>*/}
      {/*        <Button*/}
      {/*          className="flex items-center gap-2 px-4"*/}
      {/*          onClick={() => handleSocialLogin('Instagram')}*/}
      {/*        >*/}
      {/*          <FaInstagram size={20} /> Instagram*/}
      {/*        </Button>*/}
      {/*        <Button*/}
      {/*          className="flex items-center gap-2 px-4"*/}
      {/*          onClick={() => handleSocialLogin('Twitter')}*/}
      {/*        >*/}
      {/*          <FaTwitter size={20} /> X (Twitter)*/}
      {/*        </Button>*/}
      {/*        <Button*/}
      {/*          className="flex items-center gap-2 px-4"*/}
      {/*          onClick={() => handleSocialLogin('TikTok')}*/}
      {/*        >*/}
      {/*          <FaTiktok size={20} /> TikTok*/}
      {/*        </Button>*/}
      {/*        <Button*/}
      {/*          className="flex items-center gap-2 px-4"*/}
      {/*          onClick={() => handleSocialLogin('Pinterest')}*/}
      {/*        >*/}
      {/*          <FaPinterest size={20} /> Pinterest*/}
      {/*        </Button>*/}
      {/*        <Button*/}
      {/*          className="flex items-center gap-2 px-4"*/}
      {/*          onClick={() => handleSocialLogin('LinkedIn')}*/}
      {/*        >*/}
      {/*          <FaLinkedin size={20} /> LinkedIn*/}
      {/*        </Button>*/}
      {/*      </div>*/}
      {/*      <p className="mt-4 text-sm text-center text-gray-500">*/}
      {/*        Login is optional. You can still create images without logging in*/}
      {/*        to these platforms.*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  )}*/}
      {/*</div>*/}

      <div
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'var(--secondary-color)' }}
      >
        <button
          onClick={() => toggleStep(1)}
          className="w-full text-left flex justify-between items-center"
        >
          <h2 className="text-xl font-bold">Step 1: Design Your Image</h2>
          <span className="flex items-center justify-center w-8 h-8">
            {openSteps[1] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[1] && (
          <div className="mt-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Choose Style:</h3>
              <div className="flex flex-wrap gap-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      selectedStyles.includes(style.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Choose Effects:</h3>
              <div className="flex flex-wrap gap-2">
                {effects.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => toggleEffect(effect.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      selectedEffects.includes(effect.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {effect.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6" ref={imageGenerationRef}>
              {userId && (
                <SocialMediaImageButton
                  userId={userId}
                  userIp={userIp}
                  onUserCreditsUpdate={handleUserCreditsUpdate}
                  selectedStyles={selectedStyles}
                  selectedEffects={selectedEffects}
                  styleItems={styles}
                  effectItems={effects}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'var(--secondary-color)' }}
      >
        <button
          onClick={() => toggleStep(2)}
          className="w-full text-left flex justify-between items-center"
        >
          <h2 className="text-xl font-bold">Step 2: Refresh Your Assets</h2>
          <span className="flex items-center justify-center w-8 h-8">
            {openSteps[2] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[2] && (
          <div className="mt-4">
            <MyAssets autoRefreshQueued={true} />
          </div>
        )}
      </div>

      <div
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'var(--secondary-color)' }}
      >
        <button
          onClick={() => toggleStep(3)}
          className="w-full text-left flex justify-between items-center"
        >
          <h2 className="text-xl font-bold">Step 3: Share Social Post</h2>
          <span className="flex items-center justify-center w-8 h-8">
            {openSteps[4] ? (
              <FaChevronDown size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </span>
        </button>

        {openSteps[3] && userId && (
          <div className="mt-4">
            <SocialMediaPostCreator userId={userId} userIp={userIp} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SocialMediaPage() {
  return (
    <UserCreditsProvider>
      <SocialMediaContent />
    </UserCreditsProvider>
  );
}
