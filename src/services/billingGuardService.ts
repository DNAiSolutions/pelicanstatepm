import type { Invoice, Milestone } from '../types';
import { contractService } from './contractService';
import { workRequestService } from './workRequestService';
import { projectService } from './projectService';

type InvoiceCheckResult = {
  allowed: boolean;
  reasons: string[];
};

export const billingGuardService = {
  async evaluateInvoice(invoice: Invoice): Promise<InvoiceCheckResult> {
    const reasons: string[] = [];

    const contract = invoice.contract_id ? await contractService.getById(invoice.contract_id) : undefined;
    if (!contract) {
      reasons.push('Invoice must reference a contract for financial governance.');
    }

    if (contract?.contract_type === 'Fixed' && contract.contract_value !== undefined) {
      const existingValue = await this.getAmountInvoiced(contract.id);
      if (existingValue + invoice.total_amount > contract.contract_value * 1.01) {
        reasons.push('Cannot invoice beyond contract value without an approved change order.');
      }
    }

    if (contract?.contract_type === 'CostPlus') {
      const ledgerEntries = await contractService.listCostLedger(invoice.project_id || '', contract.id);
      const approvedCosts = ledgerEntries.reduce((sum, entry) => sum + (entry.actual_amount || entry.committed_amount || 0), 0);
      if (approvedCosts <= 0) {
        reasons.push('Cost-plus invoices require posted cost ledger entries.');
      }
      if (invoice.total_amount > approvedCosts * (1 + (contract.fee_percentage || 0) / 100) + 1) {
        reasons.push('Cost-plus invoice exceeds earned amount from ledger + fee.');
      }
    }

    if (contract?.contract_type === 'T&M') {
      const ledgerEntries = await contractService.listCostLedger(invoice.project_id || '', contract.id);
      const laborEntries = ledgerEntries.filter((entry) => entry.category === 'Labor');
      if (laborEntries.length === 0) {
        reasons.push('T&M invoices require logged labor entries.');
      }
    }

    if (contract?.billing_method === 'Milestone') {
      if (!invoice.billing_reference_id) {
        reasons.push('Milestone invoices must reference a milestone.');
      } else {
        const milestone = await this.findMilestone(contract.id, invoice.billing_reference_id);
        if (!milestone) {
          reasons.push('Referenced milestone not found.');
        } else if (!['ReadyToBill', 'Invoiced', 'Paid'].includes(milestone.status)) {
          reasons.push('Milestone is not marked ReadyToBill.');
        }
      }
    }

    if (contract?.billing_method === 'Progress') {
      const sov = await contractService.getScheduleOfValues(contract.id);
      const earned = sov.reduce((sum, entry) => sum + entry.amount_earned, 0);
      if (invoice.total_amount > earned + 1) {
        reasons.push('Progress billing exceeds earned revenue from Schedule of Values.');
      }
    }

    if (invoice.project_id) {
      const project = await projectService.getProject(invoice.project_id);
      if (project) {
        const workOrders = await workRequestService.getWorkRequests({});
        const projectOrders = workOrders.filter((wr) => wr.project_id === invoice.project_id);
        const needsPermit = projectOrders.some((wo) => wo.category === 'Construction' && wo.status !== 'Approved');
        if (needsPermit && invoice.status !== 'Draft') {
          reasons.push('Cannot submit invoice while open construction permits are pending.');
        }
      }
    }

    return {
      allowed: reasons.length === 0,
      reasons,
    };
  },

  async canInvoiceMilestone(contractId: string, milestoneId: string): Promise<InvoiceCheckResult> {
    const milestone = await this.findMilestone(contractId, milestoneId);
    if (!milestone) {
      return { allowed: false, reasons: ['Milestone not found.'] };
    }
    if (!['ReadyToBill', 'Invoiced', 'Paid'].includes(milestone.status)) {
      return { allowed: false, reasons: ['Milestone not marked ReadyToBill.'] };
    }
    return { allowed: true, reasons: [] };
  },

  async getAmountInvoiced(contractId: string): Promise<number> {
    const milestones = await contractService.getMilestones(contractId);
    return milestones
      .filter((milestone) => ['Invoiced', 'Paid'].includes(milestone.status))
      .reduce((sum, milestone) => sum + milestone.amount, 0);
  },

  async findMilestone(contractId: string, milestoneId: string): Promise<Milestone | undefined> {
    const milestones = await contractService.getMilestones(contractId);
    return milestones.find((milestone) => milestone.id === milestoneId);
  },
};
