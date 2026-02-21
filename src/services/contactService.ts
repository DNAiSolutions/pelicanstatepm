import { supabase } from './supabaseClient';
import type { Contact } from '../types';
import { mapContactRow } from '../utils/supabaseMappers';

const toContactRow = (contact: Partial<Contact>) => {
  const row: Record<string, any> = {};
  if (contact.name !== undefined) row.name = contact.name;
  if (contact.title !== undefined) row.title = contact.title;
  if (contact.company !== undefined) row.company = contact.company;
  if (contact.type !== undefined) row.type = contact.type;
  if (contact.email !== undefined) row.email = contact.email;
  if (contact.phone !== undefined) row.phone = contact.phone;
  if (contact.property_id !== undefined) row.property_id = contact.property_id;
  if (contact.preferred_channel !== undefined) row.preferred_channel = contact.preferred_channel;
  if (contact.notes !== undefined) row.notes = contact.notes;
  if (contact.client_portal_enabled !== undefined) row.client_portal_enabled = contact.client_portal_enabled;
  return row;
};

export const contactService = {
  async list(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*, contact_projects(project_id), contact_leads(lead_id)');
    
    if (error) throw error;
    return (data || []).map(mapContactRow);
  },

  async getById(id: string): Promise<Contact | undefined> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*, contact_projects(project_id), contact_leads(lead_id)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapContactRow(data) : undefined;
  },

  async create(contact: Partial<Contact>): Promise<Contact> {
    const row = toContactRow(contact);
    const { data, error } = await supabase
      .from('contacts')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    // Return the insert result directly — avoids a second network call that could
    // fail on join tables (contact_projects / contact_leads) and abort the flow.
    return mapContactRow({ ...data, contact_projects: [], contact_leads: [] });
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact | undefined> {
    const row = toContactRow(updates);
    const { data: _data, error } = await supabase
      .from('contacts')
      .update(row)
      .eq('id', id);

    if (error) throw error;
    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
  },

  async addToProject(contactId: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('contact_projects')
      .insert({ contact_id: contactId, project_id: projectId });
    if (error) throw error;
  },

  async removeFromProject(contactId: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('contact_projects')
      .delete()
      .match({ contact_id: contactId, project_id: projectId });
    if (error) throw error;
  },
};
