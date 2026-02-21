-- ============================================================================
-- PELICAN STATE PM DASHBOARD - ENHANCED SCHEMA v2
-- Includes: Historic Documentation, Site Walkthroughs, Work Updates, Retainer Rates
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- CAMPUSES TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  funding_source TEXT NOT NULL,
  is_historic BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties readable by anyone" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update properties" ON properties
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- RETAINER RATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS retainer_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_type TEXT NOT NULL CHECK (rate_type IN ('Manual Labor', 'Project Management', 'Construction Supervision')),
  hourly_rate DECIMAL(10, 2) NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default rates
INSERT INTO retainer_rates (rate_type, hourly_rate, description) VALUES
  ('Manual Labor', 45.00, 'General inspection and manual labor'),
  ('Project Management', 75.00, 'Construction project management and supervision'),
  ('Construction Supervision', 85.00, 'Full construction site supervision')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CLIENT ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL UNIQUE,
  primary_contact TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_historic BOOLEAN DEFAULT FALSE,
  historic_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sites_property ON sites(property_id);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sites readable by anyone" ON sites
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sites" ON sites
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_logo TEXT,
  internal_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prime_vendor_id UUID,
  status TEXT NOT NULL CHECK (status IN ('Planning', 'PreConstruction', 'Active', 'Closeout', 'OnHold', 'Completed')) DEFAULT 'Planning',
  client_summary TEXT,
  internal_notes TEXT,
  client_visibility JSONB NOT NULL DEFAULT '{"showBudget":true,"showTimeline":true,"showInvoices":true,"showContacts":true}',
  share_token TEXT UNIQUE,
  start_date DATE,
  end_date DATE,
  total_budget DECIMAL(14, 2),
  spent_budget DECIMAL(14, 2),
  walkthrough_notes TEXT,
  walkthrough_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_property ON projects(property_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================================================
-- CONTACTS TABLE + RELATIONSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  type TEXT NOT NULL CHECK (type IN ('Client', 'Internal', 'Vendor', 'Partner')),
  email TEXT,
  phone TEXT,
  phone_normalized TEXT GENERATED ALWAYS AS (regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')) STORED,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  preferred_channel TEXT CHECK (preferred_channel IN ('Email', 'Phone', 'Text')),
  notes TEXT,
  client_portal_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_property ON contacts(property_id);

CREATE TABLE IF NOT EXISTS contact_projects (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT,
  PRIMARY KEY (contact_id, project_id)
);

-- ============================================================================
-- LEADS + INTAKE TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('New', 'Walkthrough', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')) DEFAULT 'New',
  source TEXT CHECK (source IN ('Referral', 'Inbound', 'Event', 'Cold Outreach', 'Returning Client', 'Client Portal')),
  estimated_value DECIMAL(14, 2),
  next_step TEXT,
  notes TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  intake_channel TEXT CHECK (intake_channel IN ('Phone', 'ClientPortal', 'WebForm', 'Internal', 'Email')),
  recommended_next_step TEXT CHECK (recommended_next_step IN ('ScheduleWalkthrough', 'NurtureSequence', 'DispatchCrew', 'EstimateOnly', 'SendAiEstimate')),
  decision_confidence DECIMAL(5, 2),
  decision_notes TEXT,
  job_address TEXT,
  urgency TEXT CHECK (urgency IN ('Critical', 'High', 'Medium', 'Low')),
  access_notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  follow_up_status TEXT CHECK (follow_up_status IN ('Pending', 'InProgress', 'Completed')),
  preferred_channel TEXT CHECK (preferred_channel IN ('Email', 'Phone', 'Text')),
  call_source TEXT,
  handled_by TEXT,
  project_type TEXT,
  walkthrough_scheduled BOOLEAN DEFAULT FALSE,
  walkthrough_date TIMESTAMP WITH TIME ZONE,
  walkthrough_event_id TEXT,
  walkthrough_notes TEXT,
  walkthrough_prep_brief JSONB,
  walkthrough_plan JSONB,
  walkthrough_session_ids TEXT[] DEFAULT '{}',
  intake_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_property ON leads(property_id);
CREATE INDEX idx_leads_stage ON leads(stage);

CREATE TABLE IF NOT EXISTS lead_intake_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  form_snapshot JSONB NOT NULL,
  decision JSONB
);

CREATE INDEX idx_lead_intake_records_lead ON lead_intake_records(lead_id);

CREATE TABLE IF NOT EXISTS contact_leads (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, lead_id)
);

-- ============================================================================
-- WORK REQUESTS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  title TEXT,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  property TEXT NOT NULL,
  is_historic BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL CHECK (
    category IN (
      'Emergency Response',
      'Preventative Maintenance',
      'Capital Improvement',
      'Tenant Improvement',
      'Event Support',
      'Grounds & Landscape',
      'Historic Conservation',
      'Small Works'
    )
  ),
  priority TEXT CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  description TEXT NOT NULL,
  scope_of_work TEXT,
  inspection_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Intake' CHECK (
    status IN ('Intake', 'Scoping', 'Estimate', 'Approval', 'Schedule', 'Progress', 'Complete', 'Invoice', 'Paid')
  ),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  client_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  submitted_via TEXT CHECK (submitted_via IN ('Internal','ClientPortal','WebForm')) DEFAULT 'Internal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_cost DECIMAL(12, 2),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  intake_payload JSONB
);

