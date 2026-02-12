// Debug file to verify env vars are available
export const DEBUG_ENV = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'NOT_SET',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
};

console.log('DEBUG_ENV:', DEBUG_ENV);
