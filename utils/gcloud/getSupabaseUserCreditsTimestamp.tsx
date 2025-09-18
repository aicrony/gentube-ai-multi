import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Checks if the user has purchased credits within the last 24 hours
 */
export async function getSupabaseUserCreditsTimestamp(
  userId: string | string[] | undefined
): Promise<boolean> {
  if (!userId || userId === 'none' || Array.isArray(userId)) {
    console.log('Invalid userId for Supabase credits check');
    return false;
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying Supabase credits:', error);
      return false;
    }

    const hasRecentCredits = data && data.length > 0;

    if (hasRecentCredits) {
      console.log('Recent credit purchase found:');
      console.log('user_id:', data[0].user_id);
      console.log('created_at:', data[0].created_at);
    } else {
      console.log('No recent credit purchases found for user_id:', userId);
    }

    return hasRecentCredits;
  } catch (err) {
    console.error('Exception in getSupabaseUserCreditsTimestamp:', err);
    return false;
  }
}
