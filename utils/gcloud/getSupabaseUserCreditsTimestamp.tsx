import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Gets the timestamp of user's recent credit purchase within the last 24 hours
 * @returns The created_at timestamp if exists, or null
 */
export async function getSupabaseUserCreditsTimestamp(
  userId: string | string[] | undefined
): Promise<string | null> {
  if (!userId || userId === 'none' || Array.isArray(userId)) {
    console.log('Invalid userId for Supabase credits check');
    return null;
  }

  try {
    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Query Supabase for recent credit purchases
    const { data, error } = await supabase
      .from('credits')
      .select('user_id, created_at')
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .is('validated', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying Supabase credits:', error);
      return null;
    }

    if (data && data.length > 0) {
      console.log('Recent credit purchase found:');
      console.log('user_id:', data[0].user_id);
      console.log('created_at:', data[0].created_at);
      return data[0].created_at;
    } else {
      console.log('No recent credit purchases found for user_id:', userId);
      return null;
    }
  } catch (err) {
    console.error('Exception in getSupabaseUserCreditsTimestamp:', err);
    return null;
  }
}
