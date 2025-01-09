// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';
import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import { createClient } from '@/utils/supabase/server';
import { ProductNameProvider } from '@/context/ProductNameContext';
import { SubscriptionStatusProvider } from '@/context/SubscriptionStatusContext';
import { SubscriptionTierProvider } from '@/context/SubscriptionTierContext';
import { UserIdProvider } from '@/context/UserIdContext';
import { PurchasedCreditsProvider } from '@/context/PurchasedCreditsContext';

const title = 'Gentube AI Image and Video Generator';
const description = 'Generate images and videos with artificial intelligence.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description
  }
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const supabase = createClient();
  let productName: string = '';
  let subscriptionStatus: string = '';
  let userId: string = '';
  let purchasedCredits: number = 0;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    userId = user.id;
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        prices (
          id,
          products (
            name
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching subscription data:', error);
    } else {
      if (
        data[0] &&
        data[0].prices &&
        data[0].prices.products &&
        data[0].prices.products.name &&
        data[0].status
      ) {
        productName = JSON.stringify(data[0].prices.products.name);
        subscriptionStatus = JSON.stringify(data[0].status);
      }
    }

    const { data: creditsData, error: creditsError } = await supabase
      .from('credit_tracking')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (creditsError) {
      console.error('Error fetching credits data:', creditsError);
    } else {
      purchasedCredits = creditsData.credits;
    }
  }

  return (
    <html lang="en">
      <body className="bg-black">
        <UserIdProvider userId={userId}>
          <PurchasedCreditsProvider
            userId={userId}
            purchasedCredits={purchasedCredits}
          >
            <ProductNameProvider productName={productName}>
              <SubscriptionStatusProvider
                subscriptionStatus={subscriptionStatus}
              >
                <SubscriptionTierProvider
                  productName={productName}
                  subscriptionStatus={subscriptionStatus}
                >
                  <Navbar
                    productName={productName}
                    subscriptionStatus={subscriptionStatus}
                  />
                  <main
                    id="skip"
                    className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]"
                  >
                    {children}
                  </main>
                  <Footer />
                  <Suspense>
                    <Toaster />
                  </Suspense>
                </SubscriptionTierProvider>
              </SubscriptionStatusProvider>
            </ProductNameProvider>
          </PurchasedCreditsProvider>
        </UserIdProvider>
      </body>
      <GoogleAnalytics gaId="G-634FFY459F" />
    </html>
  );
}
