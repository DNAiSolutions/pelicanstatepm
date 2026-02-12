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

export type WorkCategory = 'Small Task' | 'Event Support' | 'Construction Project';
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
  campus_id: string;
  funding_source: string;
  line_items: InvoiceLineItem[];
  total_amount: number;
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
