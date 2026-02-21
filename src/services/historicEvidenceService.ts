import type { HistoricArtifact, HistoricArtifactType, HistoricReviewStatus } from '../types';
import { auditLogService } from './auditLogService';
import { supabase } from './supabaseClient';
import { mapHistoricArtifactRow } from '../utils/supabaseMappers';

type ArtifactPayload = {
  project_id: string;
  work_order_id?: string;
  artifact_type: HistoricArtifactType;
  description: string;
  evidence_urls: string[];
  reviewer_required: boolean;
};

const toHistoricArtifactRow = (payload: Partial<HistoricArtifact>) => {
  const row: Record<string, any> = {};
  if (payload.project_id !== undefined) row.project_id = payload.project_id;
  if (payload.work_order_id !== undefined) row.work_order_id = payload.work_order_id;
  if (payload.artifact_type !== undefined) row.artifact_type = payload.artifact_type;
  if (payload.description !== undefined) row.description = payload.description;
  if (payload.evidence_urls !== undefined) row.evidence_urls = payload.evidence_urls;
  if (payload.reviewer_required !== undefined) row.reviewer_required = payload.reviewer_required;
  if (payload.review_status !== undefined) row.review_status = payload.review_status;
  if (payload.reviewer_id !== undefined) row.reviewer_id = payload.reviewer_id;
  if (payload.reviewer_notes !== undefined) row.reviewer_notes = payload.reviewer_notes;
  return row;
};

export const historicEvidenceService = {
  async list(projectId: string): Promise<HistoricArtifact[]> {
    const { data, error } = await supabase
      .from('historic_artifacts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapHistoricArtifactRow);
  },

  async create(payload: ArtifactPayload): Promise<HistoricArtifact> {
    const { data, error } = await supabase
      .from('historic_artifacts')
      .insert([
        toHistoricArtifactRow({
          ...payload,
          review_status: payload.reviewer_required ? 'Submitted' : 'Approved',
        }),
      ])
      .select('*')
      .single();
    if (error) throw error;
    const artifact = mapHistoricArtifactRow(data);
    auditLogService.record({
      entity: 'AI',
      entityId: artifact.id,
      action: 'HISTORIC_ARTIFACT',
      actorId: 'system',
      metadata: { type: artifact.artifact_type },
    });
    return artifact;
  },

  async update(artifactId: string, updates: Partial<HistoricArtifact>): Promise<HistoricArtifact | undefined> {
    if (!Object.keys(updates).length) {
      return this.getById(artifactId);
    }
    const { data, error } = await supabase
      .from('historic_artifacts')
      .update(toHistoricArtifactRow(updates))
      .eq('id', artifactId)
      .select('*')
      .single();
    if (error) throw error;
    return mapHistoricArtifactRow(data);
  },

  async getById(id: string): Promise<HistoricArtifact | undefined> {
    const { data, error } = await supabase.from('historic_artifacts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapHistoricArtifactRow(data) : undefined;
  },

  async setReviewStatus(artifactId: string, status: HistoricReviewStatus, reviewerId: string, reviewerNotes?: string) {
    const artifact = await this.update(artifactId, {
      review_status: status,
      reviewer_id: reviewerId,
      reviewer_notes: reviewerNotes,
    });
    if (artifact) {
      auditLogService.record({
        entity: 'AI',
        entityId: artifact.id,
        action: 'HISTORIC_REVIEW',
        actorId: reviewerId,
        metadata: { status },
      });
    }
    return artifact;
  },
};
