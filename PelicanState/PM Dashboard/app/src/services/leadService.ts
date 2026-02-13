import {
  mockLeads,
  mockProjects,
  mockContacts,
  mockLeadIntakeRecords,
  type Lead,
  type Project,
  type Contact,
  type IntakeChannel,
  type LeadSource,
  type Priority,
  type LeadIntakeRecord,
  getLeadById,
  getLeads,
} from '../data/pipeline';
import { intakeDecisionService } from './intakeDecisionService';
import { walkthroughSchedulerService } from './walkthroughSchedulerService';
import { walkthroughSessionService } from './walkthroughSessionService';

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

function cloneLead(lead: Lead): Lead {
  return JSON.parse(JSON.stringify(lead));
}

const channelToSource: Record<IntakeChannel, LeadSource> = {
  ClientPortal: 'Client Portal',
  Phone: 'Inbound',
  Internal: 'Inbound',
  Email: 'Inbound',
  WebForm: 'Inbound',
};

function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, '');
}

function findContactByEmailOrPhone(email: string, phone: string): Contact | undefined {
  const normalizedPhone = normalizePhone(phone);
  return mockContacts.find((contact) => {
    if (email && contact.email.toLowerCase() === email.toLowerCase()) return true;
    if (normalizedPhone && normalizePhone(contact.phone) === normalizedPhone) return true;
    return false;
  });
}

export type LeadIntakeFormInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  campusId?: string;
  projectId?: string;
  issueSummary: string;
  jobAddress?: string;
  urgency?: Priority;
  accessNotes?: string;
  attachments?: string[];
  intakeChannel: IntakeChannel;
  estimatedValue?: number;
  recordedById?: string;
  notes?: string;
  preferredChannel?: 'Email' | 'Phone' | 'Text';
  callSource?: string;
  handledBy?: string;
  submissionSource?: 'Web' | 'Internal';
};

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

  async delete(id: string): Promise<void> {
    const index = mockLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return;
    mockLeads.splice(index, 1);
    mockContacts.forEach((contact) => {
      contact.leadIds = contact.leadIds.filter((leadId) => leadId !== id);
    });
    for (let i = mockLeadIntakeRecords.length - 1; i >= 0; i -= 1) {
      if (mockLeadIntakeRecords[i].leadId === id) {
        mockLeadIntakeRecords.splice(i, 1);
      }
    }
  },

  async createFromIntake(form: LeadIntakeFormInput): Promise<Lead> {
    const existingContact = findContactByEmailOrPhone(form.email, form.phone);
    let contactId = existingContact?.id;
    if (!existingContact) {
      const newContact: Contact = {
        id: id('contact'),
        name: form.contactName,
        title: 'Client Contact',
        company: form.companyName,
        type: 'Client',
        email: form.email,
        phone: form.phone,
        campusId: form.campusId,
        projectIds: form.projectId ? [form.projectId] : [],
        leadIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: form.accessNotes,
        preferredChannel: form.preferredChannel,
      };
      mockContacts.push(newContact);
      contactId = newContact.id;
    }
    if (existingContact) {
      existingContact.preferredChannel = form.preferredChannel || existingContact.preferredChannel;
      existingContact.notes = form.accessNotes || existingContact.notes;
      existingContact.updatedAt = new Date().toISOString();
    }

    const decision = intakeDecisionService.evaluate({ issueSummary: form.issueSummary, urgency: form.urgency, intakeChannel: form.intakeChannel, accessNotes: form.accessNotes });
    const newLead: Lead = {
      id: id('lead'),
      companyName: form.companyName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      stage: 'New',
      source: channelToSource[form.intakeChannel],
      estimatedValue: form.estimatedValue ?? 25000,
      nextStep: decision.rationale,
      notes: form.notes,
      campusId: form.campusId,
      projectId: form.projectId,
      contactIds: contactId ? [contactId] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      intakeChannel: form.intakeChannel,
      recommendedNextStep: decision.nextStep,
      decisionConfidence: decision.confidence,
      decisionNotes: decision.rationale,
      jobAddress: form.jobAddress,
      urgency: form.urgency,
      accessNotes: form.accessNotes,
      attachments: form.attachments,
      followUpStatus: 'Pending',
      preferredChannel: form.preferredChannel,
      callSource: form.callSource,
      handledBy: form.handledBy,
      projectType: decision.projectType,
      walkthroughPrepBrief: decision.prepBrief,
      walkthroughSessionIds: [],
      walkthroughPlan: undefined,
      intakeMetadata: {
        issueSummary: form.issueSummary,
        jobAddress: form.jobAddress,
        urgency: form.urgency,
        accessNotes: form.accessNotes,
        attachments: form.attachments,
        intakeChannel: form.intakeChannel,
        recordedById: form.recordedById,
        recommendedNextStep: decision.nextStep,
        decisionConfidence: decision.confidence,
        decisionNotes: decision.rationale,
        walkthroughNeeded: decision.requiresWalkthrough,
        nextStepStatus: 'Pending',
        submittedBy: form.contactName,
        preferredChannel: form.preferredChannel,
        callSource: form.callSource,
        handledBy: form.handledBy,
        projectType: decision.projectType,
        submissionSource: form.submissionSource,
      },
    };

    mockLeads.push(newLead);
    if (contactId) {
      const contact = mockContacts.find((c) => c.id === contactId);
      if (contact && !contact.leadIds.includes(newLead.id)) {
        contact.leadIds.push(newLead.id);
        contact.updatedAt = new Date().toISOString();
      }
    }

    const intakeRecord: LeadIntakeRecord = {
      id: id('intake'),
      leadId: newLead.id,
      capturedAt: new Date().toISOString(),
      formSnapshot: {
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        campusId: form.campusId,
        issueSummary: form.issueSummary,
        jobAddress: form.jobAddress,
        urgency: form.urgency,
        accessNotes: form.accessNotes,
        attachments: form.attachments,
        intakeChannel: form.intakeChannel,
      },
      decision: {
        nextStep: decision.nextStep,
        confidence: decision.confidence,
        rationale: decision.rationale,
      },
    };
    mockLeadIntakeRecords.push(intakeRecord);

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

  async scheduleWalkthrough(id: string, params: { date: string; notes?: string }): Promise<Lead | undefined> {
    const lead = getLeadById(id);
    if (!lead) return undefined;
    const event = await walkthroughSchedulerService.schedule(lead, params);
    lead.walkthroughScheduled = true;
    lead.walkthroughDate = params.date;
    lead.walkthroughEventId = event.eventId;
    lead.walkthroughNotes = params.notes;
    lead.stage = 'Walkthrough';
    const session = walkthroughSessionService.createFromLead(id, { date: params.date, notes: params.notes });
    lead.walkthroughSessionIds = [...(lead.walkthroughSessionIds || []), session.id];
    lead.updatedAt = new Date().toISOString();
    return cloneLead(lead);
  },
};

export type LeadService = typeof leadService;
