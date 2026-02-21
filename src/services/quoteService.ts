import { supabase } from './supabaseClient';
import type { QuoteLineItem } from '../data/pipeline';

export type QuoteRecordStatus = 'Draft' | 'Submitted' | 'Approved' | 'Changes Requested' | 'Rejected';

export interface QuoteRecord {
  id: string;
  workRequestId: string;
  requestNumber: string;
  title: string;
  siteName: string;
  propertyId: string | null;
  propertyName: string | null;
  status: QuoteRecordStatus;
  totalAmount: number;
  updatedAt?: string | null;
  clientContactId?: string | null;
  clientSnapshot?: Record<string, any> | null;
}

export interface QuoteDetailRecord extends QuoteRecord {
  lineItems: QuoteLineItem[];
  notes?: string | null;
  createdAt?: string | null;
  clientMessage?: string | null;
  contractText?: string | null;
  paymentSettings?: Record<string, any> | null;
}

export interface QuoteCreateInput {
  workRequestId: string;
  lineItems: QuoteLineItem[];
  totalAmount: number;
  status?: QuoteRecordStatus;
  notes?: string;
  clientContactId?: string;
  clientSnapshot?: Record<string, any>;
  clientMessage?: string;
  contractText?: string;
  paymentSettings?: Record<string, any>;
}

export const quoteService = {
  async listByProperties(propertyIds: string[], options?: { limit?: number }) {
    if (propertyIds.length === 0) return [] as QuoteRecord[];

    let query = supabase
      .from('estimates')
      .select(
        `
          id,
          work_request_id,
          total_amount,
          status,
          updated_at,
          created_at,
          line_items,
          client_contact_id,
          client_snapshot,
          work_requests!inner (
            id,
            request_number,
            property,
            description,
            property_id,
            properties ( id, name )
          )
        `
      )
      .in('work_requests.property_id', propertyIds)
      .order('updated_at', { ascending: false });

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => {
      const workRequestArray = row.work_requests;
      const workRequest = Array.isArray(workRequestArray) ? workRequestArray[0] ?? {} : workRequestArray || {};
      const propertyRecord = workRequest.properties;
      const property = Array.isArray(propertyRecord) ? propertyRecord[0] ?? {} : propertyRecord || {};
      return {
        id: row.id,
        workRequestId: row.work_request_id,
        requestNumber: workRequest.request_number ?? 'WR-UNKNOWN',
        title: workRequest.description ?? workRequest.property ?? 'Work Request',
        siteName: workRequest.property ?? 'Site',
        propertyId: workRequest.property_id ?? null,
        propertyName: property.name ?? null,
        status: (row.status ?? 'Draft') as QuoteRecordStatus,
        totalAmount: Number(row.total_amount ?? 0),
        updatedAt: row.updated_at ?? row.created_at ?? null,
        clientContactId: row.client_contact_id ?? null,
        clientSnapshot: row.client_snapshot ?? null,
      } satisfies QuoteRecord;
    });
  },

  async getById(id: string): Promise<QuoteDetailRecord | null> {
    const { data, error } = await supabase
      .from('estimates')
      .select(
        `
          id,
          work_request_id,
          total_amount,
          status,
          updated_at,
          created_at,
          line_items,
          notes,
          client_contact_id,
          client_snapshot,
          client_message,
          contract_text,
          payment_settings,
          work_requests!inner (
            id,
            request_number,
            property,
            description,
            property_id,
            properties ( id, name )
          )
        `
      )
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const workRequestArray = data.work_requests;
    const workRequest = Array.isArray(workRequestArray) ? workRequestArray[0] ?? {} : workRequestArray || {};
    const propertyRecord = workRequest.properties;
    const property = Array.isArray(propertyRecord) ? propertyRecord[0] ?? {} : propertyRecord || {};
    return {
      id: data.id,
      workRequestId: data.work_request_id,
      requestNumber: workRequest.request_number ?? 'WR-UNKNOWN',
      title: workRequest.property ?? workRequest.description ?? 'Work Request',
      siteName: workRequest.property ?? 'Site',
      propertyId: workRequest.property_id ?? null,
      propertyName: property.name ?? null,
      status: (data.status ?? 'Draft') as QuoteRecordStatus,
      totalAmount: Number(data.total_amount ?? 0),
      updatedAt: data.updated_at ?? data.created_at ?? null,
      lineItems: (data.line_items as QuoteLineItem[]) ?? [],
      notes: data.notes ?? null,
      createdAt: data.created_at ?? null,
      clientContactId: data.client_contact_id ?? null,
      clientSnapshot: data.client_snapshot ?? null,
      clientMessage: data.client_message ?? null,
      contractText: data.contract_text ?? null,
      paymentSettings: data.payment_settings ?? null,
    } satisfies QuoteDetailRecord;
  },

  async create(input: QuoteCreateInput) {
    const payload = {
      work_request_id: input.workRequestId,
      line_items: input.lineItems,
      total_amount: input.totalAmount,
      status: input.status ?? 'Draft',
      notes: input.notes ?? null,
      client_contact_id: input.clientContactId ?? null,
      client_snapshot: input.clientSnapshot ?? null,
      client_message: input.clientMessage ?? null,
      contract_text: input.contractText ?? null,
      payment_settings: input.paymentSettings ?? null,
    };

    const { data, error } = await supabase.from('estimates').insert([payload]).select('*').single();
    if (error) throw error;
    return data;
  },
};

export type QuoteService = typeof quoteService;
