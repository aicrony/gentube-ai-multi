'use client';

import React from 'react';
import Link from 'next/link';
import { UserCreditsProvider } from '@/context/UserCreditsContext';

export default function PrivacyPolicyPage() {
  return (
    <UserCreditsProvider>
      <div className="w-full min-h-screen flex flex-col gap-2">
        <main className="flex-1 items-center justify-center mt-16 pt-4">
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold sm:text-center mb-6">
                Privacy Policy
              </h1>
              <p className="text-lg mb-4">Last Updated: May 1, 2025</p>
            </div>

            <div
              className="prose prose-lg max-w-none"
              style={{ color: 'var(--text-color)' }}
            >
              <h2>1. Introduction</h2>
              <p>
                Welcome to GenTube.ai. We respect your privacy and are committed
                to protecting your personal data. This privacy policy explains
                how we collect, use, and safeguard your information when you use
                our website and services.
              </p>
              <p>
                By using GenTube.ai, you consent to the data practices described
                in this policy. We may update this policy periodically, and
                we'll notify you of any significant changes.
              </p>

              <h2>2. Information We Collect</h2>
              <h3>2.1 Personal Information</h3>
              <p>We may collect the following types of personal information:</p>
              <ul>
                <li>Contact information (name, email address)</li>
                <li>Account credentials</li>
                <li>Billing information</li>
                <li>User-generated content (images, videos, text prompts)</li>
                <li>Usage data and preferences</li>
              </ul>

              <h3>2.2 Technical Information</h3>
              <p>When you use our services, we automatically collect:</p>
              <ul>
                <li>IP address</li>
                <li>Device information</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Usage patterns and interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul>
                <li>Providing and improving our services</li>
                <li>Processing payments and managing accounts</li>
                <li>Personalizing user experience</li>
                <li>Analyzing usage patterns to enhance functionality</li>
                <li>Communicating with you about our services</li>
                <li>Training and improving our AI models</li>
                <li>Security and fraud prevention</li>
                <li>Complying with legal obligations</li>
              </ul>

              <h2>4. Data Storage and Security</h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information. However, no method of
                transmission over the Internet or electronic storage is 100%
                secure, so we cannot guarantee absolute security.
              </p>
              <p>
                We store your data on secure servers and use industry-standard
                encryption for data in transit. We retain your information only
                for as long as necessary to fulfill the purposes outlined in
                this policy, unless a longer retention period is required by
                law.
              </p>

              <h2>5. Sharing Your Information</h2>
              <p>We may share your information with:</p>
              <ul>
                <li>Service providers who help us operate our business</li>
                <li>Payment processors for billing purposes</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your consent</li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>

              <h2>6. Your Rights</h2>
              <p>
                Depending on your location, you may have certain rights
                regarding your personal information, including:
              </p>
              <ul>
                <li>Access to your personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Restriction or objection to certain processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p>
                To exercise these rights, please contact us at
                support@eekotech.com.
              </p>

              <h2>7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your
                experience, analyze usage, and for marketing purposes. You can
                control cookies through your browser settings, although
                disabling certain cookies may limit your ability to use some
                features of our site.
              </p>

              <h2>8. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13 years of
                age. We do not knowingly collect personal information from
                children under 13. If you believe we have collected information
                from a child under 13, please contact us immediately.
              </p>

              <h2>9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in
                countries other than your country of residence. These countries
                may have different data protection laws. We take appropriate
                safeguards to ensure your information receives adequate
                protection.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have questions or concerns about this privacy policy or
                our data practices, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> support@eekotech.com
                <br />
                {/*<strong>Address:</strong> GenTube.ai Headquarters, New Albany,*/}
                {/*OH 43054, USA*/}
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
