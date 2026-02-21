import type { Lead } from '../types';

const STORAGE_KEY = 'ps_walkthrough_draft';

export type WalkthroughDraft = {
  leadId: string;
  propertyId?: string;
  contactName: string;
  phone: string;
  email: string;
  summary: string;
  urgency?: string;
  jobAddress?: string;
};

export function saveWalkthroughDraftFromLead(lead: Lead) {
  const draft: WalkthroughDraft = {
    leadId: lead.id,
    propertyId: lead.property_id,
    contactName: lead.contact_name,
    phone: lead.phone,
    email: lead.email,
    summary: lead.intake_metadata?.issue_summary || lead.notes || '',
    urgency: lead.urgency,
    jobAddress: lead.job_address,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn('Unable to store walkthrough draft', error);
  }
}

export function getSavedWalkthroughDraft(): WalkthroughDraft | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as WalkthroughDraft) : null;
  } catch (error) {
    console.warn('Unable to read walkthrough draft', error);
    return null;
  }
}

export function clearWalkthroughDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear walkthrough draft', error);
  }
}
