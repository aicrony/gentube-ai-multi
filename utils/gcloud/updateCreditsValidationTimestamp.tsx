import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Updates the "validated" column with current timestamp for a specific credit record
 * @param userId User ID to match
 * @param createdAtTimestamp Exact timestamp of the record to update
 */
export async function updateCreditsValidationTimestamp(
  userId: string,
  createdAtTimestamp: string
): Promise<boolean> {
  if (!userId || !createdAtTimestamp) {
    console.log('Invalid userId or timestamp for validation update');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('credits')
      .update({ validated: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('created_at', createdAtTimestamp)
      .is('validated', null)
      .select();

    if (error) {
      console.error('Error updating validation timestamp:', error);
      return false;
    }

    const recordsUpdated = data ? data.length : 0;
    console.log(
      `Updated validation timestamp for user_id: ${userId}, records affected: ${recordsUpdated}`
    );
    return recordsUpdated > 0;
  } catch (err) {
    console.error('Exception in updateCreditsValidationTimestamp:', err);
    return false;
  }
}
