import {
  mockPermitRecords,
  mockPermitInspections,
  type PermitRecord,
  type PermitInspection,
  getPermitsByProject,
  getInspectionsByPermit,
} from '../data/pipeline';

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

type PermitPayload = Omit<PermitRecord, 'id' | 'createdAt' | 'updatedAt'>;
type InspectionPayload = Omit<PermitInspection, 'id'>;

export const permitService = {
  list(projectId: string): PermitRecord[] {
    return getPermitsByProject(projectId);
  },

  listInspections(permitId: string): PermitInspection[] {
    return getInspectionsByPermit(permitId);
  },

  create(payload: PermitPayload): PermitRecord {
    const record: PermitRecord = {
      ...payload,
      id: createId('permit'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPermitRecords.push(record);
    return record;
  },

  update(permitId: string, updates: Partial<PermitRecord>): PermitRecord | undefined {
    const record = mockPermitRecords.find((permit) => permit.id === permitId);
    if (!record) return undefined;
    Object.assign(record, updates, { updatedAt: new Date().toISOString() });
    return record;
  },

  addInspection(payload: InspectionPayload): PermitInspection {
    const inspection: PermitInspection = {
      ...payload,
      id: createId('inspection'),
    };
    mockPermitInspections.push(inspection);
    return inspection;
  },
};
