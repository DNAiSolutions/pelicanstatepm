import { supabase } from './supabaseClient';

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
  requestNumber: string;
  title: string;
  status: DashboardWorkStatus;
  rawStatus: string;
  priority?: string | null;
  campusId?: string | null;
  campusName?: string | null;
  estimatedCost?: number | null;
}

export interface DashboardCampus {
  id: string;
  name: string;
  priority?: string | null;
  fundingSource?: string | null;
}

export interface DashboardProject {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  spentBudget: number;
  status: string;
}

export interface DashboardInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  submittedAt?: string | null;
  paidAt?: string | null;
}

export interface DashboardMetrics {
  activeValue: number;
  inProgressCount: number;
  awaitingApprovalCount: number;
  completedCount: number;
  blockedCount: number;
}

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
    activeValue: 0,
    inProgressCount: 0,
    awaitingApprovalCount: 0,
    completedCount: 0,
    blockedCount: 0,
  };

  return workRequests.reduce((acc, request) => {
    acc.activeValue += request.estimatedCost ?? 0;
    switch (request.status) {
      case 'InProgress':
      case 'Scheduled':
        acc.inProgressCount += 1;
        break;
      case 'AwaitingApproval':
        acc.awaitingApprovalCount += 1;
        break;
      case 'Completed':
        acc.completedCount += 1;
        break;
      case 'Blocked':
        acc.blockedCount += 1;
        break;
    }
    return acc;
  }, initial);
}

export async function fetchAdminWorkRequests(): Promise<DashboardWorkRequest[]> {
  const { data, error } = await supabase
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
        campus_id,
        campuses(id, name, priority)
      `
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const normalizedStatus = normalizeStatus(row.status);
    return {
      id: row.id,
      requestNumber: row.request_number ?? 'WR-UNKNOWN',
      title: row.property || row.description || 'Work Request',
      status: normalizedStatus,
      rawStatus: row.status ?? 'Unknown',
      priority: row.priority,
      campusId: row.campus_id ?? row.campuses?.id ?? null,
      campusName: row.campuses?.name ?? null,
      estimatedCost: row.estimated_cost ?? null,
    } satisfies DashboardWorkRequest;
  });
}

export async function fetchAdminCampuses(): Promise<DashboardCampus[]> {
  const { data, error } = await supabase
    .from('campuses')
    .select('id, name, priority, funding_source')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    priority: row.priority ?? null,
    fundingSource: row.funding_source ?? null,
  } satisfies DashboardCampus));
}

export async function fetchAdminInvoices(): Promise<DashboardInvoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status, submitted_at, paid_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    invoiceNumber: row.invoice_number ?? 'INV-UNKNOWN',
    totalAmount: Number(row.total_amount ?? 0),
    status: row.status ?? 'Draft',
    submittedAt: row.submitted_at,
    paidAt: row.paid_at,
  } satisfies DashboardInvoice));
}
export async function fetchAdminProjects(): Promise<DashboardProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, client_name, start_date, end_date, total_budget, spent_budget, status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    startDate: row.start_date,
    endDate: row.end_date,
    totalBudget: Number(row.total_budget ?? 0),
    spentBudget: Number(row.spent_budget ?? 0),
    status: row.status,
  } satisfies DashboardProject));
}
