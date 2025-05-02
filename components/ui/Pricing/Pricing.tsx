'use client';

import Button from '@/components/ui/Button';
import type { Tables } from '@/types_db';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import cn from 'classnames';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useUserId } from '@/context/UserIdContext';
import { useUserCredits } from '@/context/UserCreditsContext';
import PricingBadge from '@/components/ui/Pricing/PricingBadge';

type Subscription = Tables<'subscriptions'>;
type Product = Tables<'products'>;
type Price = Tables<'prices'>;
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface PricingProps {
  user: User | null;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
  initialTab?: string | null;
}

type BillingInterval = 'lifetime' | 'year' | 'month' | 'day';

export default function Pricing({
  user,
  products,
  subscription,
  initialTab
}: PricingProps) {
  const [activeTab, setActiveTab] = useState<'monthly' | 'one-time'>(
    initialTab === 'one-time' ? 'one-time' : 'monthly'
  );

  // Set the appropriate billing interval based on the active tab
  useEffect(() => {
    if (activeTab === 'monthly') {
      setBillingInterval('month');
    } else if (activeTab === 'one-time') {
      setBillingInterval('day'); // Assuming 'day' is used for one-time billing
    }
  }, [activeTab]);

  const intervals = Array.from(
    new Set(
      products.flatMap((product) =>
        product?.prices?.map((price) => price?.interval)
      )
    )
  );
  const router = useRouter();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return router.push('/signin/signup');
    }

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      price,
      currentPath ?? undefined
    );

    if (errorRedirect) {
      setPriceIdLoading(undefined);
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setPriceIdLoading(undefined);
      return router.push(
        getErrorRedirect(
          currentPath ?? '',
          'An unknown error occurred.',
          'Please try again later or contact a system administrator.'
        )
      );
    }

    const stripe = await getStripe();
    stripe?.redirectToCheckout({ sessionId });

    setPriceIdLoading(undefined);
  };
  const userId = useUserId() || 'none';
  const { userCreditsResponse } = useUserCredits();
  const signInMessage =
    userId === 'none' ? (
      <button
        onClick={() => (window.location.href = '/signin')}
        className="font-light text-md"
      >
        $0 Freemium and 1-time free credits
      </button>
    ) : null;

  if (!products.length) {
    return (
      <section>
        <div className="mt-8 max-w-6xl px-4 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
          <p className="text-4xl font-extrabold sm:text-center sm:text-6xl">
            No subscription pricing plans found. Create them in your{' '}
            <a
              className="text-pink-500 underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </p>
        </div>
      </section>
    );
  } else {
    return (
      <section>
        <div className="mt-20 max-w-6xl px-4 mx-auto sm:py-12 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center">
            <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl">
              Pricing Plans
            </h1>
            <p className="max-w-2xl m-auto mt-5 text-xl text-center sm:text-center sm:text-2xl">
              Choose a plan to simplify your workflow.
            </p>
            <div
              className="relative self-center mt-6 rounded-lg p-0.5 flex sm:mt-8 "
              style={{ backgroundColor: 'var(--secondary-color)' }}
            >
              {intervals.includes('month') && (
                <button
                  onClick={() => setBillingInterval('month')}
                  type="button"
                  className={`${
                    billingInterval === 'month'
                      ? 'relative w-1/2 shadow-sm'
                      : 'ml-0.5 relative w-1/2 border border-transparent'
                  } rounded-md m-1 py-2 text-sm font-semibold text-center uppercase whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
                  style={{
                    backgroundColor:
                      billingInterval === 'month'
                        ? 'var(--card-selected-bg)'
                        : 'transparent',
                    color:
                      billingInterval === 'month'
                        ? 'var(--primary-color)'
                        : 'var(--text-color)',
                    borderColor:
                      billingInterval === 'month'
                        ? 'var(--primary-color)'
                        : 'transparent',
                    borderWidth: billingInterval === 'month' ? '1px' : '0'
                  }}
                >
                  Monthly billing
                </button>
              )}
              {intervals.includes('day') && (
                <button
                  onClick={() => setBillingInterval('day')}
                  type="button"
                  className={`${
                    billingInterval === 'day'
                      ? 'relative w-1/2 shadow-sm'
                      : 'ml-0.5 relative w-1/2 border border-transparent'
                  } rounded-md m-1 py-2 text-sm font-semibold text-center uppercase whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
                  style={{
                    backgroundColor:
                      billingInterval === 'day'
                        ? 'var(--card-selected-bg)'
                        : 'transparent',
                    color:
                      billingInterval === 'day'
                        ? 'var(--primary-color)'
                        : 'var(--text-color)',
                    borderColor:
                      billingInterval === 'day'
                        ? 'var(--primary-color)'
                        : 'transparent',
                    borderWidth: billingInterval === 'day' ? '1px' : '0'
                  }}
                >
                  One-Time billing
                </button>
              )}
            </div>
            <div className="max-w-2xl m-auto text-center sm:text-center sm:text-2xl mt-3">
              {signInMessage && (
                <span className="text-lg font-bold">{signInMessage}</span>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-0 sm:mt-8 flex flex-wrap justify-center gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
            {products.map((product, index) => {
              const price = product?.prices?.find(
                (price) => price.interval === billingInterval
              );
              if (!price) return null;
              const priceString = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: price.currency!,
                minimumFractionDigits: 0
              }).format((price?.unit_amount || 0) / 100);

              // Determine if this product should have a special badge
              const isPlusPlan =
                product.name?.toLowerCase().includes('plus') || false;
              const isBusinessPlan =
                product.name?.toLowerCase().includes('business') || false;
              const isTeamPlan =
                product.name?.toLowerCase().includes('team') || false;

              return (
                <div
                  key={product.id}
                  className={cn(
                    'flex flex-col rounded-lg shadow-lg divide-y divide-black shadow-black/25 relative',
                    {
                      'border border-pink-500': subscription
                        ? product.name === subscription?.prices?.products?.name
                        : product.name === 'Freelancer',
                      'border-2 border-primary':
                        isPlusPlan || isTeamPlan || isBusinessPlan
                    },
                    'flex-1', // This makes the flex item grow to fill the space
                    'basis-1/3', // Assuming you want each card to take up roughly a third of the container's width
                    'max-w-xs' // Sets a maximum width to the cards to prevent them from getting too large
                  )}
                  style={{
                    borderColor:
                      isPlusPlan || isTeamPlan || isBusinessPlan
                        ? 'var(--primary-color)'
                        : undefined
                  }}
                >
                  {isPlusPlan && <PricingBadge label="Best for High Output" />}

                  {isTeamPlan && <PricingBadge label="Best for High Output" />}

                  {isBusinessPlan && <PricingBadge label="Best Value" />}

                  <div className="p-6">
                    <h2 className="text-2xl font-semibold leading-6">
                      {product.name}
                    </h2>
                    <p className="mt-4">{product.description}</p>
                    <p className="mt-8">
                      <span className="text-5xl font-extrabold white">
                        {priceString}
                      </span>
                      {/*<span className="text-base font-medium text-zinc-100">*/}
                      {/*  /{billingInterval}*/}
                      {/*</span>*/}
                    </p>
                    <Button
                      variant="slim"
                      type="button"
                      loading={priceIdLoading === price.id}
                      onClick={() => handleStripeCheckout(price)}
                      className="block w-full py-2 mt-8 text-sm font-semibold text-center rounded-md"
                    >
                      {subscription ? 'Purchase' : 'Purchase'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plan Feature Comparison Table */}
          <div className="mt-16 max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-6">
              Plan Features
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left">Features</th>
                    <th className="py-3 px-4 text-center">Freemium</th>
                    <th className="py-3 px-4 text-center">Personal</th>
                    <th className="py-3 px-4 text-center">Business & Plus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {/* Asset Management */}
                  <tr>
                    <td colSpan={4} className="py-3 px-4 font-bold">
                      Asset Management
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;View & Manage Assets
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Upload Multiple Images
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Asset Queue Auto-Refresh
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>

                  {/* Workflow Options */}
                  <tr>
                    <td colSpan={4} className="py-3 px-4 font-bold">
                      Workflows
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;FreeFlow (Direct Tools)
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Personal Workflows
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Business Workflows
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>

                  {/* Image Generation Features */}
                  <tr>
                    <td colSpan={4} className="py-3 px-4 font-bold">
                      Image Creation
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Basic Image Generation
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Social Media Image Templates
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Product Image Scenes
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Brand Image Creation
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Logo & Meme Creation
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>

                  {/* Video Generation Features */}
                  <tr>
                    <td colSpan={4} className="py-3 px-4 font-bold">
                      Video Creation
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Basic Text-to-Video
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Image URL to Video
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Animate Your Photo
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Story Video Creation
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Product Video Showcase
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>

                  {/* Credits and Usage */}
                  <tr>
                    <td colSpan={4} className="py-3 px-4 font-bold">
                      Credits and Usage
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Add additional credits anytime
                    </td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Higher Quality Generations
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">
                      &nbsp;&nbsp;&nbsp;&nbsp;Commercial Usage Rights
                    </td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">❌</td>
                    <td className="py-2 px-4 text-center">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/*<div className="pt-8">*/}
          {/*  <p className="m-auto mt-5 text-xl text-center sm:text-center sm:text-xl">*/}
          {/*    Image generations cost 4-6 credits, videos cost 40-80 credits based on quality and length.*/}
          {/*  </p>*/}
          {/*</div>*/}
        </div>
      </section>
    );
  }
}
