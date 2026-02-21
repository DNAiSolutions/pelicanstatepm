-- ============================================================================
-- PELICAN STATE PM DASHBOARD - SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- CAMPUSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  funding_source TEXT NOT NULL,
  address TEXT,
  is_historic BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('Critical','High','Medium','Low')) DEFAULT 'Medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- SITES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_historic BOOLEAN DEFAULT FALSE,
  historic_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_property ON sites(property_id);

-- ============================================================================
-- USERS TABLE (extends Supabase auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Owner', 'Developer', 'User')),
  full_name TEXT,
  property_assigned UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_property FOREIGN KEY (property_assigned) REFERENCES properties(id) ON DELETE SET NULL
);

-- ============================================================================
-- WORK REQUESTS TABLE
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
  description TEXT NOT NULL,
  scope_of_work TEXT,
  inspection_notes TEXT,
  priority TEXT CHECK (priority IN ('Critical','High','Medium','Low')) DEFAULT 'Medium',
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
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  intake_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_work_requests_property ON work_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_work_requests_status ON work_requests(status);
CREATE INDEX IF NOT EXISTS idx_work_requests_created_by ON work_requests(created_by);

-- ============================================================================
-- ESTIMATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID NOT NULL UNIQUE REFERENCES work_requests(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(12, 2) NOT NULL,
  not_to_exceed DECIMAL(12, 2),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Changes Requested')),
  client_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_snapshot JSONB,
  client_message TEXT,
  contract_text TEXT,
  payment_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_estimates_work_request ON estimates(work_request_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);

-- ============================================================================
-- USER PROFILES TABLE (Onboarding + Access Control)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role_title TEXT,
  department TEXT,
  team_size TEXT,
  requested_access TEXT NOT NULL CHECK (requested_access IN ('vendor','staff')),
  access_granted TEXT NOT NULL CHECK (access_granted IN ('vendor','staff')) DEFAULT 'vendor',
  status TEXT NOT NULL CHECK (status IN ('pending','approved','denied')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all profiles" ON user_profiles
  FOR ALL USING (lower(coalesce(auth.jwt()->>'email','')) = ANY('{support@dnai.solutions}'))
  WITH CHECK (lower(coalesce(auth.jwt()->>'email','')) = ANY('{support@dnai.solutions}'));

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  work_request_ids UUID[] NOT NULL DEFAULT '{}',
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  funding_source TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoices_property ON invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_submitted_at ON invoices(submitted_at);

-- ============================================================================
-- HISTORIC DOCUMENTATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS historic_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID NOT NULL UNIQUE REFERENCES work_requests(id) ON DELETE CASCADE,
  photos JSONB NOT NULL DEFAULT '[]',
  materials_log JSONB NOT NULL DEFAULT '[]',
  method_notes TEXT,
  architect_guidance TEXT,
  compliance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historic_docs_work_request ON historic_docs(work_request_id);

-- ============================================================================
-- SCHEDULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID NOT NULL UNIQUE REFERENCES work_requests(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  milestones JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_work_request ON schedules(work_request_id);
CREATE INDEX IF NOT EXISTS idx_schedules_dates ON schedules(start_date, end_date);

-- ============================================================================
-- WEEKLY UPDATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_request_id UUID NOT NULL REFERENCES work_requests(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  progress TEXT NOT NULL,
  blockers TEXT,
  next_steps TEXT NOT NULL,
  client_needs TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_updates_work_request ON weekly_updates(work_request_id);
CREATE INDEX IF NOT EXISTS idx_weekly_updates_week ON weekly_updates(week_of);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE historic_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_updates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CAMPUSES - Anyone can read
-- ============================================================================
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update properties" ON properties
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- SITES - Child locations under properties
-- ============================================================================
CREATE POLICY "Sites are viewable by everyone" ON sites
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sites" ON sites
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- USERS - Users can view their own profile and all users in their properties
-- ============================================================================
CREATE POLICY "Users can view themselves" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view all users (for assignments)" ON users
  FOR SELECT USING (true);

-- ============================================================================
-- WORK REQUESTS - Role-based access
-- ============================================================================
CREATE POLICY "Owner and Developer see all work requests" ON work_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

CREATE POLICY "Users see work requests for their property" ON work_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        role IN ('Owner', 'Developer')
        OR property_id = ANY(property_assigned)
      )
    )
  );

CREATE POLICY "Only authenticated users can create work requests" ON work_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only Owner/Developer can update work requests" ON work_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

-- ============================================================================
-- ESTIMATES - Role-based access
-- ============================================================================
CREATE POLICY "Owner and Developer see all estimates" ON estimates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

CREATE POLICY "Users see estimates for their property work requests" ON estimates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_requests wr
      JOIN users u ON u.id = auth.uid()
      WHERE wr.id = estimates.work_request_id
      AND (
        u.role IN ('Owner', 'Developer')
        OR wr.property_id = ANY(u.property_assigned)
      )
    )
  );

