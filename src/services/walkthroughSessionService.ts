import {
  mockWalkthroughSessions,
  mockLeads,
  type WalkthroughSessionRecord,
  type WalkthroughPlan,
} from '../data/pipeline';
import { aiWalkthroughPlannerService } from './aiWalkthroughPlannerService';

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const walkthroughSessionService = {
  list(): WalkthroughSessionRecord[] {
    return mockWalkthroughSessions.map((session) => ({ ...session }));
  },

  findByLeadId(leadId: string): WalkthroughSessionRecord | undefined {
    const session = mockWalkthroughSessions.find((item) => item.leadId === leadId);
    return session ? { ...session } : undefined;
  },

  ensureSession(leadId: string, date?: string): WalkthroughSessionRecord {
    const existing = mockWalkthroughSessions.find((session) => session.leadId === leadId);
    if (existing) return { ...existing };
    const session = this.createFromLead(leadId, { date: date || new Date().toISOString(), notes: '' });
    return session;
  },

  getById(sessionId: string): WalkthroughSessionRecord | undefined {
    const session = mockWalkthroughSessions.find((item) => item.id === sessionId);
    return session ? { ...session } : undefined;
  },

  createFromLead(leadId: string, params: { date: string; notes?: string }): WalkthroughSessionRecord {
    const lead = mockLeads.find((item) => item.id === leadId);
    const session: WalkthroughSessionRecord = {
      id: id('walkthrough'),
      leadId,
      projectId: lead?.projectId,
      campusId: lead?.campusId,
      scheduledDate: params.date,
      status: 'Scheduled',
      notes: params.notes,
    };
    mockWalkthroughSessions.push(session);
    return { ...session };
  },

  attachPlan(sessionId: string, plan: WalkthroughPlan) {
    const session = mockWalkthroughSessions.find((record) => record.id === sessionId);
    if (!session) return;
    session.aiPlan = plan;
  },

  markInProgress(sessionId: string) {
    const session = mockWalkthroughSessions.find((record) => record.id === sessionId);
    if (!session) return;
    session.status = 'InProgress';
  },

  complete(sessionId: string, responses: Record<string, string>) {
    const session = mockWalkthroughSessions.find((record) => record.id === sessionId);
    if (!session || !session.aiPlan) return;
    session.status = 'Complete';
    session.responses = responses;
    session.finalizedPlan = aiWalkthroughPlannerService.finalizeExecutionPlan(responses, session.aiPlan);
  },
};
