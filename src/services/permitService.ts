import type { PermitRecord } from '../types';
import { supabase } from './supabaseClient';
import { mapPermitRow, mapPermitInspectionRow } from '../utils/supabaseMappers';

type PermitPayload = Omit<PermitRecord, 'id' | 'created_at' | 'updated_at'>;

type PermitInspection = {
  id: string;
  permit_id: string;
  inspection_type: string;
  scheduled_at?: string;
  result?: string;
  inspector_notes?: string;
  attachments: string[];
};

type InspectionPayload = Omit<PermitInspection, 'id'>;

const toPermitRow = (payload: Partial<PermitRecord>) => {
  const row: Record<string, any> = {};
  if (payload.project_id !== undefined) row.project_id = payload.project_id;
  if (payload.work_order_id !== undefined) row.work_order_id = payload.work_order_id;
  if (payload.jurisdiction_name !== undefined) row.jurisdiction_name = payload.jurisdiction_name;
  if (payload.jurisdiction_type !== undefined) row.jurisdiction_type = payload.jurisdiction_type;
  if (payload.permit_type !== undefined) row.permit_type = payload.permit_type;
  if (payload.code_set !== undefined) row.code_set = payload.code_set;
  if (payload.code_version !== undefined) row.code_version = payload.code_version;
  if (payload.reviewer_authority !== undefined) row.reviewer_authority = payload.reviewer_authority;
  if (payload.reviewer_contact !== undefined) row.reviewer_contact = payload.reviewer_contact;
  if (payload.status !== undefined) row.status = payload.status;
  if (payload.submission_date !== undefined) row.submission_date = payload.submission_date;
  if (payload.approval_date !== undefined) row.approval_date = payload.approval_date;
  if (payload.expiration_date !== undefined) row.expiration_date = payload.expiration_date;
  if (payload.fees !== undefined) row.fees = payload.fees;
  if (payload.attachments !== undefined) row.attachments = payload.attachments;
  if (payload.notes !== undefined) row.notes = payload.notes;
  return row;
};

export const permitService = {
  async list(projectId: string): Promise<PermitRecord[]> {
    const { data, error } = await supabase
      .from('permits')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPermitRow);
  },

  async listInspections(permitId: string): Promise<PermitInspection[]> {
    const { data, error } = await supabase
      .from('permit_inspections')
      .select('*')
      .eq('permit_id', permitId)
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapPermitInspectionRow);
  },

  async create(payload: PermitPayload): Promise<PermitRecord> {
    const { data, error } = await supabase
      .from('permits')
      .insert([toPermitRow(payload)])
      .select('*')
      .single();
    if (error) throw error;
    return mapPermitRow(data);
  },

  async update(permitId: string, updates: Partial<PermitRecord>): Promise<PermitRecord | undefined> {
    const { data, error } = await supabase
      .from('permits')
      .update(toPermitRow(updates))
      .eq('id', permitId)
      .select('*')
      .single();
    if (error) throw error;
    return mapPermitRow(data);
  },

  async addInspection(payload: InspectionPayload): Promise<PermitInspection> {
    const { data, error } = await supabase
      .from('permit_inspections')
      .insert([
        {
          permit_id: payload.permit_id,
          inspection_type: payload.inspection_type,
          scheduled_at: payload.scheduled_at ?? null,
          result: payload.result ?? null,
          inspector_notes: payload.inspector_notes ?? null,
          attachments: payload.attachments ?? [],
        },
      ])
      .select('*')
      .single();
    if (error) throw error;
    return mapPermitInspectionRow(data);
  },
};
