export type WorkRequestStatus = 
  | 'Intake' 
  | 'Scoping' 
  | 'Estimate' 
  | 'Approval' 
  | 'Schedule' 
  | 'Progress' 
  | 'Complete' 
  | 'Invoice' 
  | 'Paid';

export type WorkCategory =
  | 'Emergency Response'
  | 'Preventative Maintenance'
  | 'Capital Improvement'
  | 'Tenant Improvement'
  | 'Event Support'
  | 'Grounds & Landscape'
  | 'Historic Conservation'
  | 'Small Works';

export type PropertyName = string;
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type RateType = 'Manual Labor' | 'Project Management' | 'Construction Supervision';

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
export type QuoteStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Superseded';
export type InvoiceStatus = 'Draft' | 'Submitted' | 'Approved' | 'ReadyForPayment' | 'Paid' | 'Rejected';
export type ContractType = 'Fixed' | 'T&M' | 'CostPlus' | 'Retainer';
export type BillingMethod = 'Milestone' | 'Progress' | 'Simple';
export type ContractStatus = 'Draft' | 'Active' | 'Closed';
export type MilestoneStatus = 'Pending' | 'ReadyToBill' | 'Invoiced' | 'Paid';

export interface Property {
  id: string;
  name: PropertyName;
  address: string;
  funding_source: string;
  is_historic: boolean;
  priority: Priority;
  notes?: string;
  created_at?: string;
}

export interface Site {
  id: string;
  property_id: string;
  name: string;
  address: string;
  is_historic: boolean;
  historic_notes?: string;
  created_at?: string;
}

export interface ProjectClientVisibility {
  show_budget: boolean;
  show_timeline: boolean;
  show_invoices: boolean;
  show_contacts: boolean;
}

export interface WalkthroughStep {
  title: string;
  instructions: string;
  trades: string[];
  materials: string[];
  duration_hours?: number;
}

export interface WalkthroughPlan {
  steps: WalkthroughStep[];
  supply_list: { item: string; quantity?: string; responsible?: string; notes?: string }[];
  labor_stack: { role: string; hours: number; rate?: number }[];
  checklist: string[];
}

