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

export interface WorkRequest {
  id: string;
  request_number: string;
  campus_id: string;
  property: string;
  is_historic: boolean;
  category: WorkCategory;
  description: string;
  status: WorkRequestStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_cost?: number;
  approved_by?: string;
  approved_at?: string;
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
