import {
  mockProjects,
  mockContacts,
  mockLeads,
  type Project,
  type Lead,
  type Contact,
  getProjectById,
  getLeadsByProjectId,
  getContactsByProjectId,
  generateProjectShareToken,
} from '../data/pipeline';

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
};

export type ProjectService = typeof projectService;
