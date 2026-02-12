import { supabase } from './supabaseClient';
import type { WorkRequest, Priority } from '../types';

export const workRequestService = {
  // Get all work requests (with filters)
  async getWorkRequests(filters?: {
    status?: string;
    campus_id?: string;
    category?: string;
    priority?: Priority;
    is_historic?: boolean;
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
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.is_historic !== undefined) {
      query = query.eq('is_historic', filters.is_historic);
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

  // Create new work request with enhanced fields
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

  // Update work request priority
  async updateWorkRequestPriority(id: string, priority: Priority) {
    return this.updateWorkRequest(id, { priority });
  },

  // Add scope of work
  async addScopeOfWork(id: string, scopeOfWork: string) {
    return this.updateWorkRequest(id, { scope_of_work: scopeOfWork });
  },

  // Add inspection notes
  async addInspectionNotes(id: string, inspectionNotes: string) {
    return this.updateWorkRequest(id, { inspection_notes: inspectionNotes });
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

  // Get work requests by priority
  async getWorkRequestsByPriority(priority: Priority, campus_id?: string) {
    let query = supabase
      .from('work_requests')
      .select('*')
      .eq('priority', priority);
    
    if (campus_id) {
      query = query.eq('campus_id', campus_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get historic work requests
  async getHistoricWorkRequests(campus_id?: string) {
    let query = supabase
      .from('work_requests')
      .select('*')
      .eq('is_historic', true);
    
    if (campus_id) {
      query = query.eq('campus_id', campus_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
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

  // Get critical priority items
  async getCriticalItems(campus_id?: string) {
    let query = supabase
      .from('work_requests')
      .select('*')
      .eq('priority', 'Critical');
    
    if (campus_id) {
      query = query.eq('campus_id', campus_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
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
