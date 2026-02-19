import { supabase } from './supabaseClient';
import type { Campus as CampusType } from '../types';

export type Campus = CampusType;

export const campusService = {
  // Get all campuses
  async getCampuses() {
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data as Campus[];
  },

  // Get campus by ID
  async getCampus(id: string) {
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Campus;
  },

  // Get campus by name
  async getCampusByName(name: string) {
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .eq('name', name)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as Campus | null;
  },

  // Create campus
  async createCampus(campus: Omit<Campus, 'id'>) {
    const { data, error } = await supabase
      .from('campuses')
      .insert([campus])
      .select()
      .single();
    if (error) throw error;
    return data as Campus;
  },

  // Update campus
  async updateCampus(id: string, updates: Partial<Campus>) {
    const { data, error } = await supabase
      .from('campuses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Campus;
  },

  // Get campus name from ID
  async getCampusName(id: string): Promise<string> {
    const campus = await this.getCampus(id);
    return campus?.name || 'Unknown';
  },

  // Get funding source for campus
  async getFundingSource(campusId: string): Promise<string> {
    const campus = await this.getCampus(campusId);
    return campus?.funding_source || '';
  },
};
