'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StartPageWrapper from '@/app/StartPageWrapper';

function InvestorsPageContent() {
  return (
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl mb-6">
                Investor Relations
              </h1>
              <p className="text-xl mb-8">
                Join us in revolutionizing AI-powered content creation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Investment Opportunity
                </h2>
                <p className="mb-4">
                  GenTube.ai is at the forefront of democratizing AI-powered
                  content creation. Our platform enables users to generate
                  professional-quality images and videos without technical
                  expertise or expensive equipment, addressing a rapidly
                  expanding global market.
                </p>
                <p>
                  We're seeking strategic partners who share our vision of
                  making cutting-edge AI tools accessible to everyone, from
                  individual creators to enterprise businesses.
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
                  <source
                    src="https://storage.googleapis.com/gen-video-storage/GenTubeIntro_SD_480p.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Market Opportunity</h2>
              <p className="mb-4">
                The global AI content creation market is experiencing explosive
                growth, projected to reach $30 billion by 2025 with a CAGR of
                over 25%. This growth is driven by increasing demand for visual
                content across social media, marketing, e-commerce, and
                entertainment sectors.
              </p>
              <p className="mb-4">
                GenTube.ai is uniquely positioned to capitalize on this
                opportunity with our user-friendly platform that makes
                sophisticated AI technology accessible to non-technical users
                through guided workflows and specialized tools for different use
                cases.
              </p>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6 text-center">
                Our Competitive Advantages
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
                    Proprietary Technology
                  </h3>
                  <p>
                    Our platform integrates multiple state-of-the-art AI models
                    with proprietary optimizations that deliver superior quality
                    and performance compared to general-purpose alternatives.
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
                    Scalable Business Model
                  </h3>
                  <p>
                    Our credit-based system allows for flexible pricing across
                    market segments while maintaining high margins. Our cloud
                    infrastructure enables rapid scaling to meet growing demand.
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
                    Growing User Base
                  </h3>
                  <p>
                    We've achieved significant user growth with minimal
                    marketing, demonstrating strong product-market fit and
                    creating opportunities for expansion across additional
                    channels.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Growth Strategy</h2>
              <ul className="list-disc ml-5 space-y-4">
                <li className="ml-2">
                  <span className="font-semibold">Market Expansion:</span>{' '}
                  Targeting enterprise clients in advertising, marketing, and
                  e-commerce sectors while continuing to grow our base of
                  individual creators and small businesses.
                </li>
                <li className="ml-2">
                  <span className="font-semibold">Product Development:</span>{' '}
                  Expanding our offering with additional AI-powered tools and
                  features to address specific industry needs and stay at the
                  technological forefront.
                </li>
                <li className="ml-2">
                  <span className="font-semibold">Strategic Partnerships:</span>{' '}
                  Forming alliances with complementary platforms in content
                  management, social media, and digital marketing to expand our
                  reach.
                </li>
                <li className="ml-2">
                  <span className="font-semibold">
                    International Expansion:
                  </span>{' '}
                  Localizing our platform for key global markets to capture
                  worldwide demand for AI-powered content creation.
                </li>
              </ul>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Leadership Team</h2>
              <p className="mb-8">
                GenTube.ai is led by a team of experienced entrepreneurs and
                technical experts with backgrounds in AI, computer vision, cloud
                infrastructure, and SaaS business models. Our leadership
                combines deep technical knowledge with proven business acumen.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h3 className="text-xl font-semibold mb-2">Executive Team</h3>
                  <p>
                    Our executive team brings decades of combined experience
                    from leading technology companies with expertise in scaling
                    SaaS platforms and commercializing AI technologies.
                  </p>
                </div>
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h3 className="text-xl font-semibold mb-2">Technical Team</h3>
                  <p>
                    Our technical team includes senior software engineers
                    specializing in cloud infrastructure, AI application
                    technology, and user experience design.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">
                Contact Investor Relations
              </h2>
              <p className="mb-6">
                If you're interested in exploring investment opportunities with
                GenTube.ai, we'd love to hear from you. Please contact our
                investor relations team for more information.
              </p>
              <div className="flex justify-center">
                <a
                  href="mailto:support@gentube.ai"
                  className="py-3 px-6 rounded-lg font-semibold"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--background-color)'
                  }}
                >
                  Email Investor Relations
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}

export default function InvestorsPage() {
  return (
    <StartPageWrapper>
      <InvestorsPageContent />
    </StartPageWrapper>
  );
}
