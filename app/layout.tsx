import { GoogleAnalytics } from '@next/third-parties/google';
import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import { createClient } from '@/utils/supabase/server';
import { UserIdProvider } from '@/context/UserIdContext';

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

export default async function RootLayout({ children }: PropsWithChildren) {
  const supabase = createClient();
  let userId: string = '';

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    userId = user.id;
  }

  return (
    <html lang="en">
      <body>
        <UserIdProvider userId={userId}>
          <Navbar className="navbar" />
          <main
            id="skip"
            className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)] pt-6"
          >
            {children}
          </main>
          <Footer />
          <Suspense>
            <Toaster />
          </Suspense>
        </UserIdProvider>
      </body>
      <GoogleAnalytics gaId="G-634FFY459F" />
    </html>
  );
}
