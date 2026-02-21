import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/supabaseClient';
import { userProfileService, type UserProfile, type AccessType } from '../services/userProfileService';

export type UserRole = 'Owner' | 'Developer' | 'User';

export interface AuthUser extends User {
  role?: UserRole;
  propertyAssigned?: string[];
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
  profile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  requiresOnboarding: boolean;
  accessType: AccessType;
  isDevelopmentProfile: boolean;
}

const DEV_PROFILE_ID = 'dev-profile';
const DEV_PROFILE_EMAIL = import.meta.env.VITE_DEV_PROFILE_EMAIL as string | undefined;
const DEV_PROFILE_NAME = import.meta.env.VITE_DEV_PROFILE_NAME as string | undefined;
const DEV_PROFILE_ROLE = (import.meta.env.VITE_DEV_PROFILE_ROLE as UserRole | undefined) ?? 'Developer';
const DEV_PROFILE_CAMPUSES = (import.meta.env.VITE_DEV_PROFILE_CAMPUSES as string | undefined)
  ?.split(',')
  .map((value) => value.trim())
  .filter(Boolean) ?? ['Wallace'];
const DEV_PROFILE_ENABLED = import.meta.env.DEV && Boolean(DEV_PROFILE_EMAIL);
const TRUSTED_ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string) || 'support@dnai.solutions')
  .split(',')
  .map((value: string) => value.trim().toLowerCase())
  .filter(Boolean);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [devProfileActive, setDevProfileActive] = useState(false);

  const isTrustedAdminEmail = (email?: string | null) =>
    Boolean(email && TRUSTED_ADMIN_EMAILS.includes(email.toLowerCase()));

  const loadUserProfile = async (userId: string, email?: string | null) => {
    setProfileLoading(true);
    try {
      const data = await userProfileService.getProfile(userId);
      if (isTrustedAdminEmail(email)) {
        if (!data || data.status !== 'approved' || data.access_granted !== 'staff') {
          const adminProfile = await userProfileService.upsertProfile({
            userId,
            fullName: email ?? 'Pelican Admin',
            roleTitle: 'Owner / Founder',
            department: 'Operations',
            teamSize: '1-5',
            requestedAccess: 'staff',
            status: 'approved',
            accessGranted: 'staff',
          });
          setProfile(adminProfile);
        } else {
          setProfile(data);
        }
      } else {
        setProfile(data ?? null);
      }
    } catch (profileError) {
      console.warn('Failed to load profile', profileError);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const applyDevelopmentProfile = () => {
    if (!DEV_PROFILE_EMAIL) return;
    const devUser: AuthUser = {
      id: DEV_PROFILE_ID,
      aud: 'authenticated',
      email: DEV_PROFILE_EMAIL,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'development' },
      user_metadata: { developmentProfile: true },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: DEV_PROFILE_ROLE,
      propertyAssigned: DEV_PROFILE_CAMPUSES,
    };
    setUser(devUser);
    setProfile({
      user_id: DEV_PROFILE_ID,
      full_name: DEV_PROFILE_NAME ?? 'Development User',
      role_title: DEV_PROFILE_ROLE,
      requested_access: 'staff',
      access_granted: 'staff',
      status: 'approved',
    } as UserProfile);
    setDevProfileActive(true);
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
            propertyAssigned: currentUser.user_metadata?.propertyAssigned ?? [],
          });
          setDevProfileActive(false);
          await loadUserProfile(currentUser.id, currentUser.email);
          setLoading(false);
          return;
        }
      } catch (initError) {
        console.warn('AuthProvider: Error getting current user:', initError);
      }

      if (isMounted && DEV_PROFILE_ENABLED) {
        applyDevelopmentProfile();
        setLoading(false);
        return;
      }

      if (isMounted) {
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
           propertyAssigned: session.user.user_metadata?.propertyAssigned ?? [],
         });
         setDevProfileActive(false);
         loadUserProfile(session.user.id, session.user.email);
       }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setDevProfileActive(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
          propertyAssigned: data.user.user_metadata?.propertyAssigned ?? [],
        });
        setDevProfileActive(false);
        await loadUserProfile(data.user.id, data.user.email);
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
      setDevProfileActive(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user && !devProfileActive) {
      await loadUserProfile(user.id, user.email);
    }
  };

  const userIsTrustedAdmin = isTrustedAdminEmail(user?.email);
  const accessType: AccessType = devProfileActive || userIsTrustedAdmin ? 'staff' : profile?.access_granted ?? 'vendor';
  const requiresOnboarding = !!user && !devProfileActive && !profileLoading && !profile && !userIsTrustedAdmin;
  const isAuthenticated = user !== null;

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated,
    profile,
    profileLoading,
    refreshProfile,
    requiresOnboarding,
    accessType,
    isDevelopmentProfile: devProfileActive,
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
