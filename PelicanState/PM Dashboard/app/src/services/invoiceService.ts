import { supabase } from './supabaseClient';
import type { Invoice, InvoiceLineItem } from '../types';

export const invoiceService = {
  // Get invoices
  async getInvoices(filters?: {
    campus_id?: string;
    status?: string;
  }) {
    let query = supabase.from('invoices').select('*');

    if (filters?.campus_id) {
      query = query.eq('campus_id', filters.campus_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get single invoice
  async getInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Create invoice
  async createInvoice(invoice: Invoice) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update invoice
  async updateInvoice(id: string, updates: Partial<Invoice>) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Save invoice as draft
  async saveDraft(invoice: Invoice) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ ...invoice, status: 'Draft' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Submit invoice
  async submitInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Approve invoice
  async approveInvoice(id: string, approvedBy: string) {
    const { data, error } = await supabase
      .from('invoices')
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

  // Mark as paid
  async markAsPaid(id: string, paymentMethod?: string) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'Paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get invoices pending payment
  async getPendingInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .in('status', ['Submitted', 'Approved'])
      .order('submitted_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Split invoices by campus
  async createSplitInvoices(campusInvoiceMap: Map<string, Invoice>) {
    const invoices: Invoice[] = [];

    for (const [_campusId, invoice] of campusInvoiceMap) {
      const created = await this.createInvoice(invoice);
      invoices.push(created);
    }

    return invoices;
  },

  // Calculate total
  calculateTotal(lineItems: InvoiceLineItem[]): number {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  },

   // Validate invoice with ENHANCED requirements
   validateInvoice(invoice: Invoice): { valid: boolean; errors: string[] } {
     const errors: string[] = [];

     if (!invoice.campus_id) {
       errors.push('Campus is required');
     }
     if (!invoice.funding_source || invoice.funding_source.trim() === '') {
       errors.push('Funding source is required');
     }
     if (!invoice.line_items || invoice.line_items.length === 0) {
       errors.push('At least one line item is required');
     }
     if (invoice.total_amount <= 0) {
       errors.push('Total amount must be greater than 0');
     }

     // Enhanced validation: check for detailed work description
    invoice.line_items?.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Line item ${index + 1}: Description is required`);
      }
      if (!item.location || item.location.trim() === '') {
        errors.push(`Line item ${index + 1}: Location is required`);
      }
      if (!item.work_performed_notes || item.work_performed_notes.trim() === '') {
        errors.push(`Line item ${index + 1}: Work performed notes are REQUIRED (describe what work was actually done)`);
      }
       if (!item.amount || item.amount <= 0) {
         errors.push(`Line item ${index + 1}: Amount must be greater than 0`);
       }
       if (!item.rate || item.rate <= 0) {
         errors.push(`Line item ${index + 1}: Rate must be greater than 0`);
       }
     });

     return {
       valid: errors.length === 0,
       errors,
     };
   },

   // Get invoices by date range
   async getInvoicesByDateRange(startDate: Date, endDate: Date) {
     const { data, error } = await supabase
       .from('invoices')
       .select('*')
       .gte('created_at', startDate.toISOString())
       .lte('created_at', endDate.toISOString())
       .order('created_at', { ascending: false });
     if (error) throw error;
     return data;
   },

   // Get invoices by campus
   async getInvoicesByCampus(campusId: string, filters?: {
     status?: string;
     dateRange?: { start: Date; end: Date };
   }) {
     let query = supabase
       .from('invoices')
       .select('*')
       .eq('campus_id', campusId);

     if (filters?.status) {
       query = query.eq('status', filters.status);
     }

     if (filters?.dateRange) {
       query = query
         .gte('created_at', filters.dateRange.start.toISOString())
         .lte('created_at', filters.dateRange.end.toISOString());
     }

     const { data, error } = await query.order('created_at', { ascending: false });
     if (error) throw error;
     return data;
   },

   // Calculate total with detailed breakdown
   calculateTotalWithBreakdown(lineItems: InvoiceLineItem[]): {
     subtotal: number;
     itemCount: number;
     details: Array<{ description: string; amount: number }>;
   } {
     const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
     const details = lineItems.map(item => ({
       description: item.description,
       amount: item.amount,
     }));

     return {
       subtotal,
       itemCount: lineItems.length,
       details,
     };
   },
};
