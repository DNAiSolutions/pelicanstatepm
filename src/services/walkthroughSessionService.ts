import { supabase } from './supabaseClient';
import { aiService } from './aiService';
import type { WalkthroughSessionRecord, WalkthroughPlan } from '../data/pipeline';

function mapSession(row: any): WalkthroughSessionRecord {
  return {
    id: row.id,
    leadId: row.lead_id,
    projectId: row.project_id ?? undefined,
    propertyId: row.property_id ?? undefined,
    scheduledDate: row.scheduled_date,
    status: row.status as WalkthroughSessionRecord['status'],
    notes: row.notes ?? undefined,
    aiPlan: row.ai_plan ?? undefined,
    responses: row.responses ?? undefined,
    attachments: row.attachments ?? undefined,
    finalizedPlan: row.finalized_plan ?? undefined,
  };
}

export const walkthroughSessionService = {
  async list(propertyIds?: string[]): Promise<WalkthroughSessionRecord[]> {
    if (propertyIds && propertyIds.length === 0) return [];
    let query = supabase.from('walkthrough_sessions').select('*').order('scheduled_date', { ascending: true });
    if (propertyIds && propertyIds.length > 0) {
      query = query.in('property_id', propertyIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapSession);
  },

  async findByLeadId(leadId: string): Promise<WalkthroughSessionRecord | undefined> {
    const { data, error } = await supabase
      .from('walkthrough_sessions')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapSession(data) : undefined;
  },

  async ensureSession(
    leadId: string,
    params: { date?: string; notes?: string; projectId?: string; propertyId?: string } = {}
  ): Promise<WalkthroughSessionRecord> {
    const existing = await this.findByLeadId(leadId);
    if (existing) return existing;
    const insertDate = params.date || new Date().toISOString();
    return this.createFromLead(leadId, {
      date: insertDate,
      notes: params.notes,
      projectId: params.projectId,
      propertyId: params.propertyId,
    });
  },

  async getById(sessionId: string): Promise<WalkthroughSessionRecord | undefined> {
    const { data, error } = await supabase
      .from('walkthrough_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapSession(data) : undefined;
  },

  async createFromLead(
    leadId: string,
    params: { date: string; notes?: string; projectId?: string; propertyId?: string }
  ): Promise<WalkthroughSessionRecord> {
    const { data, error } = await supabase
      .from('walkthrough_sessions')
      .insert({
        lead_id: leadId,
        project_id: params.projectId ?? null,
        property_id: params.propertyId ?? null,
        scheduled_date: params.date,
        status: 'Scheduled',
        notes: params.notes,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapSession(data);
  },

  async attachPlan(sessionId: string, plan: WalkthroughPlan) {
    const { error } = await supabase
      .from('walkthrough_sessions')
      .update({ ai_plan: plan })
      .eq('id', sessionId);
    if (error) throw error;
  },

  async markInProgress(sessionId: string) {
    const { error } = await supabase
      .from('walkthrough_sessions')
      .update({ status: 'InProgress' })
      .eq('id', sessionId);
    if (error) throw error;
  },

  async complete(sessionId: string, responses: Record<string, string>) {
    const session = await this.getById(sessionId);
    if (!session?.aiPlan) {
      throw new Error('No AI plan associated with this session');
    }
    const finalizedPlan = aiService.walkthroughPlanner.finalizeExecutionPlan(responses, session.aiPlan);
    const { error } = await supabase
      .from('walkthrough_sessions')
      .update({
        status: 'Complete',
        responses,
        finalized_plan: finalizedPlan,
      })
      .eq('id', sessionId);
    if (error) throw error;
  },
};

export type WalkthroughSessionService = typeof walkthroughSessionService;
