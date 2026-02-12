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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

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

  useEffect(() => {
    // Check if demo mode is enabled
    const demoParam = new URLSearchParams(window.location.search).get('demo');
    const savedDemoMode = localStorage.getItem('demoMode') === 'true';
    
    const checkSession = async () => {
      try {
        // If demo mode or no Supabase session, use demo user
        if (demoParam === 'true' || savedDemoMode) {
          setDemoMode(true);
          setUser(DEMO_USER);
          setLoading(false);
          return;
        }

        const session = await authService.getCurrentSession();
        if (session?.user) {
          setUser({
            ...session.user,
            role: 'Owner',
            campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
          });
        } else {
          // No session and no demo mode - use demo by default for development
          setDemoMode(true);
          setUser(DEMO_USER);
        }
      } catch (err) {
        console.error('Session check error:', err);
        // Fall back to demo mode on error
        setDemoMode(true);
        setUser(DEMO_USER);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener (only if not in demo mode)
    if (!demoMode) {
      const { data: authListener } = authService.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            ...session.user,
            role: 'Owner',
            campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Allow demo login with any credentials
      if (email && password) {
        // Try real authentication first
        try {
          const { data, error: signInError } = await authService.signIn(email, password);

          if (signInError) {
            // Fall back to demo mode
            setDemoMode(true);
            setUser(DEMO_USER);
            localStorage.setItem('demoMode', 'true');
            return;
          }

          if (data.session?.user) {
            setDemoMode(false);
            localStorage.removeItem('demoMode');
            setUser({
              ...data.session.user,
              role: 'Owner',
              campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
            });
          }
        } catch (authErr) {
          // Fall back to demo mode on any auth error
          console.log('Auth service unavailable, using demo mode');
          setDemoMode(true);
          setUser(DEMO_USER);
          localStorage.setItem('demoMode', 'true');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { data, error: signUpError } = await authService.signUp(email, password);

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        setUser({
          ...data.user,
          role: 'User',
          campusAssigned: [],
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign up';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      if (demoMode) {
        // In demo mode, just clear the user
        setUser(null);
        localStorage.removeItem('demoMode');
        setDemoMode(false);
      } else {
        await authService.signOut();
        setUser(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign out';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