CREATE INDEX idx_work_requests_property ON work_requests(property_id);
CREATE INDEX idx_work_requests_status ON work_requests(status);
CREATE INDEX idx_work_requests_priority ON work_requests(priority);
CREATE INDEX idx_work_requests_created_by ON work_requests(created_by);

-- ============================================================================
-- HISTORIC DOCUMENTATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS historic_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID NOT NULL UNIQUE REFERENCES work_requests(id) ON DELETE CASCADE,
  materials_used TEXT NOT NULL,
  methods_applied TEXT NOT NULL,
  architect_guidance TEXT,
  compliance_notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historic_work_request ON historic_documentation(work_request_id);

-- ============================================================================
-- PERMITS & INSPECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_requests(id) ON DELETE SET NULL,
  jurisdiction_name TEXT NOT NULL,
  jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('Parish', 'City', 'State', 'Federal')),
  permit_type TEXT NOT NULL CHECK (permit_type IN ('Building', 'Electrical', 'Mechanical', 'Plumbing', 'Demolition', 'Signage', 'Other')),
  code_set TEXT CHECK (code_set IN ('IBC', 'IRC', 'IEBC', 'NFPA', 'Other')),
  code_version TEXT,
  reviewer_authority TEXT NOT NULL CHECK (reviewer_authority IN ('LocalAHJ', 'OSFM', 'ThirdParty', 'Client')),
  reviewer_contact TEXT,
  status TEXT NOT NULL CHECK (status IN ('NotRequired','Needed','Drafting','Submitted','InReview','RevisionsRequired','Approved','Issued','Finaled','Closed')) DEFAULT 'Needed',
  submission_date DATE,
  approval_date DATE,
  expiration_date DATE,
  fees JSONB,
  attachments TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_permits_project ON permits(project_id);

CREATE TABLE IF NOT EXISTS permit_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('Rough','Framing','Final','Electrical','Mechanical','Plumbing','Fire','Other')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  result TEXT CHECK (result IN ('Pass','Fail','Partial','Reschedule')),
  inspector_notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_permit_inspections_permit ON permit_inspections(permit_id);

-- ============================================================================
-- HISTORIC ARTIFACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS historic_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_requests(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('MaterialSpec','MethodStatement','ConditionAssessment','ReplacementJustification','ReviewComment')),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  reviewer_required BOOLEAN DEFAULT FALSE,
  review_status TEXT NOT NULL CHECK (review_status IN ('Draft','Submitted','Approved','ChangesRequested')) DEFAULT 'Draft',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historic_artifacts_project ON historic_artifacts(project_id);

-- ============================================================================
-- SITE FINDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Safety', 'Maintenance', 'Inspection', 'Historic')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  estimated_cost DECIMAL(12, 2),
  recommended_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_site_findings_property ON site_findings(property_id);
