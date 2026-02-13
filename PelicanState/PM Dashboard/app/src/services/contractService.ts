import {
  mockContracts,
  mockMilestones,
  mockScheduleOfValues,
  mockCostLedgerEntries,
  type Contract,
  type Milestone,
  type ScheduleOfValuesEntry,
  type CostLedgerEntry,
  type ContractType,
  type BillingMethod,
} from '../data/pipeline';
import { authzService } from './authzService';
import { auditLogService } from './auditLogService';

type NewContractPayload = Omit<Contract, 'id' | 'status' | 'createdBy'> & {
  createdBy: string;
  status?: Contract['status'];
};

type MilestonePayload = Omit<Milestone, 'id' | 'status'> & {
  status?: Milestone['status'];
};

type ScheduleOfValuesPayload = Omit<ScheduleOfValuesEntry, 'id' | 'lastUpdated' | 'amountEarned'> & {
  percentComplete?: number;
  amountEarned?: number;
};

type CostLedgerPayload = Omit<CostLedgerEntry, 'id' | 'recordedAt'> & {
  recordedAt?: string;
};

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

export const contractService = {
  listByProject(projectId: string): Contract[] {
    return mockContracts.filter((contract) => contract.projectId === projectId);
  },

  getById(contractId: string): Contract | undefined {
    return mockContracts.find((contract) => contract.id === contractId);
  },

  create(payload: NewContractPayload): Contract {
    const newContract: Contract = {
      ...payload,
      id: id('contract'),
      status: payload.status || 'Draft',
    };
    mockContracts.push(newContract);
    return newContract;
  },

  update(contractId: string, updates: Partial<Contract>): Contract | undefined {
    const contract = this.getById(contractId);
    if (!contract) return undefined;
    Object.assign(contract, updates);
    return contract;
  },

  addMilestone(contractId: string, payload: MilestonePayload): Milestone {
    const milestone: Milestone = {
      ...payload,
      id: id('milestone'),
      contractId,
      status: payload.status || 'Pending',
    };
    mockMilestones.push(milestone);
    return milestone;
  },

  updateMilestone(milestoneId: string, updates: Partial<Milestone>): Milestone | undefined {
    const milestone = mockMilestones.find((ms) => ms.id === milestoneId);
    if (!milestone) return undefined;
    Object.assign(milestone, updates);
    return milestone;
  },

  getMilestones(contractId: string): Milestone[] {
    return mockMilestones
      .filter((milestone) => milestone.contractId === contractId)
      .sort((a, b) => {
        const aDate = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
        const bDate = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
        return aDate - bDate;
      });
  },

  addScheduleOfValues(contractId: string, payload: ScheduleOfValuesPayload): ScheduleOfValuesEntry {
    const entry: ScheduleOfValuesEntry = {
      ...payload,
      id: id('sov'),
      contractId,
      percentComplete: payload.percentComplete ?? 0,
      amountEarned: payload.amountEarned ?? 0,
      lastUpdated: new Date().toISOString(),
    };
    mockScheduleOfValues.push(entry);
    return entry;
  },

  updateScheduleOfValues(entryId: string, updates: Partial<ScheduleOfValuesEntry>): ScheduleOfValuesEntry | undefined {
    const entry = mockScheduleOfValues.find((line) => line.id === entryId);
    if (!entry) return undefined;
    Object.assign(entry, updates, { lastUpdated: new Date().toISOString() });
    return entry;
  },

  getScheduleOfValues(contractId: string): ScheduleOfValuesEntry[] {
    return mockScheduleOfValues.filter((entry) => entry.contractId === contractId);
  },

  addCostLedgerEntry(payload: CostLedgerPayload): CostLedgerEntry {
    authzService.requireRole(payload.recordedBy, ['Owner', 'Finance']);
    const entry: CostLedgerEntry = {
      ...payload,
      id: id('cle'),
      recordedAt: payload.recordedAt || new Date().toISOString(),
    };
    mockCostLedgerEntries.push(entry);
    auditLogService.record({
      entity: 'Contract',
      entityId: payload.contractId,
      action: 'LEDGER_ENTRY',
      actorId: payload.recordedBy,
      metadata: {
        entryId: entry.id,
        category: entry.category,
        committed: entry.committedAmount,
        actual: entry.actualAmount,
      },
    });
    return entry;
  },

  listCostLedger(projectId: string, contractId?: string): CostLedgerEntry[] {
    return mockCostLedgerEntries.filter((entry) => entry.projectId === projectId && (!contractId || entry.contractId === contractId));
  },

  getFinancialSummary(contractId: string) {
    const contract = this.getById(contractId);
    if (!contract) {
      return {
        contractValue: 0,
        amountBilled: 0,
        amountEarned: 0,
        retainageHeld: 0,
        retainageReleased: 0,
        grossMargin: 0,
        grossMarginPercent: 0,
      };
    }

    const milestones = this.getMilestones(contractId);
    const amountBilled = milestones.filter((ms) => ['ReadyToBill', 'Invoiced', 'Paid'].includes(ms.status)).reduce((sum, ms) => sum + ms.amount, 0);
    const retainageHeld = (contract.retainagePercentage || 0) / 100 * amountBilled;
    const ledgerEntries = mockCostLedgerEntries.filter((entry) => entry.contractId === contractId);
    const actualCost = ledgerEntries.reduce((sum, entry) => sum + (entry.actualAmount || entry.committedAmount || 0), 0);
    const amountEarned = mockScheduleOfValues
      .filter((entry) => entry.contractId === contractId)
      .reduce((sum, entry) => sum + entry.amountEarned, 0);

    const grossMargin = Math.max((contract.contractValue || amountEarned) - actualCost, 0);
    const grossMarginPercent = contract.contractValue ? clamp(grossMargin / contract.contractValue) : 0;

    return {
      contractValue: contract.contractValue,
      amountBilled,
      amountEarned,
      retainageHeld,
      retainageReleased: 0,
      grossMargin,
      grossMarginPercent,
    };
  },

  getBillingProfile(contractId: string): {
    contractType?: ContractType;
    billingMethod?: BillingMethod;
    milestones: Milestone[];
    scheduleOfValues: ScheduleOfValuesEntry[];
  } {
    const contract = this.getById(contractId);
    return {
      contractType: contract?.contractType,
      billingMethod: contract?.billingMethod,
      milestones: this.getMilestones(contractId),
      scheduleOfValues: this.getScheduleOfValues(contractId),
    };
  },
};
