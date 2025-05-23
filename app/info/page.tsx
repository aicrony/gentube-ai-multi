'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserCreditsProvider } from '@/context/UserCreditsContext';

export default function InfoPage() {
  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl mb-6">
                More Info on GenTube.ai
              </h1>
              <p className="text-xl mb-8">
                Transforming imagination into stunning visuals and videos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Mission Statement</h2>
                <p className="mb-4">
                  Gentube.ai’s mission is to deliver innovative AI-driven image
                  and video solutions, empowering users to create, share, and
                  monetize high-quality slideshows, short films, commercials,
                  and feature-length films with limitless creative potential.
                </p>
                <p className="mb-4">
                  We will enable users to easily and quickly create engaging AI
                  videos by utilizing the creative process of initially
                  generating images that express your vision so that you can
                  quickly and predictably generate videos at your highest
                  creative potential with minimal effort.
                </p>
              </div>
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
                  <source src="/GenTubeIntro_SD_480p.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6 text-center">
                How We're Different
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h3 className="text-xl font-semibold mb-3">
                    Guided Workflows
                  </h3>
                  <p>
                    Our guided workflows provide a structured approach to
                    content creation, making it easy for anyone to produce
                    professional-quality results without getting lost in complex
                    options.
                  </p>
                </div>
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h3 className="text-xl font-semibold mb-3">
                    Specialized Solutions
                  </h3>
                  <p>
                    Whether you're creating content for personal use, social
                    media, or business marketing, we offer specialized tools
                    designed for your specific needs.
                  </p>
                </div>
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h3 className="text-xl font-semibold mb-3">
                    Flexible Pricing
                  </h3>
                  <p>
                    Our credit-based system ensures you only pay for what you
                    use, with plans tailored for everyone from occasional users
                    to high-volume businesses.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Our Technology</h2>
              <p className="mb-4">
                GenTube.ai leverages the latest advancements in artificial
                intelligence and machine learning to power our image and video
                generation capabilities. Our platform combines multiple
                state-of-the-art AI models to provide the highest quality
                results across different types of visual content.
              </p>
              <p className="mb-4">
                We're constantly improving our technology to deliver better
                results, faster processing times, and more creative options. As
                AI technology evolves, GenTube.ai ensures you always have access
                to cutting-edge capabilities without needing to understand the
                complex technology behind them.
              </p>
              <p>
                Our secure cloud-based platform handles all the processing,
                allowing you to create stunning visuals from any device with an
                internet connection.
              </p>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6 text-center">Use Cases</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h3 className="text-xl font-semibold mb-3">Personal</h3>
                  <ul className="list-disc ml-5 space-y-2">
                    <li>Creating custom content for social media posts</li>
                    <li>Transforming personal photos into animated videos</li>
                    <li>Generating creative imagery for personal projects</li>
                    <li>
                      Creating storytelling videos from simple text descriptions
                    </li>
                  </ul>
                </div>
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h3 className="text-xl font-semibold mb-3">Business</h3>
                  <ul className="list-disc ml-5 space-y-2">
                    <li>Producing marketing materials and product showcases</li>
                    <li>
                      Creating professional brand images and logo animations
                    </li>
                    <li>
                      Developing product demonstrations and explainer videos
                    </li>
                    <li>
                      Generating consistent visual content for marketing
                      campaigns
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Create?</h2>
              <p className="mb-6">
                Discover the power of AI-assisted content creation and transform
                your ideas into reality.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  href="/start"
                  className="py-3 px-6 rounded-lg font-semibold"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--background-color)'
                  }}
                >
                  Get Started
                </Link>
                <Link
                  href="/pricing"
                  className="py-3 px-6 rounded-lg font-semibold"
                  style={{
                    backgroundColor: 'var(--card-bg-hover)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  See Pricing
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </UserCreditsProvider>
  );
}
