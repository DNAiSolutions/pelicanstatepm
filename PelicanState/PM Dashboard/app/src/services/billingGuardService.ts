import {
  getContractById,
  getMilestonesByContractId,
  getScheduleOfValuesByContractId,
  getCostLedgerByProjectId,
  getWorkOrdersByProjectId,
  getProjectById,
  type Invoice,
  type Milestone,
} from '../data/pipeline';

type InvoiceCheckResult = {
  allowed: boolean;
  reasons: string[];
};

export const billingGuardService = {
  evaluateInvoice(invoice: Invoice): InvoiceCheckResult {
    const reasons: string[] = [];

    const contract = invoice.contractId ? getContractById(invoice.contractId) : undefined;
    if (!contract) {
      reasons.push('Invoice must reference a contract for financial governance.');
    }

    if (contract?.contractType === 'Fixed' && contract.contractValue !== undefined) {
      const existingValue = this.getAmountInvoiced(contract.id);
      if (existingValue + invoice.totalAmount > contract.contractValue * 1.01) {
        reasons.push('Cannot invoice beyond contract value without an approved change order.');
      }
    }

    if (contract?.contractType === 'CostPlus') {
      const ledgerEntries = getCostLedgerByProjectId(invoice.projectId).filter((entry) => entry.contractId === contract.id);
      const approvedCosts = ledgerEntries.reduce((sum, entry) => sum + (entry.actualAmount || entry.committedAmount || 0), 0);
      if (approvedCosts <= 0) {
        reasons.push('Cost-plus invoices require posted cost ledger entries.');
      }
      if (invoice.totalAmount > approvedCosts * (1 + (contract.feePercentage || 0) / 100) + 1) {
        reasons.push('Cost-plus invoice exceeds earned amount from ledger + fee.');
      }
    }

    if (contract?.contractType === 'T&M') {
      const ledgerEntries = getCostLedgerByProjectId(invoice.projectId).filter((entry) => entry.contractId === contract.id && entry.category === 'Labor');
      if (ledgerEntries.length === 0) {
        reasons.push('T&M invoices require logged labor entries.');
      }
    }

    if (contract?.billingMethod === 'Milestone') {
      if (!invoice.billingReferenceId) {
        reasons.push('Milestone invoices must reference a milestone.');
      } else {
        const milestone = this.findMilestone(contract.id, invoice.billingReferenceId);
        if (!milestone) {
          reasons.push('Referenced milestone not found.');
        } else if (!['ReadyToBill', 'Invoiced', 'Paid'].includes(milestone.status)) {
          reasons.push('Milestone is not marked ReadyToBill.');
        }
      }
    }

    if (contract?.billingMethod === 'Progress') {
      const sov = getScheduleOfValuesByContractId(contract.id);
      const earned = sov.reduce((sum, entry) => sum + entry.amountEarned, 0);
      if (invoice.totalAmount > earned + 1) {
        reasons.push('Progress billing exceeds earned revenue from Schedule of Values.');
      }
    }

    const project = getProjectById(invoice.projectId);
    if (project) {
      const siteWorkOrders = getWorkOrdersByProjectId(invoice.projectId);
      const siteRequiresPermit = siteWorkOrders.some((wo) => wo.category === 'Construction' && wo.status !== 'Approved');
      if (siteRequiresPermit && invoice.status !== 'Draft') {
        reasons.push('Cannot submit invoice while open construction permits are pending.');
      }
      const hasHistoricWork = siteWorkOrders.some((wo) => wo.historicCompliance === undefined && wo.projectId === invoice.projectId && wo.category === 'Remodel');
      if (hasHistoricWork) {
        reasons.push('Historic compliance documentation must be uploaded before invoicing.');
      }
    }

    return {
      allowed: reasons.length === 0,
      reasons,
    };
  },

  canInvoiceMilestone(contractId: string, milestoneId: string): InvoiceCheckResult {
    const milestone = this.findMilestone(contractId, milestoneId);
    if (!milestone) {
      return { allowed: false, reasons: ['Milestone not found.'] };
    }
    if (!['ReadyToBill', 'Invoiced', 'Paid'].includes(milestone.status)) {
      return { allowed: false, reasons: ['Milestone not marked ReadyToBill.'] };
    }
    return { allowed: true, reasons: [] };
  },

  getAmountInvoiced(contractId: string): number {
    const milestones = getMilestonesByContractId(contractId);
    return milestones.filter((milestone) => ['Invoiced', 'Paid'].includes(milestone.status)).reduce((sum, milestone) => sum + milestone.amount, 0);
  },

  findMilestone(contractId: string, milestoneId: string): Milestone | undefined {
    return getMilestonesByContractId(contractId).find((milestone) => milestone.id === milestoneId);
  },
};
