import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/supabaseClient';
import { userProfileService, type UserProfile, type AccessType } from '../services/userProfileService';

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  switchProfile: (profile: 'demo' | 'admin' | 'dev') => void;
  profile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  requiresOnboarding: boolean;
  accessType: AccessType;
  isDemoAccount: boolean;
}

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

const DEV_USER: AuthUser = {
  id: 'dev-user-999',
  aud: 'authenticated',
  role: 'Developer',
  campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
  email: 'dev@pelicanstate.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'dev' },
  user_metadata: { dev: true },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const isDemoEmail = (email?: string | null) =>
    email === 'demo@pelicanstate.com' || email === 'admin@pelicanstate.com' || email === 'dev@pelicanstate.com';

  const loadUserProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const data = await userProfileService.getProfile(userId);
      setProfile(data ?? null);
    } catch (profileError) {
      console.warn('Failed to load profile', profileError);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const applyDemoProfile = (key: 'demo' | 'admin' | 'dev') => {
    let selectedUser = DEMO_USER;
    if (key === 'admin') selectedUser = ADMIN_USER;
    if (key === 'dev') selectedUser = DEV_USER;
    setUser(selectedUser);
    setProfile({
      user_id: key,
      full_name: key === 'admin' ? 'Admin' : 'Demo User',
      role_title: key === 'admin' ? 'Admin' : 'Demo',
      requested_access: 'staff',
      access_granted: 'staff',
      status: 'approved',
    } as UserProfile);
    localStorage.setItem('auth-profile', key);
  };

  useEffect(() => {
    let isMounted = true;

    async function initializeProfile() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser && isMounted) {
          setUser({
            ...currentUser,
            role: 'Owner',
            campusAssigned: currentUser.user_metadata?.campusAssigned ?? [],
          });
          await loadUserProfile(currentUser.id);
          setLoading(false);
          return;
        }
      } catch (initError) {
        console.warn('AuthProvider: Error getting current user:', initError);
      }

      if (isMounted) {
        const savedProfile = (localStorage.getItem('auth-profile') || 'demo') as 'demo' | 'admin' | 'dev';
        applyDemoProfile(savedProfile);
        setLoading(false);
      }
    }

    initializeProfile();

    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          ...session.user,
          role: 'Owner',
          campusAssigned: session.user.user_metadata?.campusAssigned ?? [],
        });
        loadUserProfile(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const isAuthenticated = user !== null;

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error: signInError } = await authService.signIn(email, password);
      if (signInError) throw signInError;
      
      if (data?.user) {
        setUser({
          ...data.user,
          role: 'Owner',
          campusAssigned: data.user.user_metadata?.campusAssigned ?? [],
        });
        await loadUserProfile(data.user.id);
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
      const { error: signUpError } = await authService.signUp(email, password);
      if (signUpError) throw signUpError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await authService.signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed';
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
      setProfile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  };

  const switchProfile = (target: 'demo' | 'admin' | 'dev') => {
    applyDemoProfile(target);
  };

  const refreshProfile = async () => {
    if (user && !isDemoEmail(user.email)) {
      await loadUserProfile(user.id);
    }
  };

  const isDemoAccount = !!user && isDemoEmail(user.email);
  const accessType: AccessType = isDemoAccount ? 'staff' : profile?.access_granted ?? 'vendor';
  const requiresOnboarding = !!user && !isDemoAccount && !profileLoading && !profile;

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated,
    switchProfile,
    profile,
    profileLoading,
    refreshProfile,
    requiresOnboarding,
    accessType,
    isDemoAccount,
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
