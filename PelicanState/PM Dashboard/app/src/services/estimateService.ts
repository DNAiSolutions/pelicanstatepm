import { supabase } from './supabaseClient';

export interface LineItem {
  description: string;
  labor_hours?: number;
  rate?: number;
  materials?: number;
  amount: number;
}

export interface Estimate {
  id?: string;
  work_request_id: string;
  line_items: LineItem[];
  total_amount: number;
  not_to_exceed?: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Changes Requested';
  notes?: string;
}

export const estimateService = {
  // Get estimate for work request
  async getEstimate(workRequestId: string) {
    const { data, error } = await supabase
      .from('estimates')
      .select('*')
      .eq('work_request_id', workRequestId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // Create estimate
  async createEstimate(estimate: Estimate) {
    const { data, error } = await supabase
      .from('estimates')
      .insert([estimate])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update estimate
  async updateEstimate(id: string, updates: Partial<Estimate>) {
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
  async saveDraft(workRequestId: string, lineItems: LineItem[], totalAmount: number, notes?: string) {
    const existing = await this.getEstimate(workRequestId);

    if (existing) {
      return this.updateEstimate(existing.id, {
        line_items: lineItems,
        total_amount: totalAmount,
        status: 'Draft',
        notes,
      });
    } else {
      return this.createEstimate({
        work_request_id: workRequestId,
        line_items: lineItems,
        total_amount: totalAmount,
        status: 'Draft',
        notes,
      });
    }
  },

  // Submit estimate for approval
  async submitEstimate(id: string) {
    return this.updateEstimate(id, {
      status: 'Submitted',
    });
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
  async requestChanges(id: string) {
    return this.updateEstimate(id, {
      status: 'Changes Requested',
    });
  },

  // Calculate total from line items
  calculateTotal(lineItems: LineItem[]): number {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  },

  // Validate line items
  validateLineItems(lineItems: LineItem[]): { valid: boolean; errors: string[] } {
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