CREATE INDEX idx_site_findings_severity ON site_findings(severity);

-- ============================================================================
-- SITE WALKTHROUGH TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_walkthroughs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'In Progress', 'Complete')) DEFAULT 'Scheduled',
  findings JSONB NOT NULL DEFAULT '[]',
  priority_list TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_site_walkthroughs_property ON site_walkthroughs(property_id);
CREATE INDEX idx_site_walkthroughs_status ON site_walkthroughs(status);

-- ============================================================================
-- WALKTHROUGH SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS walkthrough_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL,
  project_id TEXT,
  property_id TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'InProgress', 'Complete')) DEFAULT 'Scheduled',
  notes TEXT,
  ai_plan JSONB,
  responses JSONB,
  attachments TEXT[] DEFAULT '{}',
  finalized_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_walkthrough_sessions_lead ON walkthrough_sessions(lead_id);
CREATE INDEX idx_walkthrough_sessions_status ON walkthrough_sessions(status);

-- ============================================================================
-- WORK UPDATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID NOT NULL REFERENCES work_requests(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('Status', 'Schedule Change', 'Delay', 'Completion', 'Note')),
  message TEXT NOT NULL,
  affects_timeline BOOLEAN DEFAULT FALSE,
  new_completion_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_updates_work_request ON work_updates(work_request_id);
CREATE INDEX idx_work_updates_type ON work_updates(update_type);
CREATE INDEX idx_work_updates_created ON work_updates(created_at DESC);

-- ============================================================================
-- ESTIMATES TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID NOT NULL REFERENCES work_requests(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(12, 2) NOT NULL,
  not_to_exceed DECIMAL(12, 2),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Changes Requested')),
  notes TEXT,
  client_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_snapshot JSONB,
  client_message TEXT,
  contract_text TEXT,
  payment_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_estimates_work_request ON estimates(work_request_id);
CREATE INDEX idx_estimates_status ON estimates(status);

-- ============================================================================
-- INVOICES TABLE (Enhanced - Property-based splitting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  work_request_id UUID REFERENCES work_requests(id) ON DELETE SET NULL,
  work_request_ids UUID[] DEFAULT '{}',
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  funding_source TEXT NOT NULL,
  prime_vendor_id UUID,
  billing_reference_id TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(12, 2) NOT NULL,
  retainage_withheld DECIMAL(12, 2),
  retainage_released DECIMAL(12, 2),
  gross_margin_snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Paid')),
  payment_method TEXT,
  payment_reference TEXT,
  submission_frequency TEXT CHECK (submission_frequency IN ('Weekly', 'Biweekly', 'Monthly')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_invoices_work_request ON invoices(work_request_id);
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_contract ON invoices(contract_id);

-- ============================================================================
-- CONTRACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('Fixed', 'T&M', 'CostPlus', 'Retainer')),
  billing_method TEXT NOT NULL CHECK (billing_method IN ('Milestone', 'Progress', 'Simple')),
  contract_value DECIMAL(14, 2),
  fee_percentage DECIMAL(5, 2),
  retainer_amount DECIMAL(14, 2),
  retainage_percentage DECIMAL(5, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Active', 'Closed')) DEFAULT 'Draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- ============================================================================
-- MILESTONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  amount DECIMAL(14, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'ReadyToBill', 'Invoiced', 'Paid')) DEFAULT 'Pending',
  ready_to_bill_at TIMESTAMP WITH TIME ZONE,
  invoiced_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_milestones_contract ON milestones(contract_id);
CREATE INDEX idx_milestones_status ON milestones(status);

-- ============================================================================
-- SCHEDULE OF VALUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedule_of_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  line_item TEXT NOT NULL,
  budget_amount DECIMAL(14, 2) NOT NULL,
  percent_complete DECIMAL(5, 2) DEFAULT 0,
  amount_earned DECIMAL(14, 2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sov_contract ON schedule_of_values(contract_id);

-- ============================================================================
-- COST LEDGER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('Labor', 'Material', 'Subcontractor', 'Equipment', 'Permit', 'Contingency')),
  description TEXT,
  committed_amount DECIMAL(14, 2),
  actual_amount DECIMAL(14, 2),
  vendor_id UUID,
  invoice_reference TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cost_ledger_project ON cost_ledger(project_id);
CREATE INDEX idx_cost_ledger_contract ON cost_ledger(contract_id);

-- ============================================================================
-- USER PROFILES TABLE (Onboarding + Access Control)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role_title TEXT,
  department TEXT,
  team_size TEXT,
  requested_access TEXT NOT NULL CHECK (requested_access IN ('vendor', 'staff')),
  access_granted TEXT NOT NULL CHECK (access_granted IN ('vendor', 'staff')) DEFAULT 'vendor',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_status ON user_profiles(status);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their profile"
ON user_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their profile"
ON user_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their profile"
ON user_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all profiles"
ON user_profiles FOR ALL
USING (lower(coalesce(auth.jwt()->>'email','')) = ANY('{support@dnai.solutions}'))
WITH CHECK (lower(coalesce(auth.jwt()->>'email','')) = ANY('{support@dnai.solutions}'));
CREATE INDEX idx_invoices_property ON invoices(property_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_submitted ON invoices(submitted_at DESC);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view client accounts"
ON client_accounts FOR SELECT
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sites for their properties"
ON sites FOR SELECT
USING (
  property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects for their properties"
ON projects FOR SELECT
USING (
  property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts for their properties"
ON contacts FOR SELECT
USING (
  property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

ALTER TABLE contact_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact-project links"
ON contact_projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = contact_projects.project_id
      AND (
        projects.property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
      )
  )
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads for their properties"
ON leads FOR SELECT
USING (
  property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact-lead links"
ON contact_leads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = contact_leads.lead_id
      AND (
        leads.property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
      )
  )
);

ALTER TABLE lead_intake_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead intake records"
ON lead_intake_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_intake_records.lead_id
      AND (
        leads.property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
      )
  )
);

ALTER TABLE permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permits for their properties"
ON permits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = permits.project_id
      AND (
        projects.property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
      )
  )
);

