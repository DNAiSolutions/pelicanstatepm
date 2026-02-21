import { supabase } from './supabaseClient';
import { quoteService, type QuoteRecord } from './quoteService';

export type DashboardWorkStatus =
  | 'Requested'
  | 'Scoped'
  | 'AwaitingApproval'
  | 'Scheduled'
  | 'InProgress'
  | 'Blocked'
  | 'Completed'
  | 'Invoiced'
  | 'Paid';

export interface DashboardWorkRequest {
  id: string;
  request_number: string;
  title: string;
  status: DashboardWorkStatus;
  raw_status: string;
  priority?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  estimated_cost?: number | null;
}

export interface DashboardProperty {
  id: string;
  name: string;
  priority?: string | null;
  funding_source?: string | null;
}

export interface DashboardProject {
  id: string;
  name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  spent_budget: number;
  status: string;
  property_id: string | null;
}

export interface DashboardInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  submitted_at?: string | null;
  paid_at?: string | null;
}

export interface DashboardMetrics {
  active_value: number;
  in_progress_count: number;
  awaiting_approval_count: number;
  completed_count: number;
  blocked_count: number;
}

export type DashboardQuote = QuoteRecord;

const STATUS_MAP: Record<string, DashboardWorkStatus> = {
  Intake: 'Requested',
  Scoping: 'Scoped',
  Estimate: 'AwaitingApproval',
  Approval: 'AwaitingApproval',
  Schedule: 'Scheduled',
  Progress: 'InProgress',
  Complete: 'Completed',
  Invoice: 'Invoiced',
  Paid: 'Paid',
};

function normalizeStatus(status?: string | null): DashboardWorkStatus {
  if (!status) return 'Requested';
  return STATUS_MAP[status] ?? 'Requested';
}

export function mapMetrics(workRequests: DashboardWorkRequest[]): DashboardMetrics {
  const initial: DashboardMetrics = {
    active_value: 0,
    in_progress_count: 0,
    awaiting_approval_count: 0,
    completed_count: 0,
    blocked_count: 0,
  };

  return workRequests.reduce((acc, request) => {
    acc.active_value += request.estimated_cost ?? 0;
    switch (request.status) {
      case 'InProgress':
      case 'Scheduled':
        acc.in_progress_count += 1;
        break;
      case 'AwaitingApproval':
        acc.awaiting_approval_count += 1;
        break;
      case 'Completed':
        acc.completed_count += 1;
        break;
      case 'Blocked':
        acc.blocked_count += 1;
        break;
    }
    return acc;
  }, initial);
}

export async function fetchAdminWorkRequests(propertyIds?: string[]): Promise<DashboardWorkRequest[]> {
  if (propertyIds && propertyIds.length === 0) return [];
  let query = supabase
    .from('work_requests')
    .select(
      `
        id,
        request_number,
        property,
        description,
        status,
        priority,
        estimated_cost,
        property_id,
        properties(id, name, priority)
      `
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (propertyIds && propertyIds.length > 0) {
    query = query.in('property_id', propertyIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const normalizedStatus = normalizeStatus(row.status);
    return {
      id: row.id,
      request_number: row.request_number ?? 'WR-UNKNOWN',
      title: row.property || row.description || 'Work Request',
      status: normalizedStatus,
      raw_status: row.status ?? 'Unknown',
      priority: row.priority,
      property_id: row.property_id ?? row.properties?.id ?? null,
      property_name: row.properties?.name ?? null,
      estimated_cost: row.estimated_cost ?? null,
    } satisfies DashboardWorkRequest;
  });
}

export async function fetchAdminProperties(propertyIds?: string[]): Promise<DashboardProperty[]> {
  if (propertyIds && propertyIds.length === 0) return [];
  let query = supabase.from('properties').select('id, name, priority, funding_source').order('name', { ascending: true });
  if (propertyIds && propertyIds.length > 0) {
    query = query.in('id', propertyIds);
  }
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    priority: row.priority ?? null,
    funding_source: row.funding_source ?? null,
  } satisfies DashboardProperty));
}

export async function fetchAdminInvoices(propertyIds?: string[]): Promise<DashboardInvoice[]> {
  if (propertyIds && propertyIds.length === 0) return [];
  let query = supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status, submitted_at, paid_at, property_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (propertyIds && propertyIds.length > 0) {
    query = query.in('property_id', propertyIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    invoice_number: row.invoice_number ?? 'INV-UNKNOWN',
    total_amount: Number(row.total_amount ?? 0),
    status: row.status ?? 'Draft',
    submitted_at: row.submitted_at,
    paid_at: row.paid_at,
  } satisfies DashboardInvoice));
}
export async function fetchAdminProjects(propertyIds?: string[], limit = 8): Promise<DashboardProject[]> {
  if (propertyIds && propertyIds.length === 0) return [];
  let query = supabase
    .from('projects')
    .select('id, name, client_name, start_date, end_date, total_budget, spent_budget, status, property_id')
    .order('created_at', { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (propertyIds && propertyIds.length > 0) {
    query = query.in('property_id', propertyIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    client_name: row.client_name,
    start_date: row.start_date,
    end_date: row.end_date,
    total_budget: Number(row.total_budget ?? 0),
    spent_budget: Number(row.spent_budget ?? 0),
    status: row.status,
    property_id: row.property_id ?? null,
  } satisfies DashboardProject));
}

export async function fetchAdminQuotes(propertyIds: string[], limit = 8): Promise<DashboardQuote[]> {
  if (propertyIds.length === 0) return [];
  return quoteService.listByProperties(propertyIds, { limit });
}
