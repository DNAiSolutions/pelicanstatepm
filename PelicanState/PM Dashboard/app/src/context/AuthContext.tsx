import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/supabaseClient';

export type UserRole = 'Owner' | 'Developer' | 'User';

export interface AuthUser extends User {
  role?: UserRole;
  campusAssigned?: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for testing without Supabase
const DEMO_USER: AuthUser = {
  id: 'demo-user-123',
  aud: 'authenticated',
  role: 'Owner',
  campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
  email: 'demo@pelicanstate.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'demo' },
  user_metadata: { demo: true },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check if demo mode is explicitly disabled
        const noDemoParam = new URLSearchParams(window.location.search).get('nodemo');
        
        // Check if we have real Supabase credentials
        const hasRealCredentials = import.meta.env.VITE_SUPABASE_URL && 
                                   !import.meta.env.VITE_SUPABASE_URL.includes('dummy') &&
                                   import.meta.env.VITE_SUPABASE_ANON_KEY &&
                                   !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('dummy');

        // If no real credentials OR demo is not disabled, use demo mode immediately
        if (!hasRealCredentials || noDemoParam !== 'true') {
          console.log('Using demo mode (no real credentials or demo mode enabled)');
          setUser(DEMO_USER);
          setLoading(false);
          return;
        }

        // Only try to check session if we have real credentials AND demo is explicitly disabled
        console.log('Attempting to check for existing Supabase session...');
        try {
          const sessionPromise = authService.getCurrentSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 2000)
          );
          
          const session = await Promise.race([sessionPromise, timeoutPromise]) as any;
          
          if (session?.user) {
            console.log('Found existing session');
            setUser({
              ...session.user,
              role: 'Owner',
              campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
            });
          } else {
            console.log('No session found, using demo mode fallback');
            setUser(DEMO_USER);
          }
        } catch (sessionErr) {
          console.warn('Session check failed, using demo mode:', sessionErr);
          setUser(DEMO_USER);
        } finally {
          setLoading(false);
        }

      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(DEMO_USER);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const isAuthenticated = user !== null;

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await authService.signIn(email, password) as any;
      if (result?.data?.user) {
        setUser({
          ...result.data.user,
          role: 'Owner',
          campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
        });
      } else {
        throw new Error('Failed to sign in');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await authService.signUp(email, password) as any;
      if (result?.error) throw result.error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
