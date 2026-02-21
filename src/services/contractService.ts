import { supabase } from './supabaseClient';
import type { Contract, Milestone, ScheduleOfValuesEntry, CostLedgerEntry } from '../types';
// authzService and auditLogService reserved for future use
// import { authzService } from './authzService';
// import { auditLogService } from './auditLogService';
import {
  mapContractRow,
  mapMilestoneRow,
  mapScheduleOfValuesRow,
  mapCostLedgerRow,
} from '../utils/supabaseMappers';

type NewContractPayload = Omit<Contract, 'id' | 'status' | 'created_at' | 'updated_at'> & {
  status?: Contract['status'];
};

type MilestonePayload = Omit<Milestone, 'id' | 'status' | 'created_at'> & {
  status?: Milestone['status'];
};


type CostLedgerPayload = Omit<CostLedgerEntry, 'id' | 'recorded_at'> & {
  recorded_at?: string;
};

const toCostLedgerRow = (payload: CostLedgerPayload) => ({
  project_id: payload.project_id,
  contract_id: payload.contract_id ?? null,
  category: payload.category,
  description: payload.description,
  committed_amount: payload.committed_amount,
  actual_amount: payload.actual_amount,
  vendor_id: payload.vendor_id,
  invoice_reference: payload.invoice_reference,
  recorded_by: payload.recorded_by,
  recorded_at: payload.recorded_at ?? new Date().toISOString(),
});

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

export const contractService = {
  async listByProject(projectId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapContractRow);
  },

  async getById(contractId: string): Promise<Contract | undefined> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapContractRow(data) : undefined;
  },

  async create(payload: NewContractPayload): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        project_id: payload.project_id,
        contract_type: payload.contract_type,
        billing_method: payload.billing_method,
        contract_value: payload.contract_value,
        fee_percentage: payload.fee_percentage,
        retainage_percentage: payload.retainage_percentage,
        start_date: payload.start_date,
        end_date: payload.end_date,
        status: payload.status || 'Draft',
        created_by: payload.created_by,
        notes: payload.notes,
      }])
      .select()
      .single();
    if (error) throw error;
    return mapContractRow(data);
  },

  // Milestones
  async getMilestones(contractId: string): Promise<Milestone[]> {
    const { data, error } = await supabase
      .from('contract_milestones')
      .select('*')
      .eq('contract_id', contractId)
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapMilestoneRow);
  },

  async addMilestone(payload: MilestonePayload): Promise<Milestone> {
    const { data, error } = await supabase
      .from('contract_milestones')
      .insert([{
        contract_id: payload.contract_id,
        name: payload.name,
        description: payload.description,
        scheduled_date: payload.scheduled_date,
        amount: payload.amount,
        status: payload.status || 'Pending',
      }])
      .select()
      .single();
    if (error) throw error;
    return mapMilestoneRow(data);
  },

  // Cost Ledger
  async listCostLedger(projectId: string, contractId?: string): Promise<CostLedgerEntry[]> {
    let query = supabase
      .from('contract_cost_ledger')
      .select('*')
      .eq('project_id', projectId);
    
    if (contractId) {
      query = query.eq('contract_id', contractId);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapCostLedgerRow);
  },

  async postCostEntry(payload: CostLedgerPayload): Promise<CostLedgerEntry> {
    const row = toCostLedgerRow(payload);
    const { data, error } = await supabase
      .from('contract_cost_ledger')
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return mapCostLedgerRow(data);
  },

  // Schedule of Values
  async getScheduleOfValues(contractId: string): Promise<ScheduleOfValuesEntry[]> {
    const { data, error } = await supabase
      .from('contract_sov')
      .select('*')
      .eq('contract_id', contractId)
      .order('budget_amount', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapScheduleOfValuesRow);
  },

  async updateSOVProgress(id: string, progress: number): Promise<ScheduleOfValuesEntry> {
    const { data, error } = await supabase
      .from('contract_sov')
      .update({ 
        percent_complete: clamp(progress, 0, 100),
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapScheduleOfValuesRow(data);
  },
};