ALTER TABLE permit_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permit inspections"
ON permit_inspections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = permit_inspections.permit_id
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = permits.project_id
          AND (
            projects.property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
          )
      )
  )
);

ALTER TABLE historic_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view historic artifacts"
ON historic_artifacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = historic_artifacts.project_id
      AND (
        projects.property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
      )
  )
);

-- Work Requests: Users can see work requests from their assigned properties
ALTER TABLE work_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work requests from their properties"
ON work_requests FOR SELECT
USING (
  property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

-- Historic Documentation: Same property access as work requests
ALTER TABLE historic_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view historic docs from their properties"
ON historic_documentation FOR SELECT
USING (
  work_request_id IN (
    SELECT id FROM work_requests 
    WHERE property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
  )
);

-- Invoices: Property-based access
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices from their properties"
ON invoices FOR SELECT
USING (
  property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_of_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts for their properties"
ON contracts FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects
    WHERE property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
      OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
  )
);

CREATE POLICY "Users can view milestones for their properties"
ON milestones FOR SELECT
USING (
  contract_id IN (SELECT id FROM contracts WHERE project_id IN (
    SELECT id FROM projects
    WHERE property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
      OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
  ))
);

CREATE POLICY "Users can view schedule of values"
ON schedule_of_values FOR SELECT
USING (
  contract_id IN (SELECT id FROM contracts WHERE project_id IN (
    SELECT id FROM projects
    WHERE property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
      OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
  ))
);

CREATE POLICY "Users can view cost ledger"
ON cost_ledger FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects
    WHERE property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
      OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
  )
);

-- Site Walkthroughs follow property assignments
ALTER TABLE site_walkthroughs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view site walkthroughs for their properties"
ON site_walkthroughs FOR SELECT
USING (
  property_id IN (SELECT unnest(property_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

-- Walkthrough sessions follow property/lead assignments
ALTER TABLE walkthrough_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view walkthrough sessions"
ON walkthrough_sessions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);
