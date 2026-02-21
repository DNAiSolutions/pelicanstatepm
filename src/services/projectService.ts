import { supabase } from './supabaseClient';
import { contractService } from './contractService';
import { permitService } from './permitService';
import { historicEvidenceService } from './historicEvidenceService';
import { mapProjectRow, mapLeadRow, mapContactRow, mapInvoiceRow } from '../utils/supabaseMappers';
import type { Project, Lead, Contact, Invoice, PermitRecord, HistoricArtifact } from '../types';

type NewProjectPayload = Omit<Project, 'id' | 'share_token' | 'client_visibility'> & {
  client_visibility?: Project['client_visibility'];
  share_token?: string;
};

const PROJECT_SELECT = '*';

const generateShareToken = () => `share-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const toProjectRow = (payload: Partial<Project>) => {
  const row: Record<string, any> = {};
  if (payload.name !== undefined) row.name = payload.name;
  if (payload.property_id !== undefined) row.property_id = payload.property_id;
  if (payload.site_id !== undefined) row.site_id = payload.site_id || null;
  if (payload.client_name !== undefined) row.client_name = payload.client_name;
  if (payload.client_phone !== undefined) row.client_phone = payload.client_phone;
  if (payload.client_email !== undefined) row.client_email = payload.client_email;
  if (payload.client_logo !== undefined) row.client_logo = payload.client_logo;
  if (payload.internal_owner_id !== undefined) row.internal_owner_id = payload.internal_owner_id;
  if (payload.prime_vendor_id !== undefined) row.prime_vendor_id = payload.prime_vendor_id;
  if (payload.status !== undefined) row.status = payload.status;
  if (payload.client_summary !== undefined) row.client_summary = payload.client_summary;
  if (payload.internal_notes !== undefined) row.internal_notes = payload.internal_notes;
  if (payload.client_visibility !== undefined) row.client_visibility = payload.client_visibility;
  if (payload.share_token !== undefined) row.share_token = payload.share_token;
  if (payload.start_date !== undefined) row.start_date = payload.start_date;
  if (payload.end_date !== undefined) row.end_date = payload.end_date;
  if (payload.total_budget !== undefined) row.total_budget = payload.total_budget;
  if (payload.spent_budget !== undefined) row.spent_budget = payload.spent_budget;
  if (payload.walkthrough_notes !== undefined) row.walkthrough_notes = payload.walkthrough_notes;
  if (payload.walkthrough_plan !== undefined) row.walkthrough_plan = payload.walkthrough_plan;
  return row;
};

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProjectRow);
  },

  async getProject(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProjectRow(data) : undefined;
  },

  async getProjectByShareToken(token: string): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('share_token', token)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProjectRow(data) : undefined;
  },

  async create(payload: NewProjectPayload): Promise<Project> {
    const row = toProjectRow({
      ...payload,
      share_token: generateShareToken(),
    });
    const { data, error } = await supabase
      .from('projects')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapProjectRow(data);
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const row = toProjectRow(updates);
    const { data, error } = await supabase
      .from('projects')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapProjectRow(data);
  },

  async getRelatedLeads(projectId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []).map(mapLeadRow);
  },

  async getInvoices(projectId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []).map(mapInvoiceRow);
  },

  async getContacts(projectId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contact_projects')
      .select('contacts(*)')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []).map((row: any) => mapContactRow(row.contacts));
  },

  async getPermits(projectId: string): Promise<PermitRecord[]> {
    return permitService.list(projectId);
  },

  async getHistoricArtifacts(projectId: string): Promise<HistoricArtifact[]> {
    return historicEvidenceService.list(projectId);
  },

  async getContract(projectId: string) {
    const contracts = await contractService.listByProject(projectId);
    return contracts[0]; // Simplification for dashboard
  },

  // Alias for legacy callers — converts camelCase to snake_case
  async createProject(payload: any): Promise<Project> {
    const normalized: any = { ...payload };
    if (payload.clientName !== undefined) normalized.client_name = payload.clientName;
    if (payload.clientEmail !== undefined) normalized.client_email = payload.clientEmail;
    if (payload.clientPhone !== undefined) normalized.client_phone = payload.clientPhone;
    if (payload.internalOwnerId !== undefined) normalized.internal_owner_id = payload.internalOwnerId;
    if (payload.primeVendorId !== undefined) normalized.prime_vendor_id = payload.primeVendorId;
    if (payload.propertyId !== undefined) normalized.property_id = payload.propertyId;
    if (payload.siteId !== undefined) normalized.site_id = payload.siteId;
    if (payload.startDate !== undefined) normalized.start_date = payload.startDate;
    if (payload.endDate !== undefined) normalized.end_date = payload.endDate;
    if (payload.totalBudget !== undefined) normalized.total_budget = payload.totalBudget;
    if (payload.spentBudget !== undefined) normalized.spent_budget = payload.spentBudget;
    if (payload.clientSummary !== undefined) normalized.client_summary = payload.clientSummary;
    if (payload.internalNotes !== undefined) normalized.internal_notes = payload.internalNotes;
    if (payload.clientVisibility !== undefined) {
      normalized.client_visibility = {
        show_budget: payload.clientVisibility.showBudget ?? true,
        show_timeline: payload.clientVisibility.showTimeline ?? true,
        show_invoices: payload.clientVisibility.showInvoices ?? true,
        show_contacts: payload.clientVisibility.showContacts ?? true,
      };
    }
    return this.create(normalized);
  },

  async linkLead(projectId: string, leadId: string): Promise<void> {
    await supabase.from('leads').update({ project_id: projectId }).eq('id', leadId);
  },

  async linkContact(projectId: string, contactId: string): Promise<void> {
    await supabase.from('contact_projects').upsert({ project_id: projectId, contact_id: contactId });
  },

  async getProjectLeads(projectId: string): Promise<Lead[]> {
    return this.getRelatedLeads(projectId);
  },

  async getProjectContacts(projectId: string): Promise<Contact[]> {
    return this.getContacts(projectId);
  },
};