CREATE POLICY "Only Owner/Developer can update estimates" ON estimates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

-- ============================================================================
-- INVOICES - Role-based access
-- ============================================================================
CREATE POLICY "Owner and Developer see all invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

CREATE POLICY "Users see invoices for their property" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        role IN ('Owner', 'Developer')
        OR property_id = ANY(property_assigned)
      )
    )
  );

CREATE POLICY "Only Owner/Developer can update invoices" ON invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

-- ============================================================================
-- HISTORIC DOCS - Property-based access
-- ============================================================================
CREATE POLICY "Owner and Developer see all historic docs" ON historic_docs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

CREATE POLICY "Users see historic docs for their property" ON historic_docs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_requests wr
      JOIN users u ON u.id = auth.uid()
      WHERE wr.id = historic_docs.work_request_id
      AND (
        u.role IN ('Owner', 'Developer')
        OR wr.property_id = ANY(u.property_assigned)
      )
    )
  );

-- ============================================================================
-- SCHEDULES - Property-based access
-- ============================================================================
CREATE POLICY "Owner and Developer see all schedules" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

CREATE POLICY "Users see schedules for their property" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_requests wr
      JOIN users u ON u.id = auth.uid()
      WHERE wr.id = schedules.work_request_id
      AND (
        u.role IN ('Owner', 'Developer')
        OR wr.property_id = ANY(u.property_assigned)
      )
    )
  );

-- ============================================================================
-- WEEKLY UPDATES - Property-based access
-- ============================================================================
CREATE POLICY "Owner and Developer see all updates" ON weekly_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

CREATE POLICY "Users see updates for their property" ON weekly_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_requests wr
      JOIN users u ON u.id = auth.uid()
      WHERE wr.id = weekly_updates.work_request_id
      AND (
        u.role IN ('Owner', 'Developer')
        OR wr.property_id = ANY(u.property_assigned)
      )
    )
  );

CREATE POLICY "Only Owner/Developer can create updates" ON weekly_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Developer')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate work request numbers
CREATE OR REPLACE FUNCTION generate_work_request_number()
RETURNS TEXT AS $$
DECLARE
  current_year INT;
  next_number INT;
  new_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Get the next number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number, LENGTH(current_year::TEXT) + 2) AS INT)), 0) + 1
  INTO next_number
  FROM work_requests
  WHERE request_number LIKE 'WR-' || current_year::TEXT || '-%';
  
  new_number := 'WR-' || current_year::TEXT || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INT;
  next_number INT;
  new_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Get the next number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, LENGTH(current_year::TEXT) + 2) AS INT)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || current_year::TEXT || '-%';
  
  new_number := 'INV-' || current_year::TEXT || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTO-UPDATED COLUMNS
-- ============================================================================

-- Update updated_at on work_requests
CREATE OR REPLACE FUNCTION update_work_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_requests_timestamp
BEFORE UPDATE ON work_requests
FOR EACH ROW
EXECUTE FUNCTION update_work_request_timestamp();

-- Update updated_at on estimates
CREATE OR REPLACE FUNCTION update_estimate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at on historic_docs
CREATE OR REPLACE FUNCTION update_historic_doc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_historic_docs_timestamp
BEFORE UPDATE ON historic_docs
FOR EACH ROW
EXECUTE FUNCTION update_historic_doc_timestamp();

-- Update updated_at on schedules
CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedules_timestamp
BEFORE UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_schedule_timestamp();
