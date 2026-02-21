import { supabase } from './supabaseClient';
import type { Lead, IntakeChannel, Priority } from '../types';
import { mapLeadRow } from '../utils/supabaseMappers';

export interface LeadIntakeFormInput {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  propertyId: string;
  projectId?: string;
  issueSummary: string;
  jobAddress: string;
  urgency: Priority;
  accessNotes: string;
  attachments: string[];
  intakeChannel: IntakeChannel;
  estimatedValue: number;
  notes: string;
  recordedById?: string;
  preferredChannel: 'Email' | 'Phone' | 'Text';
  callSource: string;
  handledBy: string;
  submissionSource: 'Web' | 'Internal';
}

const toLeadRow = (lead: Partial<Lead>) => {
  const row: Record<string, any> = {};
  if (lead.company_name !== undefined) row.company_name = lead.company_name;
  if (lead.contact_name !== undefined) row.contact_name = lead.contact_name;
  if (lead.email !== undefined) row.email = lead.email;
  if (lead.phone !== undefined) row.phone = lead.phone;
  if (lead.stage !== undefined) row.stage = lead.stage;
  if (lead.source !== undefined) row.source = lead.source;
  if (lead.estimated_value !== undefined) row.estimated_value = lead.estimated_value;
  if (lead.next_step !== undefined) row.next_step = lead.next_step;
  if (lead.notes !== undefined) row.notes = lead.notes;
  if (lead.property_id !== undefined) row.property_id = lead.property_id;
  if (lead.project_id !== undefined) row.project_id = lead.project_id;
  if (lead.intake_metadata !== undefined) row.intake_metadata = lead.intake_metadata;
  if (lead.intake_channel !== undefined) row.intake_channel = lead.intake_channel;
  if (lead.recommended_next_step !== undefined) row.recommended_next_step = lead.recommended_next_step;
  if (lead.decision_confidence !== undefined) row.decision_confidence = lead.decision_confidence;
  if (lead.decision_notes !== undefined) row.decision_notes = lead.decision_notes;
  if (lead.job_address !== undefined) row.job_address = lead.job_address;
  if (lead.urgency !== undefined) row.urgency = lead.urgency;
  if (lead.access_notes !== undefined) row.access_notes = lead.access_notes;
  if (lead.attachments !== undefined) row.attachments = lead.attachments;
  if (lead.follow_up_status !== undefined) row.follow_up_status = lead.follow_up_status;
  if (lead.preferred_channel !== undefined) row.preferred_channel = lead.preferred_channel;
  if (lead.call_source !== undefined) row.call_source = lead.call_source;
  if (lead.handled_by !== undefined) row.handled_by = lead.handled_by;
  if (lead.walkthrough_scheduled !== undefined) row.walkthrough_scheduled = lead.walkthrough_scheduled;
  if (lead.walkthrough_date !== undefined) row.walkthrough_date = lead.walkthrough_date;
  if (lead.walkthrough_event_id !== undefined) row.walkthrough_event_id = lead.walkthrough_event_id;
  if (lead.walkthrough_notes !== undefined) row.walkthrough_notes = lead.walkthrough_notes;
  if (lead.project_type !== undefined) row.project_type = lead.project_type;
  if (lead.walkthrough_prep_brief !== undefined) row.walkthrough_prep_brief = lead.walkthrough_prep_brief;
  if (lead.walkthrough_session_ids !== undefined) row.walkthrough_session_ids = lead.walkthrough_session_ids;
  if (lead.walkthrough_plan !== undefined) row.walkthrough_plan = lead.walkthrough_plan;
  return row;
};

export const leadService = {
  async list(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, contact_leads(contact_id)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapLeadRow);
  },

  async getById(id: string): Promise<Lead | undefined> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, contact_leads(contact_id)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapLeadRow(data) : undefined;
  },

  async create(lead: Partial<Lead>): Promise<Lead> {
    const row = toLeadRow(lead);
    const { data, error } = await supabase
      .from('leads')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return mapLeadRow(data);
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    const row = toLeadRow(updates);
    const { data, error } = await supabase
      .from('leads')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapLeadRow(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  },

  async linkContact(leadId: string, contactId: string): Promise<void> {
    const { error } = await supabase
      .from('contact_leads')
      .insert({ lead_id: leadId, contact_id: contactId });
    if (error) throw error;
  },

  async createFromIntake(input: LeadIntakeFormInput): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        company_name: input.companyName,
        contact_name: input.contactName,
        email: input.email,
        phone: input.phone,
        property_id: input.propertyId,
        project_id: input.projectId,
        intake_channel: input.intakeChannel,
        estimated_value: input.estimatedValue,
        notes: input.notes,
        urgency: input.urgency,
        job_address: input.jobAddress,
        access_notes: input.accessNotes,
        attachments: input.attachments,
        preferred_channel: input.preferredChannel,
        call_source: input.callSource,
        handled_by: input.handledBy,
        stage: 'New',
        source: input.submissionSource === 'Web' ? 'Client Portal' : 'Inbound'
      }])
      .select()
      .single();

    if (error) throw error;
    return mapLeadRow(data);
  },

  async scheduleWalkthrough(id: string, options: { date: string; notes?: string }): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update({
        walkthrough_scheduled: true,
        walkthrough_date: options.date,
        walkthrough_notes: options.notes,
        stage: 'Walkthrough'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapLeadRow(data);
  },

  async listIntakeHistory(leadId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lead_intake_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('captured_at', { ascending: false });

    if (error) return [];
    return data || [];
  }
};
