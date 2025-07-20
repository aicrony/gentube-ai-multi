// app/about/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUserId } from '@/context/UserIdContext';
import Button from '@/components/ui/Button';
import StartPageWrapper from '@/app/StartPageWrapper';

function AboutPageContent() {
  const userId = useUserId();

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Hero Section */}
      <section
        className="py-20 px-4"
        style={{
          background:
            'linear-gradient(to bottom, var(--highlight-bg), var(--background-color))'
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl mb-6">
                GenTube.ai
              </h1>
              <h2 className="text-2xl sm:text-center sm:text-4xl font-extrabold mb-6">
                Generate AI Images and Videos
              </h2>
              <p className="text-xl mb-8">
                Gentube.ai turns complex AI image and video creation into simple
                workflows, helping you accelerate your projects.
              </p>
              <p className="text-xl mb-8">
                Our workflows guide you to faster and simpler AI image and video
                creation to help you find creative success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={userId !== 'none' ? "/start" : "/signin?view=signup"}>
                  <Button variant="slim" className="btn-red">
                    Guide Me Now
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="slim" className="px-8 py-3 text-lg">
                    See Pricing
                  </Button>
                </Link>
                <Link href={userId !== 'none' ? "/start" : "/signin?view=signup"}>
                  <Button variant="slim" className="px-8 py-3 text-lg">
                    Try It Out
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button
                    variant="slim"
                    className="px-8 py-3 text-lg rainbow-button"
                  >
                    Win Credits
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div
                className="relative h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1rem 2rem var(--shadow-color)' }}
              >
                {/*<Image*/}
                {/*  src="/demo.png"*/}
                {/*  alt="GenTube.ai Demo"*/}
                {/*  fill*/}
                {/*  style={{ objectFit: 'cover' }}*/}
                {/*  quality={90}*/}
                {/*/>*/}
                <div
                  className="relative h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden"
                  style={{ boxShadow: '0 1rem 2rem var(--shadow-color)' }}
                >
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source
                      src="https://storage.googleapis.com/gen-video-storage/GenTubeIntro_SD_480p.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Choose Your Workflow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className="flex flex-col items-center text-center p-6 rounded-lg transition duration-300"
              style={{
                backgroundColor: 'var(--card-bg-color)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                boxShadow: '0 4px 6px var(--shadow-color)'
              }}
            >
              <h3 className="text-2xl font-semibold mb-4">Free Flows</h3>
              <p className="text-left mb-6">
                For advanced users who want direct access to all tools without
                guided workflows for maximum flexibility.
              </p>
              <ul className="text-left space-y-2 mb-6 w-full">
                <li>✓ Community gallery sharing and liking</li>
                <li>✓ Direct image and video generation</li>
                <li>✓ Generate video from URL or text</li>
                <li>✓ Custom image upload</li>
              </ul>
              <Link href="/" className="mt-auto">
                <Button variant="slim" className="w-full">
                  Explore Free Flow
                </Button>
              </Link>
            </div>

            <div
              className="flex flex-col items-center text-center p-6 rounded-lg transition duration-300"
              style={{
                backgroundColor: 'var(--card-bg-color)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                boxShadow: '0 4px 6px var(--shadow-color)'
              }}
            >
              <h3 className="text-2xl font-semibold mb-4">
                Personal Workflows
              </h3>
              <p className="text-left mb-6">
                Perfect for content creators, social media enthusiasts, and
                anyone looking to create stunning visuals for personal projects.
              </p>
              <ul className="text-left space-y-2 mb-6 w-full">
                <li>✓ Make old photos move (animate)</li>
                <li>✓ Generate images and post to social</li>
                <li>✓ Create story videos</li>
                <li>✓ Download and manage your assets</li>
              </ul>
              <Link href="/personal" className="mt-auto">
                <Button variant="slim" className="w-full">
                  Explore Personal
                </Button>
              </Link>
            </div>

            <div
              className="flex flex-col items-center text-center p-6 rounded-lg transition duration-300"
              style={{
                backgroundColor: 'var(--card-bg-color)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                boxShadow: '0 4px 6px var(--shadow-color)'
              }}
            >
              <h3 className="text-2xl font-semibold mb-4">
                Business Workflows
              </h3>
              <p className="text-left mb-6">
                Tailored for marketing teams, small businesses, and
                entrepreneurs who need professional-grade visual content.
              </p>
              <ul className="text-left space-y-2 mb-6 w-full">
                <li>✓ Brand image generation</li>
                <li>✓ Layer or combine product images</li>
                <li>✓ Product and brand videos</li>
                <li>✓ Logo and meme creation</li>
                <li>✓ Animate still images</li>
                <li>✓ Post to social media</li>
              </ul>
              <Link href="/business" className="mt-auto">
                <Button variant="slim" className="w-full">
                  Explore Business
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-16 px-4"
        style={{ backgroundColor: 'var(--section-alt-bg)' }}
      >
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6"
                style={{
                  backgroundColor: 'var(--step-bg)',
                  color: 'var(--step-text)'
                }}
              >
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Choose Your Workflow
              </h3>
              <p>
                Select the type of workflow that you want to use: Personal,
                Business, or Free Flow mode.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6"
                style={{
                  backgroundColor: 'var(--step-bg)',
                  color: 'var(--step-text)'
                }}
              >
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Describe Your Vision
              </h3>
              <p>
                Enter a text prompt, upload an image, or provide a URL to get
                started.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6"
                style={{
                  backgroundColor: 'var(--step-bg)',
                  color: 'var(--step-text)'
                }}
              >
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Generate & Download
              </h3>
              <p>
                Our AI creates your content in seconds. Preview, refine, and
                download when satisfied.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Purchase credits as you need them or subscribe to a plan for regular
            content creation.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div
              className="flex flex-col p-8 rounded-xl"
              style={{
                backgroundColor: 'var(--card-bg-color)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                boxShadow: '0 8px 16px var(--shadow-color)'
              }}
            >
              <h3 className="text-2xl font-bold mb-4">Free Trial</h3>
              <p className="text-4xl font-bold mb-6">
                {process.env.NEXT_PUBLIC_FREE_CREDITS_VALUE || '29'} Credits
              </p>
              <ul className="text-left space-y-2 mb-8">
                <li>✓ One-time offer for new users</li>
                <li>✓ Create multiple images</li>
                <li>✓ Access to all features</li>
              </ul>
              <Link href={userId ? '/start' : '/signin'} className="mt-auto">
                <Button variant="slim" className="w-full">
                  {userId ? 'Get Started' : 'Sign Up Now'}
                </Button>
              </Link>
            </div>

            <div
              className="flex flex-col p-8 rounded-xl"
              style={{
                backgroundColor: 'var(--card-bg-color)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                boxShadow: '0 8px 16px var(--shadow-color)'
              }}
            >
              <h3 className="text-2xl font-bold mb-4">Subscribe and Save</h3>
              <p className="text-4xl font-bold mb-6">From $9</p>
              <ul className="text-left space-y-2 mb-8">
                <li>✓ Choose Personal or Business Plans</li>
                <li>✓ Monthly renewable credits</li>
                <li>✓ Full plan features</li>
              </ul>
              <Link href="/pricing" className="mt-auto">
                <Button variant="slim" className="w-full">
                  View Packages
                </Button>
              </Link>
            </div>

            <div
              className="flex flex-col p-8 rounded-xl"
              style={{
                backgroundColor: 'var(--card-bg-color)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                boxShadow: '0 8px 16px var(--shadow-color)'
              }}
            >
              <h3 className="text-2xl font-bold mb-4">Pay As You Go</h3>
              <p className="text-4xl font-bold mb-6">From $10</p>
              <ul className="text-left space-y-2 mb-8">
                <li>✓ Purchase credits as needed</li>
                <li>✓ No subscription required</li>
                <li>✓ Available under any plan</li>
              </ul>
              <Link href="/pricing?tab=one-time" className="mt-auto">
                <Button variant="slim" className="w-full">
                  View Packages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-16 px-4"
        style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Amazing Content?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of creators using GenTube.ai to bring their ideas to
            life.
          </p>
          <Link href={userId !== 'none' ? "/start" : "/signin?view=signup"}>
            <Button
              variant="slim"
              className="px-8 py-3 text-lg"
              style={{
                backgroundColor: 'var(--background-color)',
                color: 'var(--primary-color)'
              }}
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function AboutPage() {
  return (
    <StartPageWrapper>
      <AboutPageContent />
    </StartPageWrapper>
  );
}
