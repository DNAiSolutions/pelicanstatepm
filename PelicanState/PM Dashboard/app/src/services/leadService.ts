import {
  mockLeads,
  mockProjects,
  mockContacts,
  type Lead,
  type Project,
  getLeadById,
  getLeads,
} from '../data/pipeline';

function cloneLead(lead: Lead): Lead {
  return JSON.parse(JSON.stringify(lead));
}

export const leadService = {
  async list(): Promise<Lead[]> {
    return getLeads().map(cloneLead);
  },

  async getById(id: string): Promise<Lead | undefined> {
    const lead = getLeadById(id);
    return lead ? cloneLead(lead) : undefined;
  },

  async create(payload: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const newLead: Lead = {
      ...payload,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockLeads.push(newLead);
    return cloneLead(newLead);
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = getLeadById(id);
    if (!lead) return undefined;
    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });
    return cloneLead(lead);
  },

  async convertToProject(id: string): Promise<Project | undefined> {
    const lead = getLeadById(id);
    if (!lead) return undefined;

    const project: Project = {
      id: `proj-from-lead-${Date.now()}`,
      name: `${lead.companyName} Project`,
      siteId: lead.campusId ? `site-from-${lead.campusId}` : mockProjects[0]?.siteId || 'site-1',
      campusId: lead.campusId,
      clientName: lead.companyName,
      clientPhone: lead.phone,
      clientEmail: lead.email,
      internalOwnerId: mockProjects[0]?.internalOwnerId || 'user-1',
      primeVendorId: mockProjects[0]?.primeVendorId,
      status: 'Planning',
      clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      totalBudget: lead.estimatedValue,
      spentBudget: 0,
      clientSummary: lead.notes,
      internalNotes: 'Converted from lead',
      shareToken: `share-${Date.now().toString(36)}`,
      clientLogo: undefined,
    };

    mockProjects.push(project);
    lead.stage = 'Won';
    lead.projectId = project.id;
    lead.updatedAt = new Date().toISOString();
    lead.notes = `${lead.notes || ''}\nConverted to project ${project.name}`.trim();

    if (lead.contactIds.length) {
      lead.contactIds.forEach((contactId) => {
        const contact = mockContacts.find((c) => c.id === contactId);
        if (contact && !contact.projectIds.includes(project.id)) {
          contact.projectIds.push(project.id);
        }
      });
    }

    return JSON.parse(JSON.stringify(project));
  },
};

export type LeadService = typeof leadService;
