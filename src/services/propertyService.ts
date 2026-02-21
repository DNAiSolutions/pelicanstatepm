import { supabase } from './supabaseClient';
import type { Property as PropertyType } from '../types';

export type Property = PropertyType;

export const propertyService = {
  // Get all properties
  async list(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as Property[];
  },

  async getProperties() {
    return this.list();
  },

  // Get property by ID
  async getProperty(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Property;
  },

  // Get property by name
  async getPropertyByName(name: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('name', name)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as Property | null;
  },

  // Create property
  async createProperty(property: Omit<Property, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('properties')
      .insert([property])
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  },

  // Update property
  async updateProperty(id: string, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  },

  // Get property name from ID
  async getPropertyName(id: string): Promise<string> {
    const property = await this.getProperty(id);
    return property?.name || 'Unknown';
  },

  // Get funding source for property
  async getFundingSource(propertyId: string): Promise<string> {
    const property = await this.getProperty(propertyId);
    return property?.funding_source || '';
  },
};
