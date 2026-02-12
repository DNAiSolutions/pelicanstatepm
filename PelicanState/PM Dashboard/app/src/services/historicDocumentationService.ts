import { supabase } from './supabaseClient';
import type { HistoricDocumentation } from '../types';

export const historicDocumentationService = {
  // Get all historic documentation
  async getHistoricDocumentation(filters?: {
    work_request_id?: string;
  }) {
    let query = supabase.from('historic_documentation').select('*');

    if (filters?.work_request_id) {
      query = query.eq('work_request_id', filters.work_request_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get single historic documentation record
  async getHistoricDocumentation_Single(id: string) {
    const { data, error } = await supabase
      .from('historic_documentation')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Get by work request ID
  async getByWorkRequestId(workRequestId: string) {
    const { data, error } = await supabase
      .from('historic_documentation')
      .select('*')
      .eq('work_request_id', workRequestId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Create new historic documentation
  async createHistoricDocumentation(
    doc: Omit<HistoricDocumentation, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('historic_documentation')
      .insert([doc])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update historic documentation
  async updateHistoricDocumentation(
    id: string,
    updates: Partial<HistoricDocumentation>
  ) {
    const { data, error } = await supabase
      .from('historic_documentation')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Add materials used
  async addMaterialsUsed(id: string, materialsUsed: string) {
    return this.updateHistoricDocumentation(id, { materials_used: materialsUsed });
  },

  // Add methods applied
  async addMethodsApplied(id: string, methodsApplied: string) {
    return this.updateHistoricDocumentation(id, { methods_applied: methodsApplied });
  },

  // Add architect guidance
  async addArchitectGuidance(id: string, architectGuidance: string) {
    return this.updateHistoricDocumentation(id, { architect_guidance: architectGuidance });
  },

  // Add compliance notes
  async addComplianceNotes(id: string, complianceNotes: string) {
    return this.updateHistoricDocumentation(id, { compliance_notes: complianceNotes });
  },

  // Add photos
  async addPhotos(id: string, photoUrls: string[]) {
    return this.updateHistoricDocumentation(id, { photo_urls: photoUrls });
  },

  // Delete historic documentation
  async deleteHistoricDocumentation(id: string) {
    const { error } = await supabase
      .from('historic_documentation')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Get detailed documentation by work request
  async getDetailedDocumentation(workRequestId: string) {
    const { data, error } = await supabase
      .from('historic_documentation')
      .select('*')
      .eq('work_request_id', workRequestId);
    if (error) throw error;
    return data?.[0];
  },
};
