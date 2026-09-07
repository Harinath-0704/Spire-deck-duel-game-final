import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Diagnostic for loaded environment variables
console.log('=== SUPABASE DIAGNOSTIC ===');
console.log('VITE_SUPABASE_URL exists:', !!supabaseUrl);
if (supabaseUrl) {
  try {
    const urlObj = new URL(supabaseUrl);
    console.log('URL Hostname:', urlObj.hostname);
  } catch (e) {
    console.log('URL Hostname: Invalid URL');
  }
}
console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
if (supabaseAnonKey) {
  console.log('Key Length:', supabaseAnonKey.length);
  const prefix = supabaseAnonKey.startsWith('sb_publishable_') ? 'sb_publishable_' : 
                 supabaseAnonKey.startsWith('eyJ') ? 'legacy JWT (eyJ...)' : 'Unknown';
  console.log('Key Prefix:', prefix);
}
console.log('===========================');

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Safe initialization that won't crash if env vars are missing
let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (supabaseInstance) return supabaseInstance;

  if (isSupabaseConfigured()) {
    try {
      supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
      return supabaseInstance;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }

  // Graceful fallback for local development without backend
  return null;
};

export const supabase = getSupabaseClient();

let sessionPromise: Promise<string | null> | null = null;

export const ensureSession = async (): Promise<string | null> => {
  if (!supabase) return null;
  
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        return session.user.id;
      }
      
      // Check if session exists without explicitly signing in anonymously
      if (!session?.user) {
        sessionPromise = null;
        return null;
      }
      
      return session.user.id;
    } catch (e) {
      console.error('[AUTH_CLIENT] Unexpected error in ensureSession:', e);
      sessionPromise = null;
      return null;
    }
  })();

  return sessionPromise;
};

export const createGuestSession = async (): Promise<string | null> => {
  if (!supabase) return null;
  
  try {
    const { data: { user }, error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      console.error("Guest auth initialization failed:", signInError);
      return null;
    }
    
    if (user) {
      console.log(`AUTH USER (new guest session): ${user.id}`);
      return user.id;
    }
  } catch (e) {
    console.error('Unexpected error in createGuestSession:', e);
  }
  return null;
};

export const signOut = async (): Promise<void> => {
  if (!supabase) return;
  
  try {
    console.log('[AUTH_CLIENT] signOut: clearing session');
    await supabase.auth.signOut();
    sessionPromise = null;
  } catch (e) {
    console.error('[AUTH_CLIENT] Error signing out:', e);
  }
};
