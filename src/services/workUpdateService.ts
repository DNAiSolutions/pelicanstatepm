import { supabase } from './supabaseClient';
import type { WorkUpdate } from '../types';

export const workUpdateService = {
  // Get all work updates
  async getWorkUpdates(filters?: {
    work_request_id?: string;
    update_type?: 'Status' | 'Schedule Change' | 'Delay' | 'Completion' | 'Note';
  }) {
    let query = supabase.from('work_updates').select('*');

    if (filters?.work_request_id) {
      query = query.eq('work_request_id', filters.work_request_id);
    }
    if (filters?.update_type) {
      query = query.eq('update_type', filters.update_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get single work update
  async getWorkUpdate(id: string) {
    const { data, error } = await supabase
      .from('work_updates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Get updates for a work request
  async getUpdatesForWorkRequest(workRequestId: string) {
    const { data, error } = await supabase
      .from('work_updates')
      .select('*')
      .eq('work_request_id', workRequestId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Create new work update
  async createWorkUpdate(
    update: Omit<WorkUpdate, 'id' | 'created_at'>
  ) {
    const { data, error } = await supabase
      .from('work_updates')
      .insert([update])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Create status update
  async createStatusUpdate(
    workRequestId: string,
    message: string,
    createdBy: string
  ) {
    return this.createWorkUpdate({
      work_request_id: workRequestId,
      update_type: 'Status',
      message,
      created_by: createdBy,
      affects_timeline: false,
    });
  },

  // Create schedule change update
  async createScheduleChangeUpdate(
    workRequestId: string,
    message: string,
    newCompletionDate: string,
    createdBy: string
  ) {
    return this.createWorkUpdate({
      work_request_id: workRequestId,
      update_type: 'Schedule Change',
      message,
      created_by: createdBy,
      affects_timeline: true,
      new_completion_date: newCompletionDate,
    });
  },

  // Create delay notification
  async createDelayNotification(
    workRequestId: string,
    message: string,
    newCompletionDate: string,
    createdBy: string
  ) {
    return this.createWorkUpdate({
      work_request_id: workRequestId,
      update_type: 'Delay',
      message,
      created_by: createdBy,
      affects_timeline: true,
      new_completion_date: newCompletionDate,
    });
  },

  // Create completion update
  async createCompletionUpdate(
    workRequestId: string,
    message: string,
    createdBy: string
  ) {
    return this.createWorkUpdate({
      work_request_id: workRequestId,
      update_type: 'Completion',
      message,
      created_by: createdBy,
      affects_timeline: false,
    });
  },

  // Create general note
  async createNote(
    workRequestId: string,
    message: string,
    createdBy: string
  ) {
    return this.createWorkUpdate({
      work_request_id: workRequestId,
      update_type: 'Note',
      message,
      created_by: createdBy,
      affects_timeline: false,
    });
  },

  // Delete work update
  async deleteWorkUpdate(id: string) {
    const { error } = await supabase
      .from('work_updates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Get timeline-affecting updates
  async getTimelineAffectingUpdates(workRequestId: string) {
    const { data, error } = await supabase
      .from('work_updates')
      .select('*')
      .eq('work_request_id', workRequestId)
      .eq('affects_timeline', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get delays for a work request
  async getDelays(workRequestId: string) {
    const { data, error } = await supabase
      .from('work_updates')
      .select('*')
      .eq('work_request_id', workRequestId)
      .eq('update_type', 'Delay')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get all recent delays (across all work requests)
  async getRecentDelays(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('work_updates')
      .select('*')
      .eq('update_type', 'Delay')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get update history with counts by type
  async getUpdateHistorySummary(workRequestId: string) {
    const updates = await this.getUpdatesForWorkRequest(workRequestId);

    const summary = {
      total: updates?.length || 0,
      byType: {
        Status: 0,
        'Schedule Change': 0,
        Delay: 0,
        Completion: 0,
        Note: 0,
      },
      timelineChanges: 0,
    };

    updates?.forEach((update: WorkUpdate) => {
      if (update.update_type in summary.byType) {
        summary.byType[update.update_type as keyof typeof summary.byType]++;
      }
      if (update.affects_timeline) {
        summary.timelineChanges++;
      }
    });

    return summary;
  },

  // Get latest update
  async getLatestUpdate(workRequestId: string) {
    const { data, error } = await supabase
      .from('work_updates')
      .select('*')
      .eq('work_request_id', workRequestId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  },
};
