import { supabase } from './supabaseClient';
import type { Estimate, EstimateLineItem } from '../types';

// Re-export as LineItem alias for backwards compatibility
export type LineItem = EstimateLineItem;

export const estimateService = {
  // Get estimate for work request
  async getEstimate(workRequestId: string): Promise<Estimate | undefined> {
    const { data, error } = await supabase
      .from('estimates')
      .select('*')
      .eq('work_request_id', workRequestId)
      .maybeSingle();
    
    if (error) throw error;
    return data || undefined;
  },

  // Create estimate
  async createEstimate(estimate: Partial<Estimate>): Promise<Estimate> {
    const { data, error } = await supabase
      .from('estimates')
      .insert([estimate])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update estimate
  async updateEstimate(id: string, updates: Partial<Estimate>): Promise<Estimate> {
    const { data, error } = await supabase
      .from('estimates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Save estimate as draft
  async saveDraft(workRequestId: string, lineItems: EstimateLineItem[], totalAmount: number, notes?: string) {
    const existing = await this.getEstimate(workRequestId);

    const payload = {
      work_request_id: workRequestId,
      line_items: lineItems,
      total_amount: totalAmount,
      status: 'Draft' as const,
      notes,
    };

    if (existing) {
      return this.updateEstimate(existing.id, payload);
    } else {
      return this.createEstimate(payload);
    }
  },

  // Submit estimate for approval
  async submitEstimate(id: string) {
    return this.updateEstimate(id, {
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
    } as Partial<Estimate>);
  },

  // Approve estimate
  async approveEstimate(id: string, approvedBy: string) {
    const { data, error } = await supabase
      .from('estimates')
      .update({
        status: 'Approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Request changes
  async requestChanges(id: string, notes?: string) {
    return this.updateEstimate(id, {
      status: 'Rejected' as Estimate['status'],
      notes,
    });
  },

  // Calculate total from line items
  calculateTotal(lineItems: EstimateLineItem[]): number {
    return lineItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  },

  // Validate line items
  validateLineItems(lineItems: EstimateLineItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    lineItems.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Line item ${index + 1}: Description is required`);
      }
      if (!item.amount || item.amount <= 0) {
        errors.push(`Line item ${index + 1}: Amount must be greater than 0`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
