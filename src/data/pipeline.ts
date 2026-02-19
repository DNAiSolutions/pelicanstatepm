/**
 * Pipeline mock data for ConstructHub workflow
 * This file provides fixture data for the entire pipeline until we wire Supabase.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type WorkOrderStatus =
  | 'Requested'
  | 'Scoped'
  | 'AwaitingApproval'
  | 'Approved'
  | 'Scheduled'
  | 'InProgress'
  | 'Blocked'
  | 'Completed'
  | 'Invoiced'
  | 'Paid'
  | 'Closed';

export type ProjectStatus = 'Planning' | 'PreConstruction' | 'Active' | 'Closeout' | 'OnHold' | 'Completed';

export type LeadStage = 'New' | 'Walkthrough' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
export type LeadSource = 'Referral' | 'Inbound' | 'Event' | 'Cold Outreach' | 'Returning Client' | 'Client Portal';
export type IntakeChannel = 'Phone' | 'ClientPortal' | 'WebForm' | 'Internal' | 'Email';
export type LeadNextStep = 'ScheduleWalkthrough' | 'NurtureSequence' | 'DispatchCrew' | 'EstimateOnly' | 'SendAiEstimate';

export const LEAD_NEXT_STEP_LABELS: Record<LeadNextStep, string> = {
  ScheduleWalkthrough: 'Schedule walkthrough',
  NurtureSequence: 'Nurture sequence',
  DispatchCrew: 'Dispatch crew',
  EstimateOnly: 'Estimate only',
  SendAiEstimate: 'Send AI estimate for approval',
};

export type ContactType = 'Client' | 'Internal' | 'Vendor' | 'Partner';

export interface ProjectClientVisibility {
  showBudget: boolean;
  showTimeline: boolean;
  showInvoices: boolean;
  showContacts: boolean;
}

export type QuoteStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Superseded';

export type InvoiceStatus = 'Draft' | 'Submitted' | 'Approved' | 'ReadyForPayment' | 'Paid' | 'Rejected';

export type WorkLogType = 'note' | 'delay' | 'changeOrder' | 'approval' | 'scheduleUpdate' | 'completion' | 'invoice' | 'statusChange';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type ContractType = 'Fixed' | 'T&M' | 'CostPlus' | 'Retainer';
export type BillingMethod = 'Milestone' | 'Progress' | 'Simple';
export type ContractStatus = 'Draft' | 'Active' | 'Closed';
export type MilestoneStatus = 'Pending' | 'ReadyToBill' | 'Invoiced' | 'Paid';
export type TaskTemplate =
  | 'default'
  | 'historicRestoration'
  | 'eventSetup'
  | 'lightingUpgrade'
  | 'hvacRepair'
  | 'tenantFinish'
  | 'roofing'
  | 'sitework'
  | 'plumbing'
  | 'concrete';
export type IntakeComplianceSeverity = 'Info' | 'Warning' | 'Critical' | 'Caution' | 'Danger';
export interface WalkthroughPrepBrief {
  projectType: string;
  summary: string;
  keyQuestions: string[];
  recommendedTrades: string[];
  supplies: { item: string; quantity?: string; notes?: string }[];
}

export interface WalkthroughStep {
  title: string;
  instructions: string;
  trades: string[];
  materials: string[];
  durationHours?: number;
}

export interface WalkthroughPlan {
  steps: WalkthroughStep[];
  supplyList: { item: string; quantity?: string; responsible?: string; notes?: string }[];
  laborStack: { role: string; hours: number; rate?: number }[];
  checklist: string[];
}

export interface WalkthroughSessionRecord {
  id: string;
  leadId: string;
  projectId?: string;
  campusId?: string;
  scheduledDate: string;
  status: 'Scheduled' | 'InProgress' | 'Complete';
  notes?: string;
  aiPlan?: WalkthroughPlan;
  responses?: Record<string, string>;
  attachments?: string[];
  finalizedPlan?: WalkthroughPlan;
}
export type PermitStatus =
  | 'NotRequired'
  | 'Needed'
  | 'Drafting'
  | 'Submitted'
  | 'InReview'
  | 'RevisionsRequired'
  | 'Approved'
  | 'Issued'
  | 'Finaled'
  | 'Closed';
export type HistoricArtifactType = 'MaterialSpec' | 'MethodStatement' | 'ConditionAssessment' | 'ReplacementJustification' | 'ReviewComment';
export type HistoricReviewStatus = 'Draft' | 'Submitted' | 'Approved' | 'ChangesRequested';
export type IntakeChecklistCategory = 'Questions' | 'Measurements' | 'Photos' | 'Tools' | 'Safety';
export type IntakeResearchCategory = 'Permit' | 'Code' | 'Material' | 'Contact';
export type IntakeMessageRole = 'User' | 'Assistant';

export interface IntakeChecklistItem {
  id: string;
  text: string;
  reason?: string;
  required: boolean;
  checked: boolean;
  userAdded?: boolean;
}

export interface IntakeSafetyNote {
  id: string;
  text: string;
  severity: IntakeComplianceSeverity;
  source?: string;
}

export interface IntakeResearchSnippet {
  id: string;
  category: IntakeResearchCategory;
  title: string;
  content: string;
  jurisdiction?: 'Louisiana' | 'NewOrleans' | 'BatonRouge';
  source: 'KnowledgeBase' | 'LLM';
  confidence: number;
}

export interface ScopeComplianceFlag {
  id: string;
  type: 'Historic' | 'Permit' | 'Safety' | 'Environmental';
  message: string;
  severity: IntakeComplianceSeverity;
  source: string;
}

export interface ScopeAnalysisResult {
  scopeText: string;
  primaryTemplate: TaskTemplate;
  primaryConfidence: number;
  secondarySuggestions: { template: TaskTemplate; confidence: number }[];
  complianceFlags: ScopeComplianceFlag[];
  detectedKeywords: string[];
  suggestedJurisdiction?: 'Louisiana' | 'NewOrleans' | 'BatonRouge';
  rationale?: string;
}

export interface ConsultationChecklist {
  id: string;
  projectId?: string;
  jobType: TaskTemplate;
  questions: IntakeChecklistItem[];
  measurements: IntakeChecklistItem[];
  photos: IntakeChecklistItem[];
  tools: IntakeChecklistItem[];
  safetyNotes: IntakeSafetyNote[];
  research: IntakeResearchSnippet[];
  generatedAt: string;
  updatedAt?: string;
}

export interface IntakeConversationMessage {
  id: string;
  role: IntakeMessageRole;
  content: string;
  timestamp: string;
}

export interface IntakeConversationState {
  id: string;
  scopeSummary: string;
  messages: IntakeConversationMessage[];
  pendingQuestions: string[];
  responses: Record<string, string>;
  recommendedTemplate: TaskTemplate;
  readyForPlan: boolean;
}

export interface WbsTask {
  code: string;
  title: string;
  description: string;
  category: WorkOrderCategory;
  durationHours: number;
  dependsOn?: string[];
}

export interface WbsPhase {
  phase: string;
  summary: string;
  tasks: WbsTask[];
}

export interface Site {
  id: string;
  campusId: string;
  name: string;
  address: string;
  isHistoric: boolean;
  historicNotes?: string;
}

export interface Project {
  id: string;
  name: string;
  siteId: string;
  campusId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientLogo?: string;
  internalOwnerId: string;
  primeVendorId?: string;
  status: ProjectStatus;
  clientSummary?: string;
  internalNotes?: string;
  clientVisibility: ProjectClientVisibility;
  shareToken?: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  spentBudget: number;
  walkthroughNotes?: string;
  walkthroughPlan?: WalkthroughPlan;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  type: ContactType;
  email: string;
  phone: string;
  campusId?: string;
  projectIds: string[];
  leadIds: string[];
  preferredChannel?: 'Email' | 'Phone' | 'Text';
  notes?: string;
  clientPortalEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadIntakeMetadata {
  templateId?: string;
  templateName?: string;
  planQuestions?: string[];
  materialSummary?: string;
  laborSummary?: string;
  submittedBy?: string;
  issueSummary?: string;
  jobAddress?: string;
  urgency?: Priority;
  accessNotes?: string;
  attachments?: string[];
  intakeChannel?: IntakeChannel;
  recordedById?: string;
  recommendedNextStep?: LeadNextStep;
  decisionConfidence?: number;
  decisionNotes?: string;
  walkthroughNeeded?: boolean;
  nextStepStatus?: 'Pending' | 'InProgress' | 'Completed';
  preferredChannel?: 'Email' | 'Phone' | 'Text';
  callSource?: string;
  handledBy?: string;
  projectType?: string;
  submissionSource?: 'Web' | 'Internal';
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  stage: LeadStage;
  source: LeadSource;
  estimatedValue: number;
  nextStep?: string;
  notes?: string;
  campusId?: string;
  projectId?: string;
  contactIds: string[];
  createdAt: string;
  updatedAt: string;
  intakeMetadata?: LeadIntakeMetadata;
  intakeChannel?: IntakeChannel;
  recommendedNextStep?: LeadNextStep;
  decisionConfidence?: number;
  decisionNotes?: string;
  jobAddress?: string;
  urgency?: Priority;
  accessNotes?: string;
  attachments?: string[];
  followUpStatus?: 'Pending' | 'InProgress' | 'Completed';
  preferredChannel?: 'Email' | 'Phone' | 'Text';
  callSource?: string;
  handledBy?: string;
  walkthroughScheduled?: boolean;
  walkthroughDate?: string;
  walkthroughEventId?: string;
  walkthroughNotes?: string;
  projectType?: string;
  walkthroughPrepBrief?: WalkthroughPrepBrief;
  walkthroughSessionIds?: string[];
  walkthroughPlan?: WalkthroughPlan;
}

export interface ClientAccount {
  id: string;
  company: string;
  primaryContact: string;
  email: string;
  phone: string;
  projectIds: string[];
  notes?: string;
}

export interface LeadIntakeRecord {
  id: string;
  leadId: string;
  capturedAt: string;
  formSnapshot: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    campusId?: string;
    issueSummary: string;
    jobAddress?: string;
    urgency?: Priority;
    accessNotes?: string;
    attachments?: string[];
    intakeChannel: IntakeChannel;
  };
  decision: {
    nextStep: LeadNextStep;
    confidence: number;
    rationale: string;
  };
}

export type WorkOrderCategory =
  | 'Repair'
  | 'PM'
  | 'Event'
  | 'Events'
  | 'Remodel'
  | 'Inspection'
  | 'Construction'
  | 'Electrical'
  | 'Planning'
  | 'Demolition'
  | 'Closeout'
  | 'General Contracting'
  | 'Conservation'
  | 'Mechanical'
  | 'Interiors'
  | 'Envelope'
  | 'Civil'
  | 'Plumbing'
  | 'Structural';

export interface WorkOrder {
  id: string;
  projectId: string;
  siteId: string;
  requestNumber: string;
  title: string;
  description: string;
  locationDetail: string;
  priority: Priority;
  category: WorkOrderCategory;
  status: WorkOrderStatus;
  requestedById: string;
  requestedDate: string;
  assignedVendorId?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  percentComplete: number;
  estimatedCost?: number;
  approvedQuoteId?: string;
  completionChecklistDone: boolean;
  completionPhotoUrls: string[];
  historicCompliance?: HistoricCompliance;
  createdAt: string;
  updatedAt: string;
  materials?: Array<{ name: string; quantity: number; unit: string; unitCost: number }>;
  labor?: Array<{ role: string; hours: number; rate: number }>;
  aiQuestions?: string[];
  aiMaterialSummary?: string;
  aiLaborSummary?: string;
}

export interface HistoricCompliance {
  materialsUsed: string;
  methodsApplied: string;
  architectGuidance: string;
  complianceNotes: string;
  photoUrls: string[];
}

export interface QuoteLineItem {
  id: string;
  description: string;
  laborClass: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Quote {
  id: string;
  workOrderId: string;
  version: number;
  status: QuoteStatus;
  lineItems: QuoteLineItem[];
  totalEstimate: number;
  notToExceed?: number;
  submittedAt?: string;
  approvedById?: string;
  approvedAt?: string;
  fundingCode?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  workOrderId: string;
  type: WorkLogType;
  message: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export interface InvoiceLineItem {
  id: string;
  workOrderId: string;
  quoteLineItemId?: string;
  description: string;
  location: string;
  quantity: number;
  rate: number;
  amount: number;
  workPerformedNotes: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  contractId?: string;
  campusId: string;
  fundingCode: string;
  primeVendorId: string;
  workOrderIds: string[];
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  billingReferenceId?: string;
  retainageWithheld?: number;
  retainageReleased?: number;
  grossMarginSnapshot?: number;
  stripePaymentIntentId?: string;
  quickbooksInvoiceId?: string;
  auditLogId?: string;
  status: InvoiceStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedById?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentSyncRecord {
  id: string;
  invoiceId: string;
  provider: 'Stripe' | 'QuickBooks';
  status: 'Pending' | 'Synced' | 'Failed';
  reference?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAuditEntry {
  id: string;
  entity: 'Contract' | 'Invoice' | 'Payment' | 'AI';
  entityId: string;
  action: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Contract {
  id: string;
  projectId: string;
  contractType: ContractType;
  billingMethod: BillingMethod;
  contractValue?: number;
  feePercentage?: number;
  retainerAmount?: number;
  retainagePercentage?: number;
  startDate: string;
  endDate?: string;
  status: ContractStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  aiRecommendationId?: string;
  notes?: string;
}

export interface Milestone {
  id: string;
  contractId: string;
  name: string;
  description?: string;
  scheduledDate?: string;
  amount: number;
  status: MilestoneStatus;
  readyToBillAt?: string;
  invoicedInvoiceId?: string;
  paidAt?: string;
}

export interface ScheduleOfValuesEntry {
  id: string;
  contractId: string;
  lineItem: string;
  budgetAmount: number;
  percentComplete: number;
  amountEarned: number;
  lastUpdated: string;
}

export type CostLedgerCategory = 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Permit' | 'Contingency';

export interface CostLedgerEntry {
  id: string;
  projectId: string;
  contractId: string;
  category: CostLedgerCategory;
  description: string;
  committedAmount?: number;
  actualAmount?: number;
  vendorId?: string;
  invoiceReference?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface AIContractRecommendation {
  id: string;
  projectId: string;
  suggestedContract: ContractType;
  suggestedBilling: BillingMethod;
  rationale: string;
  riskScore: number;
  confidenceScore: number;
  aiInputSnapshot: Record<string, unknown>;
  aiOutputSnapshot: Record<string, unknown>;
  humanOverride?: boolean;
  overrideReason?: string;
  createdAt: string;
  createdBy: string;
}

export interface AIPricingSnapshot {
  id: string;
  projectId: string;
  contractId?: string;
  directCost: number;
  overheadAllocated: number;
  contingency: number;
  grossProfit: number;
  projectedMargin: number;
  riskScore: number;
  suggestedContractType: ContractType;
  pricingVersion: string;
  laborRateSnapshot: Record<string, unknown>;
  overheadRateSnapshot: Record<string, unknown>;
  contingencyNotes?: string;
  createdAt: string;
  createdBy: string;
}

export interface PermitRecord {
  id: string;
  projectId: string;
  workOrderId?: string;
  jurisdictionName: string;
  jurisdictionType: 'Parish' | 'City' | 'State' | 'Federal';
  permitType: 'Building' | 'Electrical' | 'Mechanical' | 'Plumbing' | 'Demolition' | 'Signage' | 'Other';
  codeSet?: 'IBC' | 'IRC' | 'IEBC' | 'NFPA' | 'Other';
  codeVersion?: string;
  reviewerAuthority: 'LocalAHJ' | 'OSFM' | 'ThirdParty' | 'Client';
  reviewerContact?: string;
  status: PermitStatus;
  submissionDate?: string;
  approvalDate?: string;
  expirationDate?: string;
  fees?: Array<{ label: string; amount: number; paid: boolean }>;
  attachments?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermitInspection {
  id: string;
  permitId: string;
  inspectionType: 'Rough' | 'Framing' | 'Final' | 'Electrical' | 'Mechanical' | 'Plumbing' | 'Fire' | 'Other';
  scheduledAt?: string;
  result?: 'Pass' | 'Fail' | 'Partial' | 'Reschedule';
  inspectorNotes?: string;
  attachments?: string[];
}

export interface HistoricArtifact {
  id: string;
  projectId: string;
  workOrderId?: string;
  artifactType: HistoricArtifactType;
  description: string;
  evidenceUrls: string[];
  reviewerRequired: boolean;
  reviewStatus: HistoricReviewStatus;
  reviewerId?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'PM' | 'Ops' | 'Finance' | 'Vendor' | 'Viewer';
  avatarUrl?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  isPrime: boolean;
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Latoya Thompson', email: 'latoya@pelicanstate.pro', role: 'Owner', avatarUrl: 'https://i.pravatar.cc/120?img=1' },
  { id: 'user-2', name: 'Chad Williams', email: 'chad@pelicanstate.pro', role: 'PM', avatarUrl: 'https://i.pravatar.cc/120?img=2' },
  { id: 'user-3', name: 'Marcus Johnson', email: 'marcus@vendor.com', role: 'Vendor', avatarUrl: 'https://i.pravatar.cc/120?img=3' },
  { id: 'user-4', name: 'Sarah Chen', email: 'sarah@pelicanstate.pro', role: 'Finance', avatarUrl: 'https://i.pravatar.cc/120?img=4' },
];

export const mockVendors: Vendor[] = [
  { id: 'vendor-1', name: 'Pelican State Construction', contact: 'chad@pelicanstate.pro', isPrime: true },
  { id: 'vendor-2', name: 'Delta Electric', contact: 'info@deltaelectric.com', isPrime: false },
  { id: 'vendor-3', name: 'Gulf Plumbing', contact: 'service@gulfplumbing.com', isPrime: false },
];

export const mockCampuses = [
  { id: 'campus-wallace', name: 'Wallace', fundingSource: 'State Historic Fund A', priority: 'Critical' as Priority },
  { id: 'campus-woodland', name: 'Woodland/Laplace', fundingSource: 'Parish Tourism Board', priority: 'High' as Priority },
  { id: 'campus-paris', name: 'Paris', fundingSource: 'General Maintenance Fund', priority: 'Low' as Priority },
  { id: 'campus-cypress', name: 'Cypress Arts District', fundingSource: 'City Arts Grant', priority: 'High' as Priority },
  { id: 'campus-jefferson', name: 'Jefferson Parish Schools', fundingSource: 'JP Capital Plan', priority: 'Critical' as Priority },
  { id: 'campus-hospitality', name: 'Pelican Hospitality Sites', fundingSource: 'Private CapEx', priority: 'Medium' as Priority },
];

export const mockSites: Site[] = [
  { id: 'site-1', campusId: 'campus-wallace', name: 'Historic Building A', address: '123 Historic Lane, Wallace, LA', isHistoric: true, historicNotes: 'National Register listed. Requires SHPO approval for all modifications.' },
  { id: 'site-2', campusId: 'campus-wallace', name: 'Pergola Area', address: '123 Historic Lane, Wallace, LA', isHistoric: false },
  { id: 'site-3', campusId: 'campus-woodland', name: 'Main Gallery', address: '456 Museum Way, Laplace, LA', isHistoric: true, historicNotes: 'Opening to public Oct 2024. Architect review required.' },
  { id: 'site-4', campusId: 'campus-paris', name: 'Administrative Building', address: '789 Paris Rd, Paris, LA', isHistoric: false },
  { id: 'site-5', campusId: 'campus-cypress', name: 'Riverfront Sculpture Garden', address: '200 Cypress Ave, Baton Rouge, LA', isHistoric: false },
  { id: 'site-6', campusId: 'campus-jefferson', name: 'Jefferson Charter Campus', address: '1500 Jefferson Hwy, Gretna, LA', isHistoric: false },
  { id: 'site-7', campusId: 'campus-hospitality', name: 'Pelican Grand Ballroom', address: '88 Royal St, New Orleans, LA', isHistoric: false },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Wallace Historic Restoration',
    siteId: 'site-1',
    campusId: 'campus-wallace',
    clientName: 'Louisiana State Parks',
    clientPhone: '(225) 555-0100',
    clientEmail: 'parks@la.gov',
    clientLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&q=60',
    internalOwnerId: 'user-2',
    primeVendorId: 'vendor-1',
    status: 'Active',
    clientSummary: 'Stabilization and interior restoration ahead of 2025 reopening.',
    internalNotes: 'SHPO review scheduled monthly. Keep Chad looped in on change orders.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
    shareToken: 'share-proj-1',
    startDate: '2024-09-23',
    endDate: '2025-06-30',
    totalBudget: 150000,
    spentBudget: 48000,
  },
  {
    id: 'proj-2',
    name: 'Woodland Gallery Prep',
    siteId: 'site-3',
    campusId: 'campus-woodland',
    clientName: 'Woodland Heritage Foundation',
    clientPhone: '(504) 555-0200',
    clientEmail: 'info@woodlandheritage.org',
    clientLogo: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=120&q=60',
    internalOwnerId: 'user-1',
    primeVendorId: 'vendor-1',
    status: 'Closeout',
    clientSummary: 'Lighting and display upgrades for October exhibit launch.',
    internalNotes: 'Finance wants invoice batching by funding code.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
    shareToken: 'share-proj-2',
    startDate: '2024-06-01',
    endDate: '2024-10-15',
    totalBudget: 75000,
    spentBudget: 62000,
  },
  {
    id: 'proj-3',
    name: 'Paris Campus Maintenance',
    siteId: 'site-4',
    campusId: 'campus-paris',
    clientName: 'Parish Administration',
    clientPhone: '(318) 555-0300',
    clientEmail: 'maintenance@parish.gov',
    internalOwnerId: 'user-4',
    primeVendorId: 'vendor-1',
    status: 'Planning',
    clientSummary: 'Campus-wide preventative maintenance and HVAC upgrades.',
    internalNotes: 'Still scoping annual retainer terms.',
    clientVisibility: { showBudget: false, showTimeline: true, showInvoices: false, showContacts: true },
    shareToken: 'share-proj-3',
    startDate: '2024-11-01',
    endDate: '2025-12-31',
    totalBudget: 25000,
    spentBudget: 3500,
  },
  {
    id: 'proj-4',
    name: 'Cypress Riverfront Sculpture Garden',
    siteId: 'site-5',
    campusId: 'campus-cypress',
    clientName: 'Cypress Arts Council',
    clientPhone: '(225) 555-0400',
    clientEmail: 'director@cypressarts.org',
    internalOwnerId: 'user-2',
    primeVendorId: 'vendor-1',
    status: 'Active',
    clientSummary: 'New sculpture foundations, lighting, and paving for 2025 festival launch.',
    internalNotes: 'City engineering review due every Friday.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
    shareToken: 'share-proj-4',
    startDate: '2024-08-15',
    endDate: '2025-03-30',
    totalBudget: 120000,
    spentBudget: 42000,
  },
  {
    id: 'proj-5',
    name: 'Riverwalk Event Pavilion (Client Portal)',
    siteId: 'site-5',
    campusId: 'campus-cypress',
    clientName: 'Cypress Arts Council',
    clientPhone: '(225) 555-0400',
    clientEmail: 'director@cypressarts.org',
    internalOwnerId: 'user-1',
    primeVendorId: 'vendor-1',
    status: 'Planning',
    clientSummary: 'Converted from client portal request for pop-up pavilion and AV infrastructure.',
    internalNotes: 'Scope drafted from portal submission; awaiting board approval.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: false, showContacts: true },
    shareToken: 'share-proj-5',
    startDate: '2025-01-05',
    endDate: '2025-07-01',
    totalBudget: 90000,
    spentBudget: 0,
  },
  {
    id: 'proj-6',
    name: 'Jefferson Charter Retrofit',
    siteId: 'site-6',
    campusId: 'campus-jefferson',
    clientName: 'Jefferson Parish Schools',
    clientPhone: '(504) 555-0600',
    clientEmail: 'facilities@jpschools.gov',
    internalOwnerId: 'user-2',
    primeVendorId: 'vendor-1',
    status: 'Active',
    clientSummary: 'MEP upgrades and classroom modernization for charter campus.',
    internalNotes: 'Phase 1 funded. Phase 2 pending council vote.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
    shareToken: 'share-proj-6',
    startDate: '2024-07-01',
    endDate: '2025-05-15',
    totalBudget: 210000,
    spentBudget: 95000,
  },
  {
    id: 'proj-7',
    name: 'Jefferson Eastbank HVAC Modernization',
    siteId: 'site-6',
    campusId: 'campus-jefferson',
    clientName: 'Jefferson Parish Schools',
    clientPhone: '(504) 555-0600',
    clientEmail: 'facilities@jpschools.gov',
    internalOwnerId: 'user-4',
    primeVendorId: 'vendor-1',
    status: 'Planning',
    clientSummary: 'Client portal request for chiller replacement and controls.',
    internalNotes: 'Coordinate with energy service contract team.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: false, showContacts: true },
    shareToken: 'share-proj-7',
    startDate: '2025-02-01',
    endDate: '2025-09-30',
    totalBudget: 145000,
    spentBudget: 0,
  },
  {
    id: 'proj-8',
    name: 'Pelican Hospitality Ballroom Refresh',
    siteId: 'site-7',
    campusId: 'campus-hospitality',
    clientName: 'Pelican Hospitality Group',
    clientPhone: '(504) 555-0800',
    clientEmail: 'projects@pelicanhospitality.com',
    internalOwnerId: 'user-1',
    primeVendorId: 'vendor-1',
    status: 'Closeout',
    clientSummary: 'FF&E replacement, AV upgrades, and millwork refresh for ballroom.',
    internalNotes: 'Final punch scheduled with GM next week.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
    shareToken: 'share-proj-8',
    startDate: '2024-05-10',
    endDate: '2024-11-20',
    totalBudget: 98000,
    spentBudget: 87000,
  },
  {
    id: 'proj-9',
    name: 'Pelican Rooftop Lounge Expansion',
    siteId: 'site-7',
    campusId: 'campus-hospitality',
    clientName: 'Pelican Hospitality Group',
    clientPhone: '(504) 555-0800',
    clientEmail: 'projects@pelicanhospitality.com',
    internalOwnerId: 'user-2',
    primeVendorId: 'vendor-1',
    status: 'Active',
    clientSummary: 'New shade structure, bar build-out, and lighting for rooftop events.',
    internalNotes: 'Neighboring hotel concerned about sound; coordinate curfew signage.',
    clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
    shareToken: 'share-proj-9',
    startDate: '2024-10-01',
    endDate: '2025-04-15',
    totalBudget: 135000,
    spentBudget: 25000,
  },
];

export const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'Amelia Brooks',
    title: 'Historic Program Director',
    company: 'Louisiana State Parks',
    type: 'Client',
    email: 'amelia.brooks@la.gov',
    phone: '(225) 555-0140',
    campusId: 'campus-wallace',
    projectIds: ['proj-1'],
    leadIds: ['lead-1'],
    preferredChannel: 'Email',
    notes: 'Prefers weekly written updates.',
    clientPortalEnabled: true,
    createdAt: '2024-04-10T12:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
  },
  {
    id: 'contact-2',
    name: 'Derrick Landry',
    title: 'Facilities Liaison',
    company: 'Pelican State',
    type: 'Internal',
    email: 'derrick@pelicanstate.pro',
    phone: '(225) 555-0175',
    projectIds: ['proj-1', 'proj-2'],
    leadIds: ['lead-2'],
    preferredChannel: 'Phone',
    notes: 'Handles vendor escalations.',
    clientPortalEnabled: false,
    createdAt: '2024-02-15T15:00:00Z',
    updatedAt: '2024-09-20T09:00:00Z',
  },
  {
    id: 'contact-3',
    name: 'Helena Ruiz',
    title: 'Executive Director',
    company: 'Woodland Heritage Foundation',
    type: 'Client',
    email: 'helena@woodlandheritage.org',
    phone: '(504) 555-0260',
    campusId: 'campus-woodland',
    projectIds: ['proj-2'],
    leadIds: ['lead-2'],
    preferredChannel: 'Email',
    notes: 'Needs board-ready updates monthly.',
    clientPortalEnabled: true,
    createdAt: '2024-03-05T18:00:00Z',
    updatedAt: '2024-07-12T08:00:00Z',
  },
  {
    id: 'contact-4',
    name: 'Andre Martin',
    title: 'Parish Administrator',
    company: 'St. James Parish',
    type: 'Client',
    email: 'andre.martin@parish.gov',
    phone: '(318) 555-0345',
    campusId: 'campus-paris',
    projectIds: ['proj-3'],
    leadIds: [],
    preferredChannel: 'Email',
    notes: 'Focus on phased budgeting.',
    clientPortalEnabled: false,
    createdAt: '2024-08-01T14:00:00Z',
    updatedAt: '2024-10-15T11:00:00Z',
  },
  {
    id: 'contact-5',
    name: 'Renee Guidry',
    title: 'Executive Director',
    company: 'Cypress Arts Council',
    type: 'Client',
    email: 'renee@cypressarts.org',
    phone: '(225) 555-0444',
    campusId: 'campus-cypress',
    projectIds: ['proj-4', 'proj-5'],
    leadIds: ['lead-4'],
    preferredChannel: 'Email',
    notes: 'Reports to city council monthly; needs visuals for updates.',
    clientPortalEnabled: true,
    createdAt: '2024-06-01T12:00:00Z',
    updatedAt: '2024-10-10T08:00:00Z',
  },
  {
    id: 'contact-6',
    name: 'Ethan Broussard',
    title: 'Facilities Director',
    company: 'Jefferson Parish Schools',
    type: 'Client',
    email: 'ethan.broussard@jpschools.gov',
    phone: '(504) 555-0640',
    campusId: 'campus-jefferson',
    projectIds: ['proj-6', 'proj-7'],
    leadIds: ['lead-5'],
    preferredChannel: 'Phone',
    notes: 'Prefers morning coordination calls before 9am.',
    clientPortalEnabled: false,
    createdAt: '2024-05-20T15:00:00Z',
    updatedAt: '2024-10-05T11:00:00Z',
  },
  {
    id: 'contact-7',
    name: 'Marisa Leblanc',
    title: 'Director of Development',
    company: 'Pelican Hospitality Group',
    type: 'Client',
    email: 'marisa@pelicanhospitality.com',
    phone: '(504) 555-0820',
    campusId: 'campus-hospitality',
    projectIds: ['proj-8', 'proj-9'],
    leadIds: ['lead-6'],
    preferredChannel: 'Email',
    notes: 'Wants ROI summaries tied to bookings.',
    clientPortalEnabled: true,
    createdAt: '2024-04-18T13:00:00Z',
    updatedAt: '2024-11-05T09:00:00Z',
  },
];

export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    companyName: 'Louisiana State Parks',
    contactName: 'Amelia Brooks',
    email: 'amelia.brooks@la.gov',
    phone: '(225) 555-0140',
    stage: 'Proposal',
    source: 'Referral',
    estimatedValue: 185000,
    nextStep: 'Submit revised SHPO compliance schedule',
    notes: 'Need cost split between restoration and tourism grant.',
    campusId: 'campus-wallace',
    projectId: 'proj-1',
    contactIds: ['contact-1'],
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
  },
  {
    id: 'lead-2',
    companyName: 'Woodland Heritage Foundation',
    contactName: 'Helena Ruiz',
    email: 'helena@woodlandheritage.org',
    phone: '(504) 555-0260',
    stage: 'Won',
    source: 'Returning Client',
    estimatedValue: 80000,
    nextStep: 'Prepare closeout packet',
    notes: 'Board approved final change order.',
    campusId: 'campus-woodland',
    projectId: 'proj-2',
    contactIds: ['contact-3', 'contact-2'],
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-09-30T13:00:00Z',
  },
  {
    id: 'lead-3',
    companyName: 'St. James Parish',
    contactName: 'Andre Martin',
    email: 'andre.martin@parish.gov',
    phone: '(318) 555-0345',
    stage: 'Qualified',
    source: 'Inbound',
    estimatedValue: 120000,
    nextStep: 'Deliver preventative maintenance scope draft',
    notes: 'Looking for multi-year retainer.',
    campusId: 'campus-paris',
    contactIds: ['contact-4'],
    createdAt: '2024-08-20T09:00:00Z',
    updatedAt: '2024-10-18T07:30:00Z',
  },
  {
    id: 'lead-4',
    companyName: 'Cypress Arts Council',
    contactName: 'Renee Guidry',
    email: 'renee@cypressarts.org',
    phone: '(225) 555-0444',
    stage: 'Proposal',
    source: 'Client Portal',
    estimatedValue: 95000,
    nextStep: 'Confirm pavilion size + AV requirements',
    notes: 'Auto-created via portal submission for event pavilion.',
    campusId: 'campus-cypress',
    projectId: 'proj-5',
    contactIds: ['contact-5'],
    createdAt: '2024-10-25T12:30:00Z',
    updatedAt: '2024-11-05T09:00:00Z',
  },
  {
    id: 'lead-5',
    companyName: 'Jefferson Parish Schools',
    contactName: 'Ethan Broussard',
    email: 'ethan.broussard@jpschools.gov',
    phone: '(504) 555-0640',
    stage: 'Qualified',
    source: 'Client Portal',
    estimatedValue: 150000,
    nextStep: 'Schedule campus walkthrough with energy team',
    notes: 'Request for Eastbank HVAC modernization submitted via portal.',
    campusId: 'campus-jefferson',
    projectId: 'proj-7',
    contactIds: ['contact-6'],
    createdAt: '2024-11-01T08:15:00Z',
    updatedAt: '2024-11-10T10:00:00Z',
  },
  {
    id: 'lead-6',
    companyName: 'Pelican Hospitality Group',
    contactName: 'Marisa Leblanc',
    email: 'marisa@pelicanhospitality.com',
    phone: '(504) 555-0820',
    stage: 'Won',
    source: 'Client Portal',
    estimatedValue: 130000,
    nextStep: 'Finalize rooftop shading package',
    notes: 'Client portal request converted into Rooftop Lounge expansion project.',
    campusId: 'campus-hospitality',
    projectId: 'proj-9',
    contactIds: ['contact-7'],
    createdAt: '2024-09-18T14:00:00Z',
    updatedAt: '2024-10-02T11:30:00Z',
  },
];

export const mockClientAccounts: ClientAccount[] = [
  {
    id: 'client-account-1',
    company: 'Pelican Hospitality Group',
    primaryContact: 'Marisa Leblanc',
    email: 'marisa@pelicanhospitality.com',
    phone: '(504) 555-0820',
    projectIds: ['proj-9', 'proj-8'],
    notes: 'Prefers quarterly updates and on-demand intake access.',
  },
];

export const mockWalkthroughSessions: WalkthroughSessionRecord[] = [];

export const mockLeadIntakeRecords: LeadIntakeRecord[] = [];

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    projectId: 'proj-1',
    siteId: 'site-1',
    requestNumber: 'WO-2024-001',
    title: 'Restore plaster walls in east wing',
    description: 'Historic plaster restoration following SHPO guidelines. Walls show significant cracking and water damage.',
    locationDetail: 'East wing, rooms 101-105, all walls and ceilings',
    priority: 'Critical',
    category: 'Remodel',
    status: 'InProgress',
    requestedById: 'user-2',
    requestedDate: '2024-09-25',
    assignedVendorId: 'vendor-1',
    targetStartDate: '2024-10-01',
    targetEndDate: '2024-12-15',
    percentComplete: 45,
    estimatedCost: 32000,
    approvedQuoteId: 'quote-1',
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-09-25T10:00:00Z',
    updatedAt: '2024-11-15T14:30:00Z',
    materials: [
      { name: 'Lime plaster mix', quantity: 50, unit: 'bags', unitCost: 65 },
      { name: 'Scaffolding rental', quantity: 6, unit: 'weeks', unitCost: 450 },
    ],
    labor: [
      { role: 'Skilled Trade', hours: 320, rate: 75 },
      { role: 'Project Management', hours: 40, rate: 85 },
    ],
    aiQuestions: [
      'Document moisture content readings for each room?',
      'Confirm SHPO-approved materials and fasteners?',
      'What is the safe staging path for crews?',
    ],
    aiMaterialSummary: 'Historic-grade lime plaster, fasteners, scaffolding, protective tarps.',
    aiLaborSummary: 'Four plaster artisans, one PM, one laborer for staging.',
  },
  {
    id: 'wo-2',
    projectId: 'proj-1',
    siteId: 'site-1',
    requestNumber: 'WO-2024-002',
    title: 'Replace flooring in main hall',
    description: 'Remove damaged flooring and install period-appropriate heart pine to match original.',
    locationDetail: 'Main hall, ground floor, approximately 800 sq ft',
    priority: 'High',
    category: 'Remodel',
    status: 'AwaitingApproval',
    requestedById: 'user-2',
    requestedDate: '2024-10-05',
    percentComplete: 0,
    estimatedCost: 18000,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-10-05T09:00:00Z',
    updatedAt: '2024-10-05T09:00:00Z',
    materials: [
      { name: 'Heart pine flooring', quantity: 800, unit: 'sqft', unitCost: 12 },
      { name: 'Moisture barrier', quantity: 10, unit: 'rolls', unitCost: 55 },
    ],
    labor: [
      { role: 'Manual Labor', hours: 120, rate: 45 },
      { role: 'Skilled Trade', hours: 140, rate: 75 },
    ],
    aiQuestions: [
      'Verify subfloor moisture <12% before install?',
      'Need to coordinate with event schedule for downtime?',
    ],
    aiMaterialSummary: 'Period-correct flooring, adhesives, barriers, trim kits.',
    aiLaborSummary: 'Demo crew, carpenters, PM for SHPO reporting.',
  },
  {
    id: 'wo-3',
    projectId: 'proj-2',
    siteId: 'site-3',
    requestNumber: 'WO-2024-003',
    title: 'Install display lighting',
    description: 'Museum-grade LED track lighting for gallery spaces. Must meet conservation standards.',
    locationDetail: 'Gallery rooms A, B, and C on second floor',
    priority: 'High',
    category: 'Remodel',
    status: 'Completed',
    requestedById: 'user-1',
    requestedDate: '2024-06-15',
    assignedVendorId: 'vendor-1',
    targetStartDate: '2024-07-01',
    targetEndDate: '2024-08-15',
    percentComplete: 100,
    estimatedCost: 12500,
    approvedQuoteId: 'quote-2',
    completionChecklistDone: true,
    completionPhotoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    historicCompliance: {
      materialsUsed: 'LED track fixtures (Lutron), low-UV bulbs, period-style housings',
      methodsApplied: 'Non-invasive mounting using existing conduit paths',
      architectGuidance: 'Approved by Historic Architect Jane Doe on 6/20/24',
      complianceNotes: 'SHPO review passed. No visible alterations to historic fabric.',
      photoUrls: ['https://example.com/compliance1.jpg'],
    },
    createdAt: '2024-06-15T11:00:00Z',
    updatedAt: '2024-08-20T16:00:00Z',
    materials: [
      { name: 'LED track fixtures', quantity: 24, unit: 'ea', unitCost: 350 },
      { name: 'Low-UV bulbs', quantity: 24, unit: 'ea', unitCost: 45 },
    ],
    labor: [
      { role: 'Skilled Trade', hours: 80, rate: 65 },
      { role: 'Project Management', hours: 20, rate: 85 },
    ],
    aiQuestions: [
      'Do fixtures meet museum-grade lux + UV limits?',
      'What is after-hours access policy for install?',
    ],
    aiMaterialSummary: 'Track fixtures, low-UV lamps, control wiring.',
    aiLaborSummary: 'Electricians + PM coordination.',
  },
  {
    id: 'wo-4',
    projectId: 'proj-3',
    siteId: 'site-4',
    requestNumber: 'WO-2024-004',
    title: 'Fix HVAC unit in admin office',
    description: 'AC unit not cooling properly. May need refrigerant recharge or compressor replacement.',
    locationDetail: 'Admin building, room 201',
    priority: 'Medium',
    category: 'Repair',
    status: 'Requested',
    requestedById: 'user-1',
    requestedDate: '2024-11-10',
    percentComplete: 0,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-11-10T08:00:00Z',
    updatedAt: '2024-11-10T08:00:00Z',
    materials: [
      { name: 'Refrigerant R-410A', quantity: 2, unit: 'drums', unitCost: 400 },
      { name: 'Compressor kit', quantity: 1, unit: 'ea', unitCost: 1800 },
    ],
    labor: [
      { role: 'HVAC Tech', hours: 24, rate: 75 },
      { role: 'Manual Labor', hours: 8, rate: 45 },
    ],
    aiQuestions: [
      'Check permit requirements for refrigerant handling?',
      'What uptime requirements for admin wing?',
    ],
    aiMaterialSummary: 'HVAC diagnostics kit, refrigerant, compressor spare.',
    aiLaborSummary: 'HVAC tech pair plus helper.',
  },
  {
    id: 'wo-5',
    projectId: 'proj-1',
    siteId: 'site-2',
    requestNumber: 'WO-2024-005',
    title: 'Event setup - Holiday gathering',
    description: 'Setup tables, chairs, lighting for December holiday event at pergola.',
    locationDetail: 'Pergola area, outdoor space',
    priority: 'Low',
    category: 'Event',
    status: 'Scheduled',
    requestedById: 'user-2',
    requestedDate: '2024-11-01',
    assignedVendorId: 'vendor-1',
    targetStartDate: '2024-12-10',
    targetEndDate: '2024-12-12',
    percentComplete: 0,
    estimatedCost: 2500,
    approvedQuoteId: 'quote-3',
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-11-20T09:00:00Z',
    materials: [
      { name: 'Event lighting package', quantity: 1, unit: 'lot', unitCost: 1200 },
      { name: 'Tent flooring panels', quantity: 40, unit: 'ea', unitCost: 25 },
    ],
    labor: [
      { role: 'Manual Labor', hours: 64, rate: 45 },
      { role: 'Project Management', hours: 12, rate: 75 },
    ],
    aiQuestions: [
      'Weather contingency needed for pergola area?',
      'Power load for temporary lighting?',
    ],
    aiMaterialSummary: 'Rental lighting, flooring, décor rigging.',
    aiLaborSummary: 'Event setup crew with PM oversight.',
  },
  {
    id: 'wo-6',
    projectId: 'proj-4',
    siteId: 'site-5',
    requestNumber: 'WO-2024-006',
    title: 'Install sculpture foundations',
    description: 'Excavate and pour reinforced footings for six large-scale sculptures.',
    locationDetail: 'Riverfront plaza, grid sections A-C',
    priority: 'High',
    category: 'Construction',
    status: 'InProgress',
    requestedById: 'user-2',
    requestedDate: '2024-09-10',
    assignedVendorId: 'vendor-1',
    targetStartDate: '2024-09-18',
    targetEndDate: '2024-11-05',
    percentComplete: 55,
    estimatedCost: 68000,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-09-10T11:00:00Z',
    updatedAt: '2024-11-10T08:00:00Z',
    materials: [
      { name: 'Concrete mix', quantity: 120, unit: 'yd³', unitCost: 140 },
      { name: 'Rebar cages', quantity: 6, unit: 'ea', unitCost: 900 },
    ],
    labor: [
      { role: 'Manual Labor', hours: 200, rate: 45 },
      { role: 'Skilled Trade', hours: 180, rate: 75 },
    ],
    aiQuestions: [
      'Verify soil bearing capacity with geotech?',
      'Any river flood restrictions during pour?',
    ],
    aiMaterialSummary: 'Excavation equipment, rebar cages, concrete with corrosion inhibitors.',
    aiLaborSummary: 'Excavation crew, concrete finishers, PM for safety barricades.',
  },
  {
    id: 'wo-7',
    projectId: 'proj-4',
    siteId: 'site-5',
    requestNumber: 'WO-2024-007',
    title: 'Garden lighting + controls',
    description: 'Install low-voltage lighting and DMX control for art installations.',
    locationDetail: 'Garden pathways and sculpture pads',
    priority: 'Medium',
    category: 'Electrical',
    status: 'Scheduled',
    requestedById: 'user-2',
    requestedDate: '2024-10-20',
    targetStartDate: '2024-12-05',
    targetEndDate: '2025-01-15',
    percentComplete: 0,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-10-20T10:00:00Z',
    updatedAt: '2024-10-28T12:00:00Z',
    materials: [
      { name: 'Low-voltage fixtures', quantity: 45, unit: 'ea', unitCost: 180 },
      { name: 'DMX control gear', quantity: 1, unit: 'lot', unitCost: 5200 },
    ],
    labor: [
      { role: 'Skilled Trade', hours: 120, rate: 70 },
      { role: 'Project Management', hours: 24, rate: 85 },
    ],
    aiQuestions: [
      'Need conduit path approval from city electrical inspector?',
      'What are lighting curfew requirements?',
    ],
    aiMaterialSummary: 'Weatherproof fixtures, buried conduit, DMX controller, uplights.',
    aiLaborSummary: 'Electricians, low-voltage programmer, PM for nightly aim adjustments.',
  },
  {
    id: 'wo-8',
    projectId: 'proj-5',
    siteId: 'site-5',
    requestNumber: 'WO-2024-008',
    title: 'Event pavilion concept & walkthrough',
    description: 'Document site conditions, generate questionnaire, and capture measurements for pavilion design.',
    locationDetail: 'Riverwalk promenade',
    priority: 'Medium',
    category: 'Planning',
    status: 'Requested',
    requestedById: 'user-1',
    requestedDate: '2024-11-05',
    percentComplete: 0,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-11-05T09:30:00Z',
    updatedAt: '2024-11-05T09:30:00Z',
    materials: [],
    labor: [
      { role: 'Project Management', hours: 16, rate: 85 },
      { role: 'Skilled Trade', hours: 12, rate: 75 },
    ],
    aiQuestions: [
      'What power and water hookups are available?',
      'Need ADA route between pavilion and parking?',
      'What weather contingency plan is acceptable?',
    ],
    aiMaterialSummary: 'Survey equipment, drone images, temporary stakes.',
    aiLaborSummary: 'PM plus estimator to capture scope and produce client questionnaire.',
  },
  {
    id: 'wo-9',
    projectId: 'proj-6',
    siteId: 'site-6',
    requestNumber: 'WO-2024-009',
    title: 'Interior MEP demolition',
    description: 'Remove outdated ductwork, piping, and electrical runs in north classroom wing.',
    locationDetail: 'Jefferson Charter north wing classrooms',
    priority: 'High',
    category: 'Demolition',
    status: 'InProgress',
    requestedById: 'user-2',
    requestedDate: '2024-07-10',
    assignedVendorId: 'vendor-1',
    targetStartDate: '2024-07-20',
    targetEndDate: '2024-09-01',
    percentComplete: 70,
    estimatedCost: 45000,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-07-10T08:00:00Z',
    updatedAt: '2024-10-01T12:00:00Z',
    materials: [
      { name: 'Containment plastic', quantity: 12, unit: 'rolls', unitCost: 35 },
      { name: 'Dumpster rental', quantity: 4, unit: 'ea', unitCost: 600 },
    ],
    labor: [
      { role: 'Manual Labor', hours: 280, rate: 45 },
      { role: 'Skilled Trade', hours: 160, rate: 75 },
    ],
    aiQuestions: [
      'Any asbestos or lead abatement required?',
      'What hours allowed during summer school?',
    ],
    aiMaterialSummary: 'Demo gear, dumpsters, negative air machines.',
    aiLaborSummary: 'Demo crew with MEP foreman and PM.',
  },
  {
    id: 'wo-10',
    projectId: 'proj-6',
    siteId: 'site-6',
    requestNumber: 'WO-2024-010',
    title: 'Classroom finishes package',
    description: 'Install new ceiling tiles, LED troffers, and LVT flooring in 12 classrooms.',
    locationDetail: 'Classrooms N101-N112',
    priority: 'Medium',
    category: 'Remodel',
    status: 'Scoped',
    requestedById: 'user-2',
    requestedDate: '2024-09-30',
    percentComplete: 0,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-09-30T09:00:00Z',
    updatedAt: '2024-10-02T11:00:00Z',
    materials: [
      { name: 'LED troffers', quantity: 96, unit: 'ea', unitCost: 220 },
      { name: 'Ceiling grid + tile', quantity: 4800, unit: 'sqft', unitCost: 2.8 },
      { name: 'LVT flooring', quantity: 7200, unit: 'sqft', unitCost: 3.5 },
    ],
    labor: [
      { role: 'Skilled Trade', hours: 260, rate: 70 },
      { role: 'Project Management', hours: 40, rate: 85 },
    ],
    aiQuestions: [
      'Need after-hours install to avoid classes?',
      'Are moisture tests required for new flooring?',
    ],
    aiMaterialSummary: 'Lighting package, ceiling grid/tile, resilient flooring.',
    aiLaborSummary: 'Finish crew with electrician support, PM weekly check-ins.',
  },
  {
    id: 'wo-11',
    projectId: 'proj-7',
    siteId: 'site-6',
    requestNumber: 'WO-2024-011',
    title: 'Chiller assessment + temp cooling plan',
    description: 'Assess failing chiller, capture measurements, and propose temporary cooling strategy.',
    locationDetail: 'Eastbank mechanical yard',
    priority: 'High',
    category: 'Planning',
    status: 'Requested',
    requestedById: 'user-4',
    requestedDate: '2024-11-08',
    percentComplete: 0,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-11-08T08:30:00Z',
    updatedAt: '2024-11-08T08:30:00Z',
    materials: [],
    labor: [
      { role: 'HVAC Tech', hours: 32, rate: 80 },
      { role: 'Project Management', hours: 8, rate: 85 },
    ],
    aiQuestions: [
      'What is backup power capacity?',
      'Need noise mitigation for rental chillers?',
    ],
    aiMaterialSummary: 'Inspection tools, temporary ducting layouts.',
    aiLaborSummary: 'HVAC engineer + PM walkthrough with facilities.',
  },
  {
    id: 'wo-12',
    projectId: 'proj-8',
    siteId: 'site-7',
    requestNumber: 'WO-2024-012',
    title: 'Ballroom FF&E punch',
    description: 'Finalize punch list for FF&E install, capture photos for client sign-off.',
    locationDetail: 'Pelican Grand Ballroom',
    priority: 'Medium',
    category: 'Closeout',
    status: 'Completed',
    requestedById: 'user-1',
    requestedDate: '2024-10-15',
    percentComplete: 100,
    completionChecklistDone: true,
    completionPhotoUrls: ['https://example.com/ballroom1.jpg'],
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-11-18T09:00:00Z',
    materials: [
      { name: 'Protective felt pads', quantity: 200, unit: 'ea', unitCost: 2 },
    ],
    labor: [
      { role: 'Project Management', hours: 20, rate: 85 },
      { role: 'Manual Labor', hours: 30, rate: 45 },
    ],
    aiQuestions: [
      'Does client want additional AV presets saved?',
      'Confirm cleaning vendor schedule for turnover?',
    ],
    aiMaterialSummary: 'FF&E punch supplies, floor protection, touch-up kits.',
    aiLaborSummary: 'PM plus installer crew to resolve punch list items.',
  },
  {
    id: 'wo-13',
    projectId: 'proj-9',
    siteId: 'site-7',
    requestNumber: 'WO-2024-013',
    title: 'Shade structure fabrication',
    description: 'Fabricate and install steel shade canopy with integrated fans.',
    locationDetail: 'Rooftop lounge south zone',
    priority: 'High',
    category: 'Construction',
    status: 'AwaitingApproval',
    requestedById: 'user-2',
    requestedDate: '2024-10-12',
    estimatedCost: 54000,
    percentComplete: 0,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-10-12T11:00:00Z',
    updatedAt: '2024-11-02T10:00:00Z',
    materials: [
      { name: 'Steel columns + beams', quantity: 1, unit: 'lot', unitCost: 24000 },
      { name: 'Outdoor fans + controls', quantity: 6, unit: 'ea', unitCost: 850 },
    ],
    labor: [
      { role: 'Skilled Trade', hours: 180, rate: 75 },
      { role: 'Project Management', hours: 30, rate: 85 },
    ],
    aiQuestions: [
      'Need structural engineer review for rooftop load?',
      'Any permitting for wind loads or lighting?',
    ],
    aiMaterialSummary: 'Steel canopy package, anchoring hardware, outdoor fans.',
    aiLaborSummary: 'Steel crew, welder, PM for safety coordination.',
  },
  {
    id: 'wo-14',
    projectId: 'proj-9',
    siteId: 'site-7',
    requestNumber: 'WO-2024-014',
    title: 'Rooftop lighting & audio rig',
    description: 'Add LED wash lighting and distributed audio for lounge events.',
    locationDetail: 'Rooftop lounge perimeter',
    priority: 'Medium',
    category: 'Electrical',
    status: 'Scheduled',
    requestedById: 'user-1',
    requestedDate: '2024-11-02',
    targetStartDate: '2025-01-05',
    targetEndDate: '2025-02-20',
    percentComplete: 0,
    completionChecklistDone: false,
    completionPhotoUrls: [],
    createdAt: '2024-11-02T12:00:00Z',
    updatedAt: '2024-11-10T09:00:00Z',
    materials: [
      { name: 'LED wash fixtures', quantity: 30, unit: 'ea', unitCost: 260 },
      { name: 'Audio speakers + DSP', quantity: 1, unit: 'lot', unitCost: 7800 },
    ],
    labor: [
      { role: 'Skilled Trade', hours: 140, rate: 70 },
      { role: 'Project Management', hours: 24, rate: 85 },
    ],
    aiQuestions: [
      'Need structural review for lighting truss?',
      'Noise curfew restrictions from city?',
    ],
    aiMaterialSummary: 'LED fixtures, DMX control, audio distribution gear.',
    aiLaborSummary: 'Electricians + AV specialist, PM for nightly testing.',
  },
];

export const mockQuotes: Quote[] = [
  {
    id: 'quote-1',
    workOrderId: 'wo-1',
    version: 1,
    status: 'Approved',
    lineItems: [
      { id: 'li-1', description: 'Plaster repair - labor', laborClass: 'Skilled Trade', quantity: 120, unitCost: 75, total: 9000 },
      { id: 'li-2', description: 'Plaster repair - materials', laborClass: 'Materials', quantity: 1, unitCost: 8000, total: 8000 },
      { id: 'li-3', description: 'Historic documentation', laborClass: 'Project Management', quantity: 20, unitCost: 85, total: 1700 },
      { id: 'li-4', description: 'Scaffolding rental', laborClass: 'Equipment', quantity: 60, unitCost: 50, total: 3000 },
    ],
    totalEstimate: 21700,
    notToExceed: 25000,
    submittedAt: '2024-09-28T10:00:00Z',
    approvedById: 'user-1',
    approvedAt: '2024-09-30T14:00:00Z',
    fundingCode: 'SHF-2024-001',
    createdAt: '2024-09-27T09:00:00Z',
  },
  {
    id: 'quote-2',
    workOrderId: 'wo-3',
    version: 1,
    status: 'Approved',
    lineItems: [
      { id: 'li-5', description: 'LED track lighting - fixtures', laborClass: 'Materials', quantity: 24, unitCost: 350, total: 8400 },
      { id: 'li-6', description: 'Electrical installation', laborClass: 'Skilled Trade', quantity: 40, unitCost: 65, total: 2600 },
      { id: 'li-7', description: 'Project management', laborClass: 'Project Management', quantity: 10, unitCost: 85, total: 850 },
    ],
    totalEstimate: 11850,
    notToExceed: 12500,
    submittedAt: '2024-06-20T10:00:00Z',
    approvedById: 'user-1',
    approvedAt: '2024-06-22T11:00:00Z',
    fundingCode: 'PTB-2024-003',
    createdAt: '2024-06-18T09:00:00Z',
  },
  {
    id: 'quote-3',
    workOrderId: 'wo-5',
    version: 1,
    status: 'Approved',
    lineItems: [
      { id: 'li-8', description: 'Event setup labor', laborClass: 'Manual Labor', quantity: 16, unitCost: 45, total: 720 },
      { id: 'li-9', description: 'Equipment rental', laborClass: 'Equipment', quantity: 1, unitCost: 800, total: 800 },
      { id: 'li-10', description: 'Supervision', laborClass: 'Project Management', quantity: 8, unitCost: 75, total: 600 },
    ],
    totalEstimate: 2120,
    notToExceed: 2500,
    submittedAt: '2024-11-05T10:00:00Z',
    approvedById: 'user-1',
    approvedAt: '2024-11-08T09:00:00Z',
    fundingCode: 'SHF-2024-002',
    createdAt: '2024-11-03T14:00:00Z',
  },
  {
    id: 'quote-4',
    workOrderId: 'wo-2',
    version: 1,
    status: 'Submitted',
    lineItems: [
      { id: 'li-11', description: 'Flooring removal', laborClass: 'Manual Labor', quantity: 40, unitCost: 45, total: 1800 },
      { id: 'li-12', description: 'Heart pine flooring - materials', laborClass: 'Materials', quantity: 800, unitCost: 12, total: 9600 },
      { id: 'li-13', description: 'Flooring installation', laborClass: 'Skilled Trade', quantity: 60, unitCost: 75, total: 4500 },
      { id: 'li-14', description: 'Historic documentation', laborClass: 'Project Management', quantity: 15, unitCost: 85, total: 1275 },
    ],
    totalEstimate: 17175,
    notToExceed: 18000,
    submittedAt: '2024-10-10T10:00:00Z',
    fundingCode: 'SHF-2024-003',
    createdAt: '2024-10-08T09:00:00Z',
  },
];

export const mockWorkLogs: WorkLog[] = [
  { id: 'log-1', workOrderId: 'wo-1', type: 'statusChange', message: 'Work order created', createdById: 'user-2', createdByName: 'Chad Williams', createdAt: '2024-09-25T10:00:00Z' },
  { id: 'log-2', workOrderId: 'wo-1', type: 'note', message: 'Initial site assessment completed. Water damage more extensive than expected.', createdById: 'user-3', createdByName: 'Marcus Johnson', createdAt: '2024-09-26T14:00:00Z' },
  { id: 'log-3', workOrderId: 'wo-1', type: 'approval', message: 'Quote v1 approved by Latoya Thompson. NTE: $25,000', createdById: 'user-1', createdByName: 'Latoya Thompson', createdAt: '2024-09-30T14:00:00Z' },
  { id: 'log-4', workOrderId: 'wo-1', type: 'scheduleUpdate', message: 'Work scheduled to begin Oct 1, 2024', createdById: 'user-2', createdByName: 'Chad Williams', createdAt: '2024-09-30T15:00:00Z' },
  { id: 'log-5', workOrderId: 'wo-1', type: 'statusChange', message: 'Status changed to In Progress', createdById: 'user-3', createdByName: 'Marcus Johnson', createdAt: '2024-10-01T08:00:00Z' },
  { id: 'log-6', workOrderId: 'wo-1', type: 'note', message: 'Completed rooms 101-102. Moving to 103 tomorrow.', createdById: 'user-3', createdByName: 'Marcus Johnson', createdAt: '2024-10-15T16:00:00Z', attachments: ['https://example.com/progress1.jpg'] },
  { id: 'log-7', workOrderId: 'wo-1', type: 'delay', message: 'Weather delay - rain damage to exposed areas. 3-day setback.', createdById: 'user-3', createdByName: 'Marcus Johnson', createdAt: '2024-10-20T09:00:00Z' },
  { id: 'log-8', workOrderId: 'wo-3', type: 'statusChange', message: 'Work order created', createdById: 'user-1', createdByName: 'Latoya Thompson', createdAt: '2024-06-15T11:00:00Z' },
  { id: 'log-9', workOrderId: 'wo-3', type: 'approval', message: 'Quote v1 approved. NTE: $12,500', createdById: 'user-1', createdByName: 'Latoya Thompson', createdAt: '2024-06-22T11:00:00Z' },
  { id: 'log-10', workOrderId: 'wo-3', type: 'completion', message: 'All work completed. Final inspection passed.', createdById: 'user-3', createdByName: 'Marcus Johnson', createdAt: '2024-08-15T15:00:00Z' },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2024-001',
    projectId: 'proj-2',
    campusId: 'campus-woodland',
    fundingCode: 'PTB-2024-003',
    primeVendorId: 'vendor-1',
    workOrderIds: ['wo-3'],
    lineItems: [
      { id: 'ili-1', workOrderId: 'wo-3', quoteLineItemId: 'li-5', description: 'LED track lighting - fixtures', location: 'Gallery rooms A, B, C', quantity: 24, rate: 350, amount: 8400, workPerformedNotes: 'Installed 24 museum-grade LED track fixtures per spec.' },
      { id: 'ili-2', workOrderId: 'wo-3', quoteLineItemId: 'li-6', description: 'Electrical installation', location: 'Gallery rooms A, B, C', quantity: 40, rate: 65, amount: 2600, workPerformedNotes: 'Ran conduit and wired all fixtures. Passed inspection.' },
      { id: 'ili-3', workOrderId: 'wo-3', quoteLineItemId: 'li-7', description: 'Project management', location: 'Gallery rooms A, B, C', quantity: 10, rate: 85, amount: 850, workPerformedNotes: 'Coordination with museum staff and historic architect.' },
    ],
    totalAmount: 11850,
    status: 'Paid',
    submittedAt: '2024-08-20T10:00:00Z',
    approvedAt: '2024-08-23T14:00:00Z',
    approvedById: 'user-4',
    paidAt: '2024-08-30T09:00:00Z',
    paymentMethod: 'ACH',
    paymentReference: 'ACH-2024-08-30-001',
    createdAt: '2024-08-18T09:00:00Z',
  },
];

export const mockPaymentSyncRecords: PaymentSyncRecord[] = [
  {
    id: 'psr-1',
    invoiceId: 'inv-1',
    provider: 'Stripe',
    status: 'Synced',
    reference: 'pi_demo_123',
    payload: { amount: 11850, currency: 'usd' },
    createdAt: '2024-08-20T12:00:00Z',
    updatedAt: '2024-08-23T14:00:00Z',
  },
  {
    id: 'psr-2',
    invoiceId: 'inv-1',
    provider: 'QuickBooks',
    status: 'Synced',
    reference: 'qbo-9981',
    payload: { customer: 'Woodland Heritage Foundation' },
    createdAt: '2024-08-20T12:05:00Z',
    updatedAt: '2024-08-30T09:00:00Z',
  },
];

export const mockFinancialAuditLog: FinancialAuditEntry[] = [
  {
    id: 'audit-1',
    entity: 'Invoice',
    entityId: 'inv-1',
    action: 'SYNC_STRIPE',
    actorId: 'user-4',
    metadata: { intentId: 'pi_demo_123' },
    createdAt: '2024-08-20T12:00:00Z',
  },
  {
    id: 'audit-2',
    entity: 'AI',
    entityId: 'ai-price-1',
    action: 'PRICING_GENERATED',
    actorId: 'system-ai',
    metadata: { margin: 0.305 },
    createdAt: '2024-09-04T10:00:00Z',
  },
];

export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    projectId: 'proj-1',
    contractType: 'Fixed',
    billingMethod: 'Milestone',
    contractValue: 185000,
    retainagePercentage: 10,
    startDate: '2024-09-15',
    endDate: '2025-07-01',
    status: 'Active',
    createdBy: 'user-2',
    approvedBy: 'user-1',
    approvedAt: '2024-09-12T16:00:00Z',
    aiRecommendationId: 'ai-rec-1',
    notes: 'Includes SHPO contingency and weather clause.',
  },
  {
    id: 'contract-2',
    projectId: 'proj-3',
    contractType: 'Retainer',
    billingMethod: 'Simple',
    retainerAmount: 18000,
    retainagePercentage: 0,
    startDate: '2024-11-01',
    status: 'Active',
    createdBy: 'user-4',
    notes: 'Campus-wide preventative maintenance retainer billed monthly.',
  },
  {
    id: 'contract-3',
    projectId: 'proj-6',
    contractType: 'CostPlus',
    billingMethod: 'Progress',
    feePercentage: 12,
    retainagePercentage: 5,
    startDate: '2024-07-15',
    status: 'Active',
    createdBy: 'user-2',
    approvedBy: 'user-1',
    approvedAt: '2024-07-10T09:00:00Z',
    aiRecommendationId: 'ai-rec-2',
    notes: 'Cost-plus fee capped at $150K. Requires weekly cost ledger updates.',
  },
];

export const mockMilestones: Milestone[] = [
  {
    id: 'milestone-1',
    contractId: 'contract-1',
    name: 'Mobilization + Site Protection',
    description: 'Site setup, scaffolding, SHPO inspections.',
    scheduledDate: '2024-09-30',
    amount: 25000,
    status: 'Paid',
    readyToBillAt: '2024-09-28T14:00:00Z',
    invoicedInvoiceId: 'inv-1',
    paidAt: '2024-10-15T13:00:00Z',
  },
  {
    id: 'milestone-2',
    contractId: 'contract-1',
    name: 'Interior Restoration 60%',
    scheduledDate: '2024-12-15',
    amount: 80000,
    status: 'ReadyToBill',
    readyToBillAt: '2024-12-10T09:00:00Z',
  },
  {
    id: 'milestone-3',
    contractId: 'contract-1',
    name: 'Substantial Completion + Retainage Release',
    scheduledDate: '2025-06-30',
    amount: 60000,
    status: 'Pending',
  },
  {
    id: 'milestone-4',
    contractId: 'contract-2',
    name: 'Monthly Retainer – November',
    scheduledDate: '2024-11-30',
    amount: 1500,
    status: 'Invoiced',
    invoicedInvoiceId: 'inv-1',
  },
];

export const mockScheduleOfValues: ScheduleOfValuesEntry[] = [
  {
    id: 'sov-1',
    contractId: 'contract-1',
    lineItem: 'Historic Envelope Repairs',
    budgetAmount: 90000,
    percentComplete: 55,
    amountEarned: 49500,
    lastUpdated: '2024-11-18T08:00:00Z',
  },
  {
    id: 'sov-2',
    contractId: 'contract-1',
    lineItem: 'Interior Finishes + MEP',
    budgetAmount: 70000,
    percentComplete: 30,
    amountEarned: 21000,
    lastUpdated: '2024-11-18T08:00:00Z',
  },
  {
    id: 'sov-3',
    contractId: 'contract-3',
    lineItem: 'Demolition + Abatement',
    budgetAmount: 45000,
    percentComplete: 70,
    amountEarned: 31500,
    lastUpdated: '2024-10-15T12:00:00Z',
  },
  {
    id: 'sov-4',
    contractId: 'contract-3',
    lineItem: 'Classroom Buildout',
    budgetAmount: 95000,
    percentComplete: 25,
    amountEarned: 23750,
    lastUpdated: '2024-11-05T10:00:00Z',
  },
];

export const mockCostLedgerEntries: CostLedgerEntry[] = [
  {
    id: 'cle-1',
    projectId: 'proj-1',
    contractId: 'contract-1',
    category: 'Labor',
    description: 'Plaster artisan crew weeks 1-4',
    committedAmount: 28000,
    actualAmount: 26500,
    vendorId: 'vendor-1',
    recordedBy: 'user-2',
    recordedAt: '2024-10-31T16:00:00Z',
  },
  {
    id: 'cle-2',
    projectId: 'proj-1',
    contractId: 'contract-1',
    category: 'Material',
    description: 'Historic lime plaster + scaffolding rental',
    committedAmount: 18000,
    actualAmount: 17200,
    vendorId: 'vendor-1',
    recordedBy: 'user-2',
    recordedAt: '2024-11-05T09:45:00Z',
  },
  {
    id: 'cle-3',
    projectId: 'proj-3',
    contractId: 'contract-2',
    category: 'Labor',
    description: 'Monthly PM allowance',
    actualAmount: 3500,
    recordedBy: 'user-4',
    recordedAt: '2024-11-30T18:00:00Z',
  },
  {
    id: 'cle-4',
    projectId: 'proj-6',
    contractId: 'contract-3',
    category: 'Subcontractor',
    description: 'MEP demo subcontract PO-7781',
    committedAmount: 52000,
    actualAmount: 49800,
    vendorId: 'vendor-2',
    invoiceReference: 'AP-2391',
    recordedBy: 'user-4',
    recordedAt: '2024-10-02T11:30:00Z',
  },
];

export const mockAIContractRecommendations: AIContractRecommendation[] = [
  {
    id: 'ai-rec-1',
    projectId: 'proj-1',
    suggestedContract: 'Fixed',
    suggestedBilling: 'Milestone',
    rationale: 'Scope well-defined, SHPO approvals enforceable. Fixed price + milestone billing reduces change order churn.',
    riskScore: 62,
    confidenceScore: 0.78,
    aiInputSnapshot: {
      scopeClarity: 4,
      historicFlag: true,
      permitComplexity: 'Medium',
      durationDays: 285,
      clientType: 'StateAgency',
    },
    aiOutputSnapshot: { marginBand: '30-35%', retainageRecommended: 10 },
    createdAt: '2024-09-05T15:00:00Z',
    createdBy: 'system-ai',
  },
  {
    id: 'ai-rec-2',
    projectId: 'proj-6',
    suggestedContract: 'CostPlus',
    suggestedBilling: 'Progress',
    rationale: 'Large unknowns in demo + MEP reconfig. Cost-plus w/ progress billing protects margin.',
    riskScore: 71,
    confidenceScore: 0.72,
    aiInputSnapshot: {
      scopeClarity: 2,
      historicFlag: false,
      permitComplexity: 'High',
      durationDays: 240,
      campus: 'Jefferson Charter',
    },
    aiOutputSnapshot: { marginBand: '22-28%', contingency: 0.12 },
    createdAt: '2024-07-05T12:30:00Z',
    createdBy: 'system-ai',
    humanOverride: false,
  },
];

export const mockAIPricingSnapshots: AIPricingSnapshot[] = [
  {
    id: 'ai-price-1',
    projectId: 'proj-1',
    contractId: 'contract-1',
    directCost: 41000,
    overheadAllocated: 4920,
    contingency: 2870,
    grossProfit: 6880,
    projectedMargin: 0.305,
    riskScore: 58,
    suggestedContractType: 'Fixed',
    pricingVersion: 'v1.0.3',
    laborRateSnapshot: {
      carpenter: 69.98,
      pm: 92.5,
    },
    overheadRateSnapshot: {
      annualOverhead: 750000,
      revenueTarget: 5000000,
      overheadRate: 0.15,
    },
    contingencyNotes: 'Historic unknowns add 7% contingency.',
    createdAt: '2024-09-04T10:00:00Z',
    createdBy: 'system-ai',
  },
  {
    id: 'ai-price-2',
    projectId: 'proj-6',
    contractId: 'contract-3',
    directCost: 82000,
    overheadAllocated: 12300,
    contingency: 5740,
    grossProfit: 16840,
    projectedMargin: 0.24,
    riskScore: 74,
    suggestedContractType: 'CostPlus',
    pricingVersion: 'v1.0.3',
    laborRateSnapshot: {
      electrician: 72.4,
      laborer: 52.1,
    },
    overheadRateSnapshot: {
      annualOverhead: 780000,
      revenueTarget: 5200000,
      overheadRate: 0.15,
    },
    contingencyNotes: 'MEP unknowns trigger 12% contingency.',
    createdAt: '2024-07-04T09:00:00Z',
    createdBy: 'system-ai',
  },
];

export const mockPermitRecords: PermitRecord[] = [
  {
    id: 'permit-1',
    projectId: 'proj-1',
    workOrderId: 'wo-1',
    jurisdictionName: 'St. John Parish',
    jurisdictionType: 'Parish',
    permitType: 'Building',
    codeSet: 'IBC',
    codeVersion: '2021',
    reviewerAuthority: 'LocalAHJ',
    reviewerContact: 'permitoffice@stjohnparish.gov',
    status: 'InReview',
    submissionDate: '2024-09-10',
    fees: [
      { label: 'Plan review', amount: 250, paid: true },
      { label: 'Permit issuance', amount: 450, paid: false },
    ],
    attachments: ['https://example.com/permits/wallace-submittal.pdf'],
    notes: 'Awaiting OSFM coordination.',
    createdAt: '2024-09-02T12:00:00Z',
    updatedAt: '2024-10-28T09:00:00Z',
  },
  {
    id: 'permit-2',
    projectId: 'proj-4',
    jurisdictionName: 'City of Baton Rouge',
    jurisdictionType: 'City',
    permitType: 'Electrical',
    codeSet: 'IBC',
    codeVersion: '2021',
    reviewerAuthority: 'LocalAHJ',
    status: 'Submitted',
    submissionDate: '2024-10-05',
    createdAt: '2024-10-01T15:00:00Z',
    updatedAt: '2024-10-05T09:30:00Z',
  },
];

export const mockPermitInspections: PermitInspection[] = [
  {
    id: 'inspection-1',
    permitId: 'permit-1',
    inspectionType: 'Rough',
    scheduledAt: '2024-11-30T09:00:00Z',
    result: 'Partial',
    inspectorNotes: 'Need additional bracing at north wall.',
    attachments: [],
  },
];

export const mockHistoricArtifacts: HistoricArtifact[] = [
  {
    id: 'artifact-1',
    projectId: 'proj-1',
    workOrderId: 'wo-1',
    artifactType: 'MaterialSpec',
    description: 'Lime plaster mixture per SHPO guidance.',
    evidenceUrls: ['https://example.com/photos/plaster-bags.jpg'],
    reviewerRequired: true,
    reviewStatus: 'Submitted',
    createdAt: '2024-10-12T12:00:00Z',
    updatedAt: '2024-10-12T12:00:00Z',
  },
  {
    id: 'artifact-2',
    projectId: 'proj-1',
    artifactType: 'MethodStatement',
    description: 'Reversible fastening technique for crown molding.',
    evidenceUrls: ['https://example.com/photos/method-notes.pdf'],
    reviewerRequired: true,
    reviewStatus: 'Approved',
    reviewerId: 'user-1',
    reviewerNotes: 'Meets Secretary of Interior standards.',
    createdAt: '2024-10-15T09:00:00Z',
    updatedAt: '2024-10-20T09:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

export function getWorkOrderById(id: string): WorkOrder | undefined {
  return mockWorkOrders.find((wo) => wo.id === id);
}

export function getQuotesByWorkOrderId(workOrderId: string): Quote[] {
  return mockQuotes.filter((q) => q.workOrderId === workOrderId);
}

export function getApprovedQuote(workOrderId: string): Quote | undefined {
  return mockQuotes.find((q) => q.workOrderId === workOrderId && q.status === 'Approved');
}

export function getWorkLogsByWorkOrderId(workOrderId: string): WorkLog[] {
  return mockWorkLogs.filter((log) => log.workOrderId === workOrderId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}

export function getSiteById(id: string): Site | undefined {
  return mockSites.find((s) => s.id === id);
}

export function getCampusById(id: string) {
  return mockCampuses.find((c) => c.id === id);
}

export function getWorkOrdersByProjectId(projectId: string): WorkOrder[] {
  return mockWorkOrders.filter((wo) => wo.projectId === projectId);
}

export function getInvoicesByProjectId(projectId: string): Invoice[] {
  return mockInvoices.filter((inv) => inv.projectId === projectId);
}

export function getInvoiceById(id: string): Invoice | undefined {
  return mockInvoices.find((inv) => inv.id === id);
}

export function getContractById(id: string): Contract | undefined {
  return mockContracts.find((contract) => contract.id === id);
}

export function getContractsByProjectId(projectId: string): Contract[] {
  return mockContracts.filter((contract) => contract.projectId === projectId);
}

export function getMilestonesByContractId(contractId: string): Milestone[] {
  return mockMilestones.filter((milestone) => milestone.contractId === contractId);
}

export function getScheduleOfValuesByContractId(contractId: string): ScheduleOfValuesEntry[] {
  return mockScheduleOfValues.filter((entry) => entry.contractId === contractId);
}

export function getCostLedgerByProjectId(projectId: string): CostLedgerEntry[] {
  return mockCostLedgerEntries.filter((entry) => entry.projectId === projectId);
}

export function getAIRecommendationsByProject(projectId: string): AIContractRecommendation[] {
  return mockAIContractRecommendations.filter((rec) => rec.projectId === projectId);
}

export function getAIPricingSnapshotsByProject(projectId: string): AIPricingSnapshot[] {
  return mockAIPricingSnapshots.filter((snapshot) => snapshot.projectId === projectId);
}

export function getAuditLogByEntity(entityId: string): FinancialAuditEntry[] {
  return mockFinancialAuditLog.filter((entry) => entry.entityId === entityId);
}

export function getPermitsByProject(projectId: string): PermitRecord[] {
  return mockPermitRecords.filter((permit) => permit.projectId === projectId);
}

export function getInspectionsByPermit(permitId: string): PermitInspection[] {
  return mockPermitInspections.filter((inspection) => inspection.permitId === permitId);
}

export function getHistoricArtifactsByProject(projectId: string): HistoricArtifact[] {
  return mockHistoricArtifacts.filter((artifact) => artifact.projectId === projectId);
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getVendorById(id: string): Vendor | undefined {
  return mockVendors.find((v) => v.id === id);
}

export function getPrimeVendor(): Vendor | undefined {
  return mockVendors.find((v) => v.isPrime);
}

export function getLeads(): Lead[] {
  return mockLeads;
}

export function getLeadById(id: string): Lead | undefined {
  return mockLeads.find((lead) => lead.id === id);
}

export function getLeadsByProjectId(projectId: string): Lead[] {
  return mockLeads.filter((lead) => lead.projectId === projectId);
}

export function getContacts(): Contact[] {
  return mockContacts;
}

export function getContactById(id: string): Contact | undefined {
  return mockContacts.find((contact) => contact.id === id);
}

export function getContactsByProjectId(projectId: string): Contact[] {
  return mockContacts.filter((contact) => contact.projectIds.includes(projectId));
}

export function getContactsByLeadId(leadId: string): Contact[] {
  return mockContacts.filter((contact) => contact.leadIds.includes(leadId));
}

export function generateProjectShareToken(projectId: string): string {
  const token = `share-${projectId}-${Math.random().toString(36).slice(2, 8)}`;
  const project = getProjectById(projectId);
  if (project) {
    project.shareToken = token;
  }
  return token;
}

// ─────────────────────────────────────────────────────────────
// Pipeline Enforcement Helpers
// ─────────────────────────────────────────────────────────────

export function canSchedule(workOrderId: string): { allowed: boolean; reason?: string } {
  const wo = getWorkOrderById(workOrderId);
  if (!wo) return { allowed: false, reason: 'Work order not found' };

  const approvedQuote = getApprovedQuote(workOrderId);
  if (!approvedQuote) {
    return { allowed: false, reason: 'Cannot schedule without an approved quote' };
  }

  if (['Completed', 'Invoiced', 'Paid', 'Closed'].includes(wo.status)) {
    return { allowed: false, reason: 'Work order is already completed or closed' };
  }

  return { allowed: true };
}

export function canMarkComplete(workOrderId: string): { allowed: boolean; reason?: string } {
  const wo = getWorkOrderById(workOrderId);
  if (!wo) return { allowed: false, reason: 'Work order not found' };

  if (!wo.targetStartDate || !wo.targetEndDate) {
    return { allowed: false, reason: 'Work must be scheduled before completion' };
  }

  if (!wo.completionChecklistDone) {
    return { allowed: false, reason: 'Completion checklist must be completed' };
  }

  if (wo.completionPhotoUrls.length === 0) {
    return { allowed: false, reason: 'At least one completion photo is required' };
  }

  const site = getSiteById(wo.siteId);
  if (site?.isHistoric) {
    if (!wo.historicCompliance || !wo.historicCompliance.materialsUsed || !wo.historicCompliance.methodsApplied) {
      return { allowed: false, reason: 'Historic compliance documentation is required for this site' };
    }
  }

  return { allowed: true };
}

export function canGenerateInvoice(workOrderId: string): { allowed: boolean; reason?: string } {
  const wo = getWorkOrderById(workOrderId);
  if (!wo) return { allowed: false, reason: 'Work order not found' };

  if (wo.status !== 'Completed') {
    return { allowed: false, reason: 'Work order must be completed before invoicing' };
  }

  const approvedQuote = getApprovedQuote(workOrderId);
  if (!approvedQuote) {
    return { allowed: false, reason: 'No approved quote found for this work order' };
  }

  const existingInvoice = mockInvoices.find((inv) => inv.workOrderIds.includes(workOrderId));
  if (existingInvoice) {
    return { allowed: false, reason: 'Invoice already exists for this work order' };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// Computed Metrics
// ─────────────────────────────────────────────────────────────

export function getDashboardMetrics() {
  const approvedStatuses: WorkOrderStatus[] = ['Approved', 'Scheduled', 'InProgress'];
  const activeWorkOrders = mockWorkOrders.filter((wo) => approvedStatuses.includes(wo.status));
  const activeValue = activeWorkOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);

  const invoicedThisMonth = mockInvoices.filter((inv) => {
    const submitted = inv.submittedAt ? new Date(inv.submittedAt) : null;
    const now = new Date();
    return submitted && submitted.getMonth() === now.getMonth() && submitted.getFullYear() === now.getFullYear();
  });
  const invoicedValue = invoicedThisMonth.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const completedCount = mockWorkOrders.filter((wo) => wo.status === 'Completed').length;
  const inProgressCount = mockWorkOrders.filter((wo) => wo.status === 'InProgress').length;
  const awaitingApprovalCount = mockWorkOrders.filter((wo) => wo.status === 'AwaitingApproval').length;
  const blockedCount = mockWorkOrders.filter((wo) => wo.status === 'Blocked').length;

  return {
    activeValue,
    invoicedValue,
    completedCount,
    inProgressCount,
    awaitingApprovalCount,
    blockedCount,
    totalWorkOrders: mockWorkOrders.length,
  };
}

export function getProjectMetrics(projectId: string) {
  const workOrders = getWorkOrdersByProjectId(projectId);
  const total = workOrders.length;
  const completed = workOrders.filter((wo) => wo.status === 'Completed').length;
  const inProgress = workOrders.filter((wo) => ['InProgress', 'Scheduled'].includes(wo.status)).length;
  const delayed = workOrders.filter((wo) => wo.status === 'Blocked').length;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalBudget = workOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);
  const spentBudget = workOrders
    .filter((wo) => ['Completed', 'Invoiced', 'Paid'].includes(wo.status))
    .reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);

  return {
    total,
    completed,
    inProgress,
    delayed,
    ongoing: total - completed - delayed,
    percentComplete,
    totalBudget,
    spentBudget,
  };
}
