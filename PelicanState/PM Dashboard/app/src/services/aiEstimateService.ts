import type { Lead, Project, WalkthroughPlan, WorkOrder, WorkOrderStatus } from '../data/pipeline';
import { walkthroughSessionService } from './walkthroughSessionService';
import { estimateService, type LineItem } from './estimateService';

const BASE_RATE = 92;
const PRIORITY_RATE: Record<string, number> = {
  Critical: 30,
  High: 15,
  Medium: 0,
  Low: -5,
};

const STATUS_PRIORITY: Record<WorkOrderStatus, number> = {
  Requested: 1,
  Scoped: 2,
  AwaitingApproval: 0,
  Approved: 3,
  Scheduled: 4,
  InProgress: 5,
  Blocked: 6,
  Completed: 7,
  Invoiced: 8,
  Paid: 9,
  Closed: 10,
};

function resolveWalkthroughPlan(project: Project, leads: Lead[]): WalkthroughPlan | undefined {
  if (project.walkthroughPlan) return project.walkthroughPlan;
  for (const lead of leads) {
    if (lead.walkthroughPlan) return lead.walkthroughPlan;
    if (lead.walkthroughSessionIds?.length) {
      for (const sessionId of lead.walkthroughSessionIds) {
        const session = walkthroughSessionService.getById(sessionId);
        if (session?.finalizedPlan) return session.finalizedPlan;
        if (session?.aiPlan) return session.aiPlan;
      }
    }
  }
  return undefined;
}

function lineItemsFromPlan(plan: WalkthroughPlan): LineItem[] {
  const items: LineItem[] = [];
  plan.steps.forEach((step, index) => {
    const crewSize = Math.max(step.trades.length || 1, 1);
    const duration = Math.max(step.durationHours ?? 3, 1);
    const laborHours = Number((crewSize * duration).toFixed(1));
    const rate = BASE_RATE + (crewSize > 2 ? 12 : 0);
    const materialReserve = Math.max(step.materials.length * 220, 150);
    const amount = Math.round(laborHours * rate + materialReserve);
    items.push({
      description: `${index + 1}. ${step.title}`,
      labor_hours: laborHours,
      rate,
      materials: materialReserve,
      amount,
    });
  });

  plan.supplyList?.forEach((supply) => {
    const materials = Math.max(180, (Number(supply.quantity) || 1) * 160);
    items.push({
      description: `Procure ${supply.item}${supply.notes ? ` (${supply.notes})` : ''}`,
      materials,
      amount: materials,
    });
  });

  if (plan.laborStack?.length) {
    const totalHours = plan.laborStack.reduce((sum, entry) => sum + entry.hours, 0);
    const blendedRate = plan.laborStack.reduce((sum, entry) => sum + (entry.rate ?? BASE_RATE), 0) / plan.laborStack.length;
    items.push({
      description: 'Crew allocation & supervision',
      labor_hours: Number(totalHours.toFixed(1)),
      rate: Math.round(blendedRate),
      amount: Math.round(totalHours * blendedRate),
    });
  }

  return items;
}

function fallbackLineItems(workOrders: WorkOrder[]): LineItem[] {
  return workOrders.map((order) => {
    const baseHours = order.priority === 'Critical' ? 40 : order.priority === 'High' ? 28 : order.priority === 'Low' ? 12 : 20;
    const laborHours = Number(baseHours.toFixed(1));
    const rate = BASE_RATE + (PRIORITY_RATE[order.priority] ?? 0);
    const materialBudget = Math.max(order.materials?.reduce((sum, material) => sum + (material.unitCost ?? 150) * (material.quantity ?? 1), 0) || 0, 450);
    const amount = Math.round(laborHours * rate + materialBudget);
    return {
      description: `${order.title} — ${order.description || 'Field scope execution'}`,
      labor_hours: laborHours,
      rate,
      materials: materialBudget,
      amount,
    };
  });
}

function pickWorkOrder(workOrders: WorkOrder[]): WorkOrder | undefined {
  if (!workOrders.length) return undefined;
  const sorted = [...workOrders].sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99));
  return sorted[0];
}

export const aiEstimateService = {
  buildLineItems(project: Project, leads: Lead[], workOrders: WorkOrder[]): LineItem[] {
    const plan = resolveWalkthroughPlan(project, leads);
    if (plan) {
      const items = lineItemsFromPlan(plan);
      if (items.length) return items;
    }
    return fallbackLineItems(workOrders);
  },

  async generateEstimateForProject(project: Project, leads: Lead[], workOrders: WorkOrder[], notes?: string) {
    const targetWorkOrder = pickWorkOrder(workOrders);
    if (!targetWorkOrder) {
      throw new Error('No work orders are linked to this project yet. Create a work order before generating an estimate.');
    }
    const lineItems = this.buildLineItems(project, leads, workOrders);
    if (!lineItems.length) {
      throw new Error('Unable to build estimate line items from the available walkthrough data.');
    }
    const total = estimateService.calculateTotal(lineItems);
    await estimateService.saveDraft(targetWorkOrder.id, lineItems, total, notes ?? `AI-generated estimate for ${project.name}`);
    return {
      lineItems,
      total,
      workRequestId: targetWorkOrder.id,
    };
  },
};

export type AiEstimateService = typeof aiEstimateService;
