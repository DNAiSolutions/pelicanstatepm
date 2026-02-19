-- ============================================================================
-- PELICAN STATE PM DASHBOARD - ENHANCED SCHEMA v2
-- Includes: Historic Documentation, Site Walkthroughs, Work Updates, Retainer Rates
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- CAMPUSES TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  funding_source TEXT NOT NULL,
  is_historic BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO campuses (name, address, funding_source, is_historic, priority) VALUES
  ('Wallace', 'Wallace, Louisiana', 'State Budget A', true, 'Critical'),
  ('Woodland', 'Laplace, Louisiana', 'State Budget B', true, 'High'),
  ('Paris', 'Paris, Louisiana', 'State Budget C', false, 'Low')
ON CONFLICT (name) DO NOTHING;

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
-- WORK REQUESTS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_cost DECIMAL(12, 2),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_work_requests_campus ON work_requests(campus_id);
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
-- SITE FINDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Safety', 'Maintenance', 'Inspection', 'Historic')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  estimated_cost DECIMAL(12, 2),
  recommended_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_site_findings_campus ON site_findings(campus_id);
CREATE INDEX idx_site_findings_severity ON site_findings(severity);

-- ============================================================================
-- SITE WALKTHROUGH TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_walkthroughs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'In Progress', 'Complete')) DEFAULT 'Scheduled',
  findings_id UUID[] DEFAULT '{}' REFERENCES site_findings(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_site_walkthroughs_campus ON site_walkthroughs(campus_id);
CREATE INDEX idx_site_walkthroughs_status ON site_walkthroughs(status);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_estimates_work_request ON estimates(work_request_id);
CREATE INDEX idx_estimates_status ON estimates(status);

-- ============================================================================
-- INVOICES TABLE (Enhanced - Campus-based splitting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  work_request_id UUID NOT NULL REFERENCES work_requests(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  funding_source TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Paid')),
  payment_method TEXT,
  submission_frequency TEXT CHECK (submission_frequency IN ('Weekly', 'Biweekly', 'Monthly')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_invoices_work_request ON invoices(work_request_id);

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
CREATE INDEX idx_invoices_campus ON invoices(campus_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_submitted ON invoices(submitted_at DESC);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Work Requests: Users can see work requests from their assigned campuses
ALTER TABLE work_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work requests from their campuses"
ON work_requests FOR SELECT
USING (
  campus_id IN (SELECT unnest(campus_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);

-- Historic Documentation: Same campus access as work requests
ALTER TABLE historic_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view historic docs from their campuses"
ON historic_documentation FOR SELECT
USING (
  work_request_id IN (
    SELECT id FROM work_requests 
    WHERE campus_id IN (SELECT unnest(campus_assigned) FROM auth.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
  )
);

-- Invoices: Campus-based access
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices from their campuses"
ON invoices FOR SELECT
USING (
  campus_id IN (SELECT unnest(campus_assigned) FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role IN ('Owner', 'Developer'))
);