export interface Project {
  id: string;
  name: string;
  site_id: string;
  property_id?: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_logo?: string;
  internal_owner_id: string;
  prime_vendor_id?: string;
  status: ProjectStatus;
  client_summary?: string;
  internal_notes?: string;
  client_visibility: ProjectClientVisibility;
  share_token?: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  spent_budget: number;
  walkthrough_notes?: string;
  walkthrough_plan?: WalkthroughPlan;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  type: ContactType;
  email: string;
  phone: string;
  property_id?: string;
  project_ids: string[];
  lead_ids: string[];
  preferred_channel?: 'Email' | 'Phone' | 'Text';
  notes?: string;
  client_portal_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalkthroughPrepBrief {
  project_type: string;
  summary: string;
  key_questions: string[];
  recommended_trades: string[];
  supplies: { item: string; quantity?: string; notes?: string }[];
}

export interface LeadIntakeMetadata {
  template_id?: string;
  template_name?: string;
  plan_questions?: string[];
  material_summary?: string;
  labor_summary?: string;
  submitted_by?: string;
  issue_summary?: string;
  job_address?: string;
  urgency?: Priority;
  access_notes?: string;
  attachments?: string[];
  intake_channel?: IntakeChannel;
  recorded_by_id?: string;
  recommended_next_step?: LeadNextStep;
  decision_confidence?: number;
  decision_notes?: string;
  walkthrough_needed?: boolean;
  next_step_status?: 'Pending' | 'InProgress' | 'Completed';
  preferred_channel?: 'Email' | 'Phone' | 'Text';
  call_source?: string;
  handled_by?: string;
  project_type?: string;
  submission_source?: 'Web' | 'Internal';
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  stage: LeadStage;
  source: LeadSource;
  estimated_value: number;
  next_step?: string;
  notes?: string;
  property_id?: string;
  project_id?: string;
  contact_ids: string[];
  created_at: string;
  updated_at: string;
  intake_metadata?: LeadIntakeMetadata;
  intake_channel?: IntakeChannel;
  recommended_next_step?: LeadNextStep;
  decision_confidence?: number;
  decision_notes?: string;
  job_address?: string;
  urgency?: Priority;
  access_notes?: string;
  attachments?: string[];
  follow_up_status?: 'Pending' | 'InProgress' | 'Completed';
  preferred_channel?: 'Email' | 'Phone' | 'Text';
  call_source?: string;
  handled_by?: string;
  walkthrough_scheduled?: boolean;
  walkthrough_date?: string;
  walkthrough_event_id?: string;
  walkthrough_notes?: string;
  project_type?: string;
  walkthrough_prep_brief?: WalkthroughPrepBrief;
  walkthrough_session_ids?: string[];
  walkthrough_plan?: WalkthroughPlan;
}

export interface WorkRequest {
  id: string;
  request_number: string;
  title?: string;
  property_id: string;
  property: string;
  is_historic: boolean;
  category: WorkCategory;
  description: string;
  status: WorkRequestStatus;
  priority: Priority;
  created_by: string;
  client_contact_id?: string;
  submitted_via?: 'Internal' | 'ClientPortal' | 'WebForm';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_cost?: number;
  approved_by?: string;
  approved_at?: string;
  scope_of_work?: string;
  inspection_notes?: string;
  historic_documentation?: HistoricDocumentation;
  intake_payload?: Record<string, unknown>;
}

export interface HistoricDocumentation {
  id: string;
  work_request_id: string;
  materials_used: string;
  methods_applied: string;
  architect_guidance: string;
  compliance_notes: string;
  photo_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id?: string;
  work_order_id: string;
  description: string;
  location?: string;
  quantity: number;
  unit?: string;
  rate: number;
  amount: number;
  work_performed_notes?: string;
}

export interface Invoice {
  id?: string;
  invoice_number?: string;
  project_id?: string;
  contract_id?: string;
  work_order_ids: string[];
  billing_reference_id?: string;
  property_id: string;
  funding_code: string;
  prime_vendor_id?: string;
  line_items: InvoiceLineItem[];
  total_amount: number;
  retainage_withheld?: number;
  retainage_released?: number;
  gross_margin_snapshot?: number;
  stripe_payment_intent_id?: string;
  quickbooks_invoice_id?: string;
  status: InvoiceStatus;
  submitted_at?: string;
  approved_at?: string;
  approved_by_id?: string;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_at?: string;
}

export interface Contract {
  id: string;
  project_id: string;
  contract_type: ContractType;
  billing_method: BillingMethod;
  contract_value?: number;
  fee_percentage?: number;
  retainer_amount?: number;
  retainage_percentage?: number;
  start_date: string;
  end_date?: string;
  status: ContractStatus;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Milestone {
  id: string;
  contract_id: string;
  name: string;
  description?: string;
  scheduled_date?: string;
  amount: number;
  status: MilestoneStatus;
  ready_to_bill_at?: string;
  invoiced_invoice_id?: string;
  paid_at?: string;
  created_at?: string;
}

export interface ScheduleOfValuesEntry {
  id: string;
  contract_id: string;
  line_item: string;
  budget_amount: number;
  percent_complete: number;
  amount_earned: number;
  last_updated: string;
}

export interface CostLedgerEntry {
  id: string;
  project_id: string;
  contract_id?: string;
  category: 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Permit' | 'Contingency';
  description: string;
  committed_amount?: number;
  actual_amount?: number;
  vendor_id?: string;
  invoice_reference?: string;
  recorded_by: string;
  recorded_at: string;
}

export interface PermitRecord {
  id: string;
  project_id: string;
  work_order_id?: string;
  jurisdiction_name: string;
  jurisdiction_type: string;
  permit_type: string;
  code_set?: string;
  code_version?: string;
  reviewer_authority: string;
  reviewer_contact?: string;
  status: string;
  submission_date?: string;
  approval_date?: string;
  expiration_date?: string;
  fees?: number;
  attachments: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricArtifact {
  id: string;
  project_id: string;
  work_order_id?: string;
  artifact_type: string;
  description: string;
  evidence_urls: string[];
  reviewer_required: boolean;
  review_status: string;
  reviewer_id?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
}

export type HistoricArtifactType =
  | 'Photo'
  | 'Document'
  | 'Drawing'
  | 'Report'
  | 'Survey'
  | 'Permit'
  | 'Other';

export type HistoricReviewStatus = 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected';

export interface SiteFinding {
  id: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  location?: string;
  photo_urls?: string[];
  resolved?: boolean;
}

export interface SiteWalkthrough {
  id: string;
  property_id: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'Scheduled' | 'InProgress' | 'In Progress' | 'Complete';
  findings: SiteFinding[];
  priority_list: string[];
  notes?: string;
}

export interface EstimateLineItem {
  id?: string;
  description: string;
  category?: string;
  quantity: number;
  unit?: string;
  unit_cost?: number;
  unitPrice?: number;
  total?: number;
  amount?: number;
  notes?: string;
}

export interface Estimate {
  id: string;
  work_request_id: string;
  created_by?: string;
  line_items: EstimateLineItem[];
  subtotal?: number;
  markup_percentage?: number;
  total?: number;
  total_amount?: number;
  not_to_exceed?: number;
  notes?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  created_at?: string;
  updated_at?: string;
}

export interface RetainerRate {
  id: string;
  rate_type: RateType;
  hourly_rate: number;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkUpdate {
  id: string;
  work_request_id: string;
  update_type: 'Status' | 'Schedule Change' | 'Delay' | 'Completion' | 'Note';
  note?: string;
  message?: string;
  affects_timeline?: boolean;
  new_completion_date?: string;
  created_by: string;
  created_at: string;
}

export interface AIPricingSnapshot {
  labor_cost: number;
  material_cost: number;
  overhead_cost: number;
  profit_margin: number;
  total_estimate: number;
  confidence: number;
  notes?: string;
}

export interface StatusCard {
  title: string;
  count: number;
  trend?: string;
  color?: string;
}

export interface ProjectHistoryItem {
  name: string;
  role?: string;
  location?: string;
  project?: string;
  avatar?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'staff' | 'client' | 'vendor';
  access_type: 'staff' | 'client' | 'vendor';
  company?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
