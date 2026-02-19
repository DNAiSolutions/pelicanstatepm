import { useMemo } from 'react';
import {
  mockClientAccounts,
  mockContacts,
  mockProjects,
  mockWorkOrders,
  type Contact,
  type Project,
  type WorkOrder,
} from '../data/pipeline';

export function useContactPortalData(contactId?: string | null): {
  contact?: Contact;
  projects: Project[];
  workOrders: WorkOrder[];
  openWorkOrders: WorkOrder[];
  totalBudget: number;
  spentBudget: number;
  accountName: string;
  companyName: string;
  viewingMessage?: string;
  allowedProjectIds: string[];
} {
  const account = mockClientAccounts[0];
  const contact = contactId ? mockContacts.find((item) => item.id === contactId && item.clientPortalEnabled) : undefined;

  const allowedProjectIds = contact && contact.projectIds.length > 0 ? contact.projectIds : account.projectIds;

  const projects = useMemo(() => mockProjects.filter((project) => allowedProjectIds.includes(project.id)), [allowedProjectIds]);
  const workOrders = useMemo(() => mockWorkOrders.filter((wo) => allowedProjectIds.includes(wo.projectId)), [allowedProjectIds]);
  const openWorkOrders = useMemo(() => workOrders.filter((wo) => !['Completed', 'Closed', 'Paid'].includes(wo.status)), [workOrders]);
  const totalBudget = useMemo(() => projects.reduce((sum, project) => sum + project.totalBudget, 0), [projects]);
  const spentBudget = useMemo(() => projects.reduce((sum, project) => sum + project.spentBudget, 0), [projects]);

  return {
    contact,
    projects,
    workOrders,
    openWorkOrders,
    totalBudget,
    spentBudget,
    accountName: contact ? contact.name : account.primaryContact,
    companyName: contact ? contact.company : account.company,
    viewingMessage: contact ? `Viewing as ${contact.name}` : undefined,
    allowedProjectIds,
  };
}
