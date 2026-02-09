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

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const session = await authService.getCurrentSession();
        if (session?.user) {
          // In a real app, fetch user role and campus from the users table
          setUser({
            ...session.user,
            role: 'Owner', // Default for now - will be fetched from DB
            campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'], // Mock data
          });
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener
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
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { data, error: signInError } = await authService.signIn(email, password);

      if (signInError) {
        throw signInError;
      }

      if (data.session?.user) {
        // Fetch user role and campus from users table
        setUser({
          ...data.session.user,
          role: 'Owner', // Fetch from DB in real implementation
          campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
        });
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
      await authService.signOut();
      setUser(null);
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
