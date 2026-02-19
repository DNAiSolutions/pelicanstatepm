import { supabase } from './supabaseClient';

export type AccessType = 'vendor' | 'staff';
export type ProfileStatus = 'pending' | 'approved' | 'denied';

export interface UserProfile {
  user_id: string;
  full_name?: string | null;
  role_title?: string | null;
  department?: string | null;
  team_size?: string | null;
  requested_access: AccessType;
  access_granted: AccessType;
  status: ProfileStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertProfileInput {
  userId: string;
  fullName?: string;
  roleTitle?: string;
  department?: string;
  teamSize?: string;
  requestedAccess: AccessType;
  status: ProfileStatus;
  accessGranted: AccessType;
}

export const userProfileService = {
  async upsertProfile(input: UpsertProfileInput) {
    const { userId, fullName, roleTitle, department, teamSize, requestedAccess, status, accessGranted } = input;
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          full_name: fullName,
          role_title: roleTitle,
          department,
          team_size: teamSize,
          requested_access: requestedAccess,
          status,
          access_granted: accessGranted,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async listProfiles() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async updateAccess(userId: string, updates: Partial<Pick<UserProfile, 'status' | 'access_granted'>>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
