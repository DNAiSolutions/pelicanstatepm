import { supabase } from './supabaseClient';
import type { RetainerRate, RateType } from '../types';

export const retainerRateService = {
  // Get all retainer rates
  async getRetainerRates() {
    const { data, error } = await supabase
      .from('retainer_rates')
      .select('*')
      .order('hourly_rate', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get single retainer rate
  async getRetainerRate(id: string) {
    const { data, error } = await supabase
      .from('retainer_rates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Get rate by type
  async getRateByType(rateType: RateType) {
    const { data, error } = await supabase
      .from('retainer_rates')
      .select('*')
      .eq('rate_type', rateType)
      .single();
    if (error) throw error;
    return data;
  },

  // Create new retainer rate
  async createRetainerRate(rate: Omit<RetainerRate, 'id'>) {
    const { data, error } = await supabase
      .from('retainer_rates')
      .insert([rate])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update retainer rate
  async updateRetainerRate(id: string, updates: Partial<RetainerRate>) {
    const { data, error } = await supabase
      .from('retainer_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update hourly rate
  async updateHourlyRate(id: string, hourlyRate: number) {
    return this.updateRetainerRate(id, { hourly_rate: hourlyRate });
  },

  // Delete retainer rate
  async deleteRetainerRate(id: string) {
    const { error } = await supabase
      .from('retainer_rates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Get rate matrix (all rates organized by type)
  async getRateMatrix() {
    const rates = await this.getRetainerRates();
    const matrix: Record<RateType, RetainerRate | undefined> = {
      'Manual Labor': undefined,
      'Project Management': undefined,
      'Construction Supervision': undefined,
    };

    rates?.forEach((rate: RetainerRate) => {
      matrix[rate.rate_type] = rate;
    });

    return matrix;
  },

  // Get default rates for new invoices
  async getDefaultRates() {
    const rates = await this.getRetainerRates();
    return rates || [];
  },

  // Calculate labor cost
  async calculateLaborCost(rateType: RateType, hours: number) {
    const rate = await this.getRateByType(rateType);
    if (!rate) throw new Error(`Rate type ${rateType} not found`);
    return rate.hourly_rate * hours;
  },
};
