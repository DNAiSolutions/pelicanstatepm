import type { WorkRequestStatus } from '../types';

// Valid transitions between statuses
const VALID_TRANSITIONS: Record<WorkRequestStatus, WorkRequestStatus[]> = {
  Intake: ['Scoping'],
  Scoping: ['Estimate', 'Intake'],
  Estimate: ['Approval', 'Scoping'],
  Approval: ['Schedule', 'Estimate'],
  Schedule: ['Progress', 'Approval'],
  Progress: ['Complete', 'Schedule'],
  Complete: ['Invoice', 'Progress'],
  Invoice: ['Paid', 'Complete'],
  Paid: [],
};

// Required fields for each status
const REQUIRED_FIELDS_BY_STATUS: Record<WorkRequestStatus, string[]> = {
  Intake: ['property', 'category', 'description', 'campus_id'],
  Scoping: ['property', 'category', 'description', 'scope_details'],
  Estimate: ['estimated_cost', 'line_items'],
  Approval: ['estimated_cost', 'approved_by', 'approved_at'],
  Schedule: ['start_date', 'end_date', 'milestones'],
  Progress: ['weekly_updates'],
  Complete: ['completed_at', 'completion_notes'],
  Invoice: ['invoice_number', 'total_amount'],
  Paid: ['paid_at', 'payment_method'],
};

// Status categories for filtering
export const STATUS_CATEGORIES = {
  pending: ['Intake', 'Scoping', 'Estimate'],
  approval: ['Approval'],
  active: ['Schedule', 'Progress'],
  complete: ['Complete', 'Invoice', 'Paid'],
} as const;

// Status colors for UI
export const STATUS_COLORS: Record<WorkRequestStatus, 'amber' | 'blue' | 'green' | 'red'> = {
  Intake: 'blue',
  Scoping: 'blue',
  Estimate: 'amber',
  Approval: 'amber',
  Schedule: 'blue',
  Progress: 'blue',
  Complete: 'green',
  Invoice: 'amber',
  Paid: 'green',
};

// Status descriptions
export const STATUS_DESCRIPTIONS: Record<WorkRequestStatus, string> = {
  Intake: 'Work request submitted, awaiting scoping',
  Scoping: 'Defining scope of work and requirements',
  Estimate: 'Preparing cost estimate',
  Approval: 'Awaiting client approval of estimate',
  Schedule: 'Work scheduled and ready to begin',
  Progress: 'Work in progress',
  Complete: 'Work completed, ready to invoice',
  Invoice: 'Invoice submitted for payment',
  Paid: 'Paid in full',
};

export const statusMachine = {
  // Check if a transition is valid
  isValidTransition(from: WorkRequestStatus, to: WorkRequestStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  },

  // Get valid next statuses
  getValidNextStatuses(current: WorkRequestStatus): WorkRequestStatus[] {
    return VALID_TRANSITIONS[current] ?? [];
  },

  // Get required fields for a status
  getRequiredFields(status: WorkRequestStatus): string[] {
    return REQUIRED_FIELDS_BY_STATUS[status] ?? [];
  },

  // Check if all required fields are present
  hasRequiredFields(status: WorkRequestStatus, data: Record<string, any>): boolean {
    const required = this.getRequiredFields(status);
    return required.every((field) => data[field] !== undefined && data[field] !== null && data[field] !== '');
  },

  // Get status color for UI
  getStatusColor(status: WorkRequestStatus): 'amber' | 'blue' | 'green' | 'red' {
    return STATUS_COLORS[status] ?? 'blue';
  },

  // Get status description
  getStatusDescription(status: WorkRequestStatus): string {
    return STATUS_DESCRIPTIONS[status] ?? '';
  },

  // Get status category
  getStatusCategory(status: WorkRequestStatus): keyof typeof STATUS_CATEGORIES | undefined {
    for (const [category, statuses] of Object.entries(STATUS_CATEGORIES)) {
      if ((statuses as readonly string[]).includes(status)) {
        return category as keyof typeof STATUS_CATEGORIES;
      }
    }
    return undefined;
  },

  // Check if status is in a category
  isStatusInCategory(status: WorkRequestStatus, category: keyof typeof STATUS_CATEGORIES): boolean {
    return (STATUS_CATEGORIES[category] as readonly string[]).includes(status);
  },

  // Check if status is final (no further transitions)
  isFinalStatus(status: WorkRequestStatus): boolean {
    return VALID_TRANSITIONS[status]?.length === 0;
  },

  // Get transition path from one status to another
  getTransitionPath(from: WorkRequestStatus, to: WorkRequestStatus): WorkRequestStatus[] | null {
    if (from === to) return [from];

    const visited = new Set<WorkRequestStatus>();
    const queue: { status: WorkRequestStatus; path: WorkRequestStatus[] }[] = [{ status: from, path: [from] }];

    while (queue.length > 0) {
      const { status, path } = queue.shift()!;

      if (status === to) {
        return path;
      }

      if (visited.has(status)) {
        continue;
      }

      visited.add(status);

      for (const nextStatus of this.getValidNextStatuses(status)) {
        if (!visited.has(nextStatus)) {
          queue.push({ status: nextStatus, path: [...path, nextStatus] });
        }
      }
    }

    return null;
  },

  // Validate transition with error message
  validateTransition(from: WorkRequestStatus, to: WorkRequestStatus): { valid: boolean; error?: string } {
    if (from === to) {
      return { valid: true };
    }

    if (!this.isValidTransition(from, to)) {
      const validNext = this.getValidNextStatuses(from);
      return {
        valid: false,
        error: `Cannot transition from ${from} to ${to}. Valid next statuses: ${validNext.join(', ')}`,
      };
    }

    return { valid: true };
  },
};
