import { supabase } from './supabaseClient';
import type { Invoice } from '../types';
import { mapInvoiceRow } from '../utils/supabaseMappers';

const toInvoiceRow = (invoice: Partial<Invoice>) => {
  const row: Record<string, any> = {};
  if (invoice.invoice_number !== undefined) row.invoice_number = invoice.invoice_number;
  if (invoice.project_id !== undefined) row.project_id = invoice.project_id;
  if (invoice.contract_id !== undefined) row.contract_id = invoice.contract_id;
  if (invoice.work_order_ids !== undefined) row.work_order_ids = invoice.work_order_ids;
  if (invoice.property_id !== undefined) row.property_id = invoice.property_id;
  if (invoice.funding_code !== undefined) row.funding_source = invoice.funding_code;
  if (invoice.prime_vendor_id !== undefined) row.prime_vendor_id = invoice.prime_vendor_id;
  if (invoice.billing_reference_id !== undefined) row.billing_reference_id = invoice.billing_reference_id;
  if (invoice.line_items !== undefined) row.line_items = invoice.line_items;
  if (invoice.total_amount !== undefined) row.total_amount = invoice.total_amount;
  if (invoice.retainage_withheld !== undefined) row.retainage_withheld = invoice.retainage_withheld;
  if (invoice.retainage_released !== undefined) row.retainage_released = invoice.retainage_released;
  if (invoice.gross_margin_snapshot !== undefined) row.gross_margin_snapshot = invoice.gross_margin_snapshot;
  if (invoice.status !== undefined) row.status = invoice.status;
  if (invoice.payment_method !== undefined) row.payment_method = invoice.payment_method;
  if (invoice.payment_reference !== undefined) row.payment_reference = invoice.payment_reference;
  if (invoice.submitted_at !== undefined) row.submitted_at = invoice.submitted_at;
  if (invoice.approved_at !== undefined) row.approved_at = invoice.approved_at;
  if (invoice.approved_by_id !== undefined) row.approved_by = invoice.approved_by_id;
  if (invoice.paid_at !== undefined) row.paid_at = invoice.paid_at;
  if (invoice.notes !== undefined) row.notes = invoice.notes;
  return row;
};

export const invoiceService = {
  // Get invoices
  async getInvoices(filters?: {
    property_id?: string;
    status?: string;
  }) {
    let query = supabase.from('invoices').select('*');

    if (filters?.property_id) {
      query = query.eq('property_id', filters.property_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapInvoiceRow);
  },

  // Get single invoice
  async getInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapInvoiceRow(data);
  },

  // Create invoice
  async create(invoice: Partial<Invoice>) {
    const row = toInvoiceRow(invoice);
    const { data, error } = await supabase
      .from('invoices')
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return mapInvoiceRow(data);
  },

  // Update invoice
  async update(id: string, updates: Partial<Invoice>) {
    const row = toInvoiceRow(updates);
    const { data, error } = await supabase
      .from('invoices')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapInvoiceRow(data);
  },

  // Calculate total from line items
  calculateTotal(lineItems: { amount: number }[]): number {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  },

  // Validate invoice fields
  validateInvoice(invoice: Partial<Invoice>): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    if (!invoice.property_id) errors.property_id = 'Property is required';
    if (!invoice.line_items || invoice.line_items.length === 0) errors.line_items = 'At least one line item is required';
    return { valid: Object.keys(errors).length === 0, errors };
  },

  // Create multiple invoices split by property
  async createSplitInvoices(invoices: Partial<Invoice>[]): Promise<Invoice[]> {
    return Promise.all(invoices.map((inv) => this.create(inv)));
  },

  // Process payment
  async processPayment(id: string, paymentDetails: {
    method: string;
    reference: string;
  }) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'Paid',
        payment_method: paymentDetails.method,
        payment_reference: paymentDetails.reference,
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapInvoiceRow(data);
  },
};
