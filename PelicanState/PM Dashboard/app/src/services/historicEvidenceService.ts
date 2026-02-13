import {
  mockHistoricArtifacts,
  type HistoricArtifact,
  type HistoricArtifactType,
  type HistoricReviewStatus,
  getHistoricArtifactsByProject,
} from '../data/pipeline';
import { auditLogService } from './auditLogService';

const createId = () => `artifact-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

type ArtifactPayload = {
  projectId: string;
  workOrderId?: string;
  artifactType: HistoricArtifactType;
  description: string;
  evidenceUrls: string[];
  reviewerRequired: boolean;
};

export const historicEvidenceService = {
  list(projectId: string): HistoricArtifact[] {
    return getHistoricArtifactsByProject(projectId);
  },

  create(payload: ArtifactPayload): HistoricArtifact {
    const artifact: HistoricArtifact = {
      ...payload,
      id: createId(),
      reviewStatus: payload.reviewerRequired ? 'Submitted' : 'Approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockHistoricArtifacts.push(artifact);
    auditLogService.record({
      entity: 'AI',
      entityId: artifact.id,
      action: 'HISTORIC_ARTIFACT',
      actorId: 'system',
      metadata: { type: artifact.artifactType },
    });
    return artifact;
  },

  update(artifactId: string, updates: Partial<HistoricArtifact>): HistoricArtifact | undefined {
    const artifact = mockHistoricArtifacts.find((item) => item.id === artifactId);
    if (!artifact) return undefined;
    Object.assign(artifact, updates, { updatedAt: new Date().toISOString() });
    return artifact;
  },

  setReviewStatus(artifactId: string, status: HistoricReviewStatus, reviewerId: string, reviewerNotes?: string) {
    const artifact = this.update(artifactId, {
      reviewStatus: status,
      reviewerId,
      reviewerNotes,
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
