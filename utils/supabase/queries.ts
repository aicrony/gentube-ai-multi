import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { Database } from '@/types_db';

export const getUser = cache(async (supabase: SupabaseClient<Database>) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});

export const getSubscription = cache(async (supabase: SupabaseClient<Database>) => {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  return subscription;
});

export const getProducts = cache(async (supabase: SupabaseClient<Database>) => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  return products;
});

export const getUserDetails = cache(async (supabase: SupabaseClient<Database>) => {
  const { data: userDetails } = await supabase
    .from('users')
    .select('*')
    .single();
  return userDetails;
});

export const getPurchasedCredits = cache(async (supabase: SupabaseClient) => {
  const { data: userCredits } = await supabase
    .from('credit_tracking')
    .select('credits')
    .eq('id', '574322e4-dd4b-415b-a9e0-3b552222600b')
    .single();
  return userCredits ? userCredits.credits : 0;
});

export const setPurchasedCredits = cache(
  async (supabase: SupabaseClient, userId: string, newCredits: number) => {
    const { data: userCredits, error } = await supabase
      .from('credit_tracking')
      .update({ credits: newCredits })
      .eq('id', userId)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return userCredits;
  }
);
