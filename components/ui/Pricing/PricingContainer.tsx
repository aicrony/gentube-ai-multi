'use client';

import React, { useEffect, useState } from 'react';
import Pricing from '@/components/ui/Pricing/Pricing';
import { createClient } from '@/utils/supabase/client';
import { Tables } from '@/types_db';
import { User } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';

type Product = Tables<'products'>;
type Price = Tables<'prices'>;
type Subscription = Tables<'subscriptions'>;

interface ProductWithPrices extends Product {
  prices: Price[];
}

interface PriceWithProduct extends Price {
  products: Product | null;
}

interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

export default function PricingContainer() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [subscription, setSubscription] =
    useState<SubscriptionWithProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') || null;

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Get user
        const {
          data: { user: userData }
        } = await supabase.auth.getUser();
        setUser(userData);

        // Get products
        const { data: productsData } = await supabase
          .from('products')
          .select('*, prices(*)')
          .eq('active', true)
          .order('metadata->index')
          .order('unit_amount', { foreignTable: 'prices' });

        if (productsData) setProducts(productsData as ProductWithPrices[]);

        // Get subscription if user is logged in
        if (userData) {
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('*, prices(*, products(*))')
            .eq('user_id', userData.id)
            .in('status', ['trialing', 'active'])
            .maybeSingle();

          setSubscription(subscriptionData as SubscriptionWithProduct);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Pricing
      user={user}
      products={products}
      subscription={subscription}
      initialTab={initialTab}
    />
  );
}
