import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Retrieves the server session data
export async function getServerSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Gets the current authenticated user or null if not authenticated
export async function getAuthenticatedUser() {
  const session = await getServerSession();
  return session?.user || null;
}

// Checks if a user is authenticated
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session;
}