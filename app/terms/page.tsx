'use client';

import React from 'react';
import Link from 'next/link';
import { UserCreditsProvider } from '@/context/UserCreditsContext';

export default function TermsOfUsePage() {
  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold sm:text-center mb-6">
                Terms of Use
              </h1>
              <p className="text-lg mb-4">Last Updated: May 1, 2025</p>
            </div>

            <div
              className="prose prose-lg max-w-none"
              style={{ color: 'var(--text-color)' }}
            >
              <h2>1. Agreement to Terms</h2>
              <p>
                Welcome to GenTube.ai. By accessing or using our website and
                services, you agree to be bound by these Terms of Use. If you do
                not agree with any part of these terms, you may not use our
                services.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                GenTube.ai provides AI-powered image and video generation
                services that allow users to create visual content based on text
                descriptions, uploaded images, and other inputs. Our services
                are subject to change and may evolve over time.
              </p>

              <h2>3. User Accounts</h2>
              <p>
                Some features of our service require registration and creation
                of a user account. You are responsible for maintaining the
                confidentiality of your account credentials and for all
                activities that occur under your account. You must provide
                accurate and complete information when creating an account and
                keep this information updated.
              </p>
              <p>
                We reserve the right to terminate or suspend accounts at our
                discretion, particularly in cases of terms violation or extended
                inactivity.
              </p>

              <h2>4. Subscription and Payment Terms</h2>
              <p>
                GenTube.ai offers various subscription plans and credit
                packages. By subscribing to a paid plan or purchasing credits,
                you agree to the following:
              </p>
              <ul>
                <li>
                  All payments are processed through our secure payment
                  processors
                </li>
                <li>
                  Subscription fees are charged at the beginning of each billing
                  period
                </li>
                <li>
                  Credits purchased are non-refundable unless otherwise required
                  by law
                </li>
                <li>
                  We reserve the right to change pricing with reasonable notice
                </li>
              </ul>

              <h2>5. User Content</h2>
              <p>
                Users may upload images and provide text prompts ("User
                Content") to generate new content. You retain ownership of your
                original User Content, but grant us a worldwide, non-exclusive
                license to use, store, and process this content for the purpose
                of providing our services.
              </p>
              <p>
                You are solely responsible for your User Content and must ensure
                it does not violate any third-party rights or applicable laws.
                We prohibit the upload or generation of content that is:
              </p>
              <ul>
                <li>Illegal, harmful, threatening, or discriminatory</li>
                <li>Infringing on intellectual property rights</li>
                <li>Pornographic, obscene, or sexually explicit</li>
                <li>Deceptive or misleading</li>
                <li>Invasive of privacy</li>
              </ul>

              <h2>6. Intellectual Property Rights</h2>
              <h3>6.1 Our Intellectual Property</h3>
              <p>
                The GenTube.ai platform, including its software, design, logo,
                and content (excluding User Content), is owned by us and
                protected by copyright, trademark, and other intellectual
                property laws. You may not copy, modify, distribute, or create
                derivative works based on our intellectual property without our
                explicit permission.
              </p>

              <h3>6.2 Generated Content</h3>
              <p>
                The ownership and usage rights for AI-generated content vary by
                subscription tier:
              </p>
              <ul>
                <li>
                  <strong>Freemium Plan:</strong> Personal, non-commercial use
                  only
                </li>
                <li>
                  <strong>Personal Plan:</strong> Personal use, including on
                  personal social media
                </li>
                <li>
                  <strong>Business Plan:</strong> Commercial usage rights for
                  business purposes
                </li>
              </ul>
              <p>
                All tiers prohibit: reselling generated content as stock media,
                using the content in NFTs without explicit permission, or
                training competing AI models with the generated content.
              </p>

              <h2>7. Prohibited Activities</h2>
              <p>When using GenTube.ai, you agree not to:</p>
              <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the intellectual property rights of others</li>
                <li>Attempt to access, tamper with, or probe our systems</li>
                <li>Use automated scripts or bots to access our services</li>
                <li>Interfere with the proper functioning of our services</li>
                <li>Share your account credentials with others</li>
                <li>
                  Use our services to create deceptive or misleading content
                </li>
              </ul>

              <h2>8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, GenTube.ai and its
                affiliates shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including lost
                profits, arising from your use of our services, even if we have
                been advised of the possibility of such damages.
              </p>
              <p>
                Our liability for any claim arising from these terms or your use
                of our services shall not exceed the amount you paid us during
                the 12 months preceding the claim.
              </p>

              <h2>9. Disclaimers</h2>
              <p>
                Our services are provided "as is" and "as available" without
                warranties of any kind, either express or implied. We do not
                guarantee that our services will be uninterrupted, secure, or
                error-free.
              </p>
              <p>
                While we strive for high-quality output, we cannot guarantee
                that generated content will meet your specific requirements or
                expectations. AI-generated content may contain imperfections or
                inaccuracies.
              </p>

              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless GenTube.ai and its
                affiliates, officers, employees, and agents from any claims,
                damages, liabilities, costs, or expenses arising from your use
                of our services or violation of these terms.
              </p>

              <h2>11. Modifications to Terms</h2>
              <p>
                We may modify these Terms of Use at any time by posting the
                revised terms on our website. Your continued use of our services
                after the changes constitutes acceptance of the modified terms.
              </p>

              <h2>12. Governing Law</h2>
              <p>
                These terms are governed by the laws of the State of California,
                without regard to its conflict of law principles. Any disputes
                arising from these terms shall be subject to the exclusive
                jurisdiction of the courts in San Francisco County, California.
              </p>

              <h2>13. Contact Information</h2>
              <p>
                If you have questions or concerns about these Terms of Use,
                please contact us at:
              </p>
              <p>
                <strong>Email:</strong> support@eekotech.com
                <br />
                <strong>Address:</strong> GenTube.ai Headquarters, New Albany,
                OH 43054, USA
              </p>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/"
                className="py-3 px-6 rounded-lg font-semibold inline-block"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--background-color)'
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </UserCreditsProvider>
  );
}
