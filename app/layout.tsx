/// <reference path="../types/layout.d.ts" />
import { GoogleAnalytics } from '@next/third-parties/google';
import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import React, { Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import type { ReactNode } from 'react';
import '@/styles/main.css';
import { createClient } from '@/utils/supabase/server';
import { UserIdProvider } from '@/context/UserIdContext';
import { UserIpProvider } from '@/context/UserIpContext';
import { ThemeProvider } from '@/context/ThemeContext';

const title = 'Gentube AI Image and Video Generator';
const description = 'Generate images and videos with artificial intelligence.';
const ogImageUrl = `${getURL()}/api/og?title=${encodeURIComponent(title)}`;

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: title
      }
    ]
  }
};

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  const supabase = createClient();
  let userId: string = '';
  let userIp: string = '';

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    userId = user.id;
  }

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body>
        <UserIdProvider userId={userId}>
          <UserIpProvider>
            <ThemeProvider>
              <Navbar className="navbar" />
              <main
                id="skip"
                className="min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] pt-6"
              >
                {children}
              </main>
              <Footer />
              <Suspense>
                <Toaster />
              </Suspense>
            </ThemeProvider>
          </UserIpProvider>
        </UserIdProvider>
        <GoogleAnalytics gaId="G-634FFY459F" />
      </body>
    </html>
  );
}
