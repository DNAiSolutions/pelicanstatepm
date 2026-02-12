import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Allow graceful initialization - demo mode will handle missing credentials
let supabase: ReturnType<typeof createClient> | null = null;
let initError: string | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  initError = 'Missing Supabase environment variables - using demo mode fallback';
  console.warn(initError);
  // Create a dummy client that will fail gracefully in AuthContext
  supabase = createClient('https://dummy.supabase.co', 'dummy-key');
}

export { supabase, initError };

// Auth helper functions
export const authService = {
  async signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not initialized');
    return await supabase.auth.signUp({
      email,
      password,
    });
  },

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not initialized');
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signOut() {
    if (!supabase) throw new Error('Supabase not initialized');
    return await supabase.auth.signOut();
  },

  async getCurrentSession() {
    if (!supabase) throw new Error('Supabase not initialized');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    if (!supabase) throw new Error('Supabase not initialized');
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};
