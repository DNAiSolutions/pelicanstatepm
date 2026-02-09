import { supabase } from './supabaseClient';
import type { WorkRequest } from '../types';

export const workRequestService = {
  // Get all work requests (with filters)
  async getWorkRequests(filters?: {
    status?: string;
    campus_id?: string;
    category?: string;
  }) {
    let query = supabase.from('work_requests').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.campus_id) {
      query = query.eq('campus_id', filters.campus_id);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get single work request
  async getWorkRequest(id: string) {
    const { data, error } = await supabase
      .from('work_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Create new work request
  async createWorkRequest(workRequest: Omit<WorkRequest, 'id' | 'request_number' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('work_requests')
      .insert([workRequest])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update work request
  async updateWorkRequest(id: string, updates: Partial<WorkRequest>) {
    const { data, error } = await supabase
      .from('work_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update work request status
  async updateWorkRequestStatus(id: string, status: string) {
    return this.updateWorkRequest(id, { status } as any);
  },

  // Delete work request
  async deleteWorkRequest(id: string) {
    const { error } = await supabase
      .from('work_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Get work request counts by status
  async getWorkRequestCounts() {
    const { data, error } = await supabase
      .from('work_requests')
      .select('status', { count: 'exact' });
    
    if (error) throw error;

    const counts = {
      intake: 0,
      scoping: 0,
      estimate: 0,
      approval: 0,
      schedule: 0,
      progress: 0,
      complete: 0,
      invoice: 0,
      paid: 0,
    };

    data?.forEach((item: any) => {
      const status = item.status.toLowerCase();
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });

    return counts;
  },

  // Get requests needing approval
  async getRequestsNeedingApproval() {
    const { data, error } = await supabase
      .from('work_requests')
      .select('*')
      .eq('status', 'Approval')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get active work
  async getActiveWork() {
    const { data, error } = await supabase
      .from('work_requests')
      .select('*')
      .in('status', ['Schedule', 'Progress'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get blocked items
  async getBlockedItems() {
    const { data, error } = await supabase
      .from('work_requests')
      .select('*')
      .eq('status', 'Blocked')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Search work requests
  async searchWorkRequests(query: string) {
    const { data, error } = await supabase
      .from('work_requests')
      .select('*')
      .or(`request_number.ilike.%${query}%,property.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};
