import { mockFinancialAuditLog, type FinancialAuditEntry } from '../data/pipeline';

const createId = () => `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const auditLogService = {
  record(params: Omit<FinancialAuditEntry, 'id' | 'createdAt'> & { createdAt?: string }): FinancialAuditEntry {
    const entry: FinancialAuditEntry = {
      ...params,
      id: createId(),
      createdAt: params.createdAt || new Date().toISOString(),
    };
    mockFinancialAuditLog.push(entry);
    return entry;
  },

  listByEntity(entityId: string): FinancialAuditEntry[] {
    return mockFinancialAuditLog.filter((entry) => entry.entityId === entityId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
