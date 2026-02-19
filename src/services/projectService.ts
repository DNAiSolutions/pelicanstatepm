import {
  mockProjects,
  mockContacts,
  mockLeads,
  type Project,
  type Lead,
  type Contact,
  type Invoice,
  type PermitRecord,
  type HistoricArtifact,
  getProjectById,
  getLeadsByProjectId,
  getContactsByProjectId,
  getInvoicesByProjectId,
  getPermitsByProject,
  getHistoricArtifactsByProject,
  generateProjectShareToken,
} from '../data/pipeline';
import { contractService } from './contractService';

type NewProjectPayload = Omit<Project, 'id' | 'shareToken' | 'clientVisibility'> & {
  clientVisibility?: Project['clientVisibility'];
};

function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project));
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    return mockProjects.map(cloneProject);
  },

  async getProject(id: string): Promise<Project | undefined> {
    const project = getProjectById(id);
    return project ? cloneProject(project) : undefined;
  },

  async getProjectLeads(projectId: string): Promise<Lead[]> {
    return getLeadsByProjectId(projectId).map((lead) => ({ ...lead }));
  },

  async getProjectContacts(projectId: string): Promise<Contact[]> {
    return getContactsByProjectId(projectId).map((contact) => ({ ...contact }));
  },

  async createProject(payload: NewProjectPayload): Promise<Project> {
    const newProject: Project = {
      ...payload,
      clientVisibility: payload.clientVisibility || {
        showBudget: true,
        showTimeline: true,
        showInvoices: true,
        showContacts: true,
      },
      id: `proj-${Date.now()}`,
      shareToken: `share-${Date.now().toString(36)}`,
    };
    mockProjects.push(newProject);
    return cloneProject(newProject);
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = getProjectById(id);
    if (!project) return undefined;
    Object.assign(project, updates);
    return cloneProject(project);
  },

  async linkLead(projectId: string, leadId: string): Promise<void> {
    const lead = mockLeads.find((l) => l.id === leadId);
    if (lead) {
      lead.projectId = projectId;
      if (!lead.contactIds.length) {
        const projectContacts = getContactsByProjectId(projectId);
        if (projectContacts[0]) {
          lead.contactIds = [projectContacts[0].id];
        }
      }
    }
  },

  async linkContact(projectId: string, contactId: string): Promise<void> {
    const contact = mockContacts.find((c) => c.id === contactId);
    if (contact && !contact.projectIds.includes(projectId)) {
      contact.projectIds.push(projectId);
    }
  },

  async generateClientLink(projectId: string): Promise<string | undefined> {
    const project = getProjectById(projectId);
    if (!project) return undefined;
    return generateProjectShareToken(projectId);
  },

  async getProjectContracts(projectId: string) {
    return contractService.listByProject(projectId);
  },

  async getFinancialSnapshot(projectId: string) {
    const contracts = contractService.listByProject(projectId);
    const summaries = contracts.map((contract) => contractService.getFinancialSummary(contract.id));
    const totals = summaries.reduce(
      (acc, summary) => {
        acc.contractValue += summary.contractValue || 0;
        acc.amountBilled += summary.amountBilled;
        acc.amountEarned += summary.amountEarned;
        acc.grossMargin += summary.grossMargin;
        acc.retainageHeld += summary.retainageHeld;
        return acc;
      },
      { contractValue: 0, amountBilled: 0, amountEarned: 0, grossMargin: 0, retainageHeld: 0 }
    );

    return {
      contracts,
      summaries,
      totals,
    };
  },

  async getProjectInvoices(projectId: string): Promise<Invoice[]> {
    return getInvoicesByProjectId(projectId).map((invoice) => ({ ...invoice }));
  },

  async getProjectPermits(projectId: string): Promise<PermitRecord[]> {
    return getPermitsByProject(projectId).map((permit) => ({ ...permit }));
  },

  async getProjectHistoricArtifacts(projectId: string): Promise<HistoricArtifact[]> {
    return getHistoricArtifactsByProject(projectId).map((artifact) => ({ ...artifact }));
  },
};

export type ProjectService = typeof projectService;
