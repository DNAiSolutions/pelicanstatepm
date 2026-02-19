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
  switchProfile: (profile: 'demo' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for testing with sample data
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

// Admin user for monitoring projects (no demo data, clean slate)
const ADMIN_USER: AuthUser = {
  id: 'admin-user-789',
  aud: 'authenticated',
  role: 'Owner',
  campusAssigned: [],
  email: 'admin@pelicanstate.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'admin' },
  user_metadata: { admin: true },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize with user profile from localStorage, defaulting to demo
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load preferred profile from localStorage
    const savedProfile = localStorage.getItem('auth-profile') || 'demo';
    let selectedUser = DEMO_USER;
    if (savedProfile === 'admin') {
      selectedUser = ADMIN_USER;
    }
    setUser(selectedUser);
    setLoading(false);
    console.log(`AuthProvider: Loaded ${savedProfile} profile (${selectedUser.email})`);
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

  const switchProfile = (profile: 'demo' | 'admin') => {
    let selectedUser = DEMO_USER;
    if (profile === 'admin') {
      selectedUser = ADMIN_USER;
    }
    setUser(selectedUser);
    localStorage.setItem('auth-profile', profile);
    console.log(`Switched to ${profile} profile (${selectedUser.email})`);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
    switchProfile,
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
