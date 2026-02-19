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
export type CampusType = 'Wallace' | 'Woodland' | 'Paris';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type RateType = 'Manual Labor' | 'Project Management' | 'Construction Supervision';

export interface Campus {
  id: string;
  name: CampusType;
  address: string;
  funding_source: string;
  is_historic: boolean;
  priority: Priority;
}

export interface RetainerRate {
  id: string;
  rate_type: RateType;
  hourly_rate: number;
  description: string;
  notes?: string;
}

export interface WorkRequest {
  id: string;
  request_number: string;
  campus_id: string;
  property: string;
  is_historic: boolean;
  category: WorkCategory;
  description: string;
  status: WorkRequestStatus;
  priority: Priority;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_cost?: number;
  approved_by?: string;
  approved_at?: string;
  scope_of_work?: string;
  inspection_notes?: string;
  historic_documentation?: HistoricDocumentation;
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

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Estimate {
  id: string;
  work_request_id: string;
  line_items: EstimateLineItem[];
  total_amount: number;
  not_to_exceed: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Changes Requested';
  created_at: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
}

export interface InvoiceLineItem {
  id?: string;
  work_request_id: string;
  description: string;
  location?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  work_performed_notes?: string;
}

export interface Invoice {
  id?: string;
  invoice_number?: string;
  work_request_ids: string[];
  contract_id?: string;
  billing_reference_id?: string;
  campus_id: string;
  funding_source: string;
  line_items: InvoiceLineItem[];
  total_amount: number;
  retainage_withheld?: number;
  retainage_released?: number;
  gross_margin_snapshot?: number;
  stripe_payment_intent_id?: string;
  quickbooks_invoice_id?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  submission_date?: string;
  approved_date?: string;
  paid_date?: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
}

export interface SiteWalkthrough {
  id: string;
  campus_id: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'Scheduled' | 'In Progress' | 'Complete';
  findings: SiteFinding[];
  priority_list?: string[];
  notes?: string;
}

export interface SiteFinding {
  id: string;
  category: 'Safety' | 'Maintenance' | 'Inspection' | 'Historic';
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  estimated_cost?: number;
  recommended_action?: string;
}

export interface WorkUpdate {
  id: string;
  work_request_id: string;
  update_type: 'Status' | 'Schedule Change' | 'Delay' | 'Completion' | 'Note';
  message: string;
  created_by: string;
  created_at: string;
  affects_timeline?: boolean;
  new_completion_date?: string;
}

export interface StatusCard {
  title: string;
  count: number;
  trend: string;
  color: 'green' | 'blue' | 'amber' | 'red';
}

export interface ProjectHistoryItem {
  name: string;
  role: string;
  location: string;
  project: string;
  avatar: string;
}

export type ContractType = 'Fixed' | 'T&M' | 'CostPlus' | 'Retainer';
export type BillingMethod = 'Milestone' | 'Progress' | 'Simple';
export type ContractStatus = 'Draft' | 'Active' | 'Closed';
export type MilestoneStatus = 'Pending' | 'ReadyToBill' | 'Invoiced' | 'Paid';

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

export type CostLedgerCategory = 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Permit' | 'Contingency';

export interface CostLedgerEntry {
  id: string;
  project_id: string;
  contract_id: string;
  category: CostLedgerCategory;
  description: string;
  committed_amount?: number;
  actual_amount?: number;
  vendor_id?: string;
  invoice_reference?: string;
  recorded_by: string;
  recorded_at: string;
}

export interface AIContractRecommendation {
  id: string;
  project_id: string;
  suggested_contract: ContractType;
  suggested_billing: BillingMethod;
  rationale: string;
  risk_score: number;
  confidence_score: number;
  ai_input_snapshot: Record<string, unknown>;
  ai_output_snapshot: Record<string, unknown>;
  created_at: string;
  created_by: string;
  human_override?: boolean;
  override_reason?: string;
}

export interface AIPricingSnapshot {
  id: string;
  project_id: string;
  contract_id?: string;
  direct_cost: number;
  overhead_allocated: number;
  contingency: number;
  gross_profit: number;
  projected_margin: number;
  risk_score: number;
  suggested_contract_type: ContractType;
  pricing_version: string;
  labor_rate_snapshot: Record<string, unknown>;
  overhead_rate_snapshot: Record<string, unknown>;
  contingency_notes?: string;
  created_at: string;
  created_by: string;
}
