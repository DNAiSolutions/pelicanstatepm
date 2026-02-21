import { supabase } from './supabaseClient';
import type { Site } from '../types';

const mapSiteRow = (row: any): Site => ({
  id: row.id,
  property_id: row.property_id ?? '',
  name: row.name ?? '',
  address: row.address ?? '',
  is_historic: Boolean(row.is_historic),
  historic_notes: row.historic_notes ?? undefined,
});

export const siteService = {
  async list(propertyId?: string): Promise<Site[]> {
    let query = supabase.from('sites').select('*').order('name', { ascending: true });
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapSiteRow);
  },

  async getById(id: string): Promise<Site | undefined> {
    const { data, error } = await supabase.from('sites').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapSiteRow(data) : undefined;
  },

  async createSite(payload: { property_id: string; name: string; address?: string; is_historic?: boolean; historic_notes?: string }): Promise<Site> {
    const { data, error } = await supabase
      .from('sites')
      .insert([
        {
          property_id: payload.property_id,
          name: payload.name,
          address: payload.address ?? '',
          is_historic: payload.is_historic ?? false,
          historic_notes: payload.historic_notes ?? null,
        },
      ])
      .select('*')
      .single();
    if (error) throw error;
    return mapSiteRow(data);
  },

  async ensureDefaultForProperty(propertyId: string, defaults: { name: string; address: string }): Promise<Site> {
    const existing = await this.list(propertyId);
    if (existing[0]) {
      return existing[0];
    }
    return this.createSite({ property_id: propertyId, name: defaults.name, address: defaults.address, is_historic: false });
  },
};

export type SiteService = typeof siteService;
