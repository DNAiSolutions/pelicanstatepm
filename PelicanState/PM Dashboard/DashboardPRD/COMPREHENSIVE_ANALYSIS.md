# PELICAN STATE PM DASHBOARD - COMPREHENSIVE SYSTEM ANALYSIS

**Document Version:** 1.0  
**Date:** February 2024  
**Purpose:** Business Analysis & User Story Development Reference

---

## TABLE OF CONTENTS

1. Current Architecture Overview
2. Core Features Implemented
3. User Roles and Access Control
4. Data Models
5. Key Business Workflows
6. UI/UX Components
7. Integration Points
8. Demo Mode Specifics
9. Missing or Incomplete Features
10. Performance and Technical Considerations

---

## 1. CURRENT ARCHITECTURE OVERVIEW

### 1.1 Technology Stack

**Frontend:**
- **Framework:** React 19.2.0 with TypeScript 5.9.3
- **Build Tool:** Vite 7.2.4
- **Routing:** React Router DOM 7.13.0
- **Styling:** Tailwind CSS 3.4.19
- **UI Icons:** Lucide React 0.563.0
- **State Management:** Zustand 5.0.11
- **PDF Generation:** jsPDF 4.1.0 + html2canvas 1.4.1
- **Charts/Graphs:** Recharts 3.7.0
- **Notifications:** React Hot Toast 2.6.0
- **Linting:** ESLint with TypeScript support

**Backend:**
- **Database & Auth:** Supabase 2.95.3
- **Authentication:** Supabase Auth (with demo mode fallback)

**DevDependencies:**
- Autoprefixer 10.4.24
- PostCSS 8.5.6
- Various @types packages for React and Node

### 1.2 Frontend/Backend Separation

**Frontend Architecture:**
- Pure React SPA (Single Page Application)
- Client-side routing with React Router
- TypeScript for type safety
- Modular component structure

**Backend Approach:**
- **Primary:** Supabase (PostgreSQL + Auth)
- **Fallback:** Mock data in-memory for development/demo
- Services layer abstracts Supabase calls
- Demo mode uses static mock data from `data/pipeline.ts` and `data/mock.ts`

**API Communication:**
- Supabase JavaScript SDK for direct database access
- No custom API layer (direct DB queries from services)
- Real-time updates via Supabase subscriptions (if enabled)

### 1.3 Data Storage Approach

**Supabase Database Tables (Expected):**
- `work_requests` - Main work order intake
- `estimates` - Cost estimates for work
- `invoices` - Billing documentation
- `projects` - Project management
- `project_tasks` - Task assignments within projects
- `work_updates` - Status/progress updates
- `site_walkthroughs` - Site inspection data
- `historic_documentation` - Preservation records
- `contacts` - CRM for people
- `leads` - Sales pipeline
- `campuses` - Multi-location support
- `retainer_rates` - Hourly rate definitions

**Demo/Mock Data Location:**
- `src/data/pipeline.ts` - Comprehensive mock data for projects, work orders, quotes, contacts, leads
- `src/data/mock.ts` - Dashboard metrics and work request samples
- Data is cloned on read to prevent accidental mutations

### 1.4 Authentication System

**Authentication Method:**
- Supabase Auth (email/password based)
- JWT token stored in browser session

**Demo Mode:**
- Hardcoded demo user auto-loads without login
- Email: `demo@pelicanstate.com`
- Role: `Owner`
- Campus Assignments: Wallace, Woodland (Laplace), Paris

**User Roles (Enum):**
```typescript
type UserRole = 'Owner' | 'Developer' | 'User';
```

**Auth Context:**
- Centralized auth state management
- `AuthProvider` wraps entire app
- `useAuth()` hook provides access to:
  - `user` (current authenticated user)
  - `isAuthenticated` (boolean)
  - `signIn()`, `signUp()`, `signOut()` methods
  - `loading` and `error` states

**Protected Routes:**
- `ProtectedRoute` component wraps authenticated routes
- Falls back to login page if not authenticated

### 1.5 Deployment Infrastructure

**Hosting:**
- Vercel (indicated by vercel.json)

**Build Configuration:**
```json
{
  "buildCommand": "tsc -b && vite build",
  "outputDirectory": "dist",
  "env": ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]
}
```

**Environment Variables:**
```
VITE_SUPABASE_URL=https://tsiembsbxocszubdmrdi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uIAAvk1ceyqYqF76lzKaFA_QoArYZfT
VITE_ENV=development (optional)
```

---

## 2. CORE FEATURES IMPLEMENTED

### 2.1 Main Features by Page/Module

#### **Dashboard (`/dashboard`)**
- Real-time metrics overview
- Requests needing approval (3 items shown)
- Active work status (5 items)
- Blocked items tracking (1 item)
- Pending invoices (2 items)
- Featured project timeline progress
- Work order list with status badges
- Status filtering (All, In Progress, Completed)

**Data Models Used:**
- WorkOrder, Project, Campus, StatusCard
- Real-time aggregated metrics

---

#### **Projects Module** (`/projects*`)

**Project Overview Page (`/projects`)**
- Create new projects
- Search and filter by campus
- Expand/collapse client view
- Project summary cards with budget/timeline
- Link leads and contacts to projects
- Auto-generate tasks from templates
- Retainer rate configuration
- Customizable labor rates

**Project Detail Page (`/projects/:projectId`)**
- Multi-tab interface (Overview, Board, List, Plan)
- Overview: Project summary, budget tracking, timeline
- Kanban board for task management (To Do, In Progress, Done)
- Task list view
- Plan view with AI-generated suggestions
- Lead integration (add leads within project)
- Contact management within project
- Share token generation for client access

**Project Task Board (`/projects/board`)**
- Kanban-style board
- Drag-and-drop task management
- Multiple status columns
- Task priority visualization
- Completion tracking

**Project Client View (`/client/projects/:projectId/:token`)**
- Public project portal
- Read-only access for clients
- Configurable visibility options:
  - Budget visibility
  - Timeline visibility
  - Invoice visibility
  - Contacts visibility
- Accessible via share token (no login required)

**Data Models:**
- Project, Contact, Lead, WorkOrder (Tasks), User, Site, Campus
- ProjectClientVisibility configuration
- TaskTemplate for auto-generation

---

#### **Work Requests Module** (`/work-requests*`)

**Work Request Intake Page (`/work-requests/new`)**
- Structured intake form with:
  - Campus selection
  - Property/location identification
  - Historic property indicator
  - Work category (Small Task, Event Support, Construction Project)
  - Priority level (Critical, High, Medium, Low)
  - Detailed description
  - Scope of work
  - Inspection notes
- Multi-step wizard interface
- AI-generated suggestions (materials, labor, cost heuristics)
- Status defaults to "Intake"

**Work Request List Page (`/work-requests`)**
- Sortable/filterable table view
- Status badges with colors
- Priority indicators
- Quick action buttons
- Search functionality
- Filter by:
  - Campus
  - Status
  - Priority
  - Historic/Non-historic
  - Category

**Work Request Detail Page (`/work-requests/:id`)**
- Multi-tab interface:
  - Overview: Full details, timeline progress
  - Timeline: Status history and updates
  - Quotes: Associated estimates
  - Schedule: Appointment/resource booking
  - Completion: Checklist and photo upload
  - Invoice: Link to billing

**Status Workflow States:**
- Intake → Scoping → Estimate → Approval → Schedule → Progress → Complete → Invoice → Paid

**Data Models:**
- WorkRequest, Estimate, Invoice, WorkUpdate, HistoricDocumentation
- Status state machine

---

#### **Estimates Module** (`/estimates*`)

**Estimates List Page (`/estimates`)**
- View all estimates
- Status badges (Draft, Submitted, Approved, Changes Requested)
- Filter by status
- Link to parent work request
- Total amount display

**Estimate Builder Page (`/estimates/new/:id`)**
- Line-item builder
- Labor and material costs
- Quantity × Rate = Amount calculation
- Approval workflow
- Not-to-exceed tracking
- Status transitions:
  - Draft → Submitted → Approved (or Changes Requested)

**New Estimate Page** (`/estimates/new/:id`)
- Quick estimate creation for specific work request
- Pre-populated from work request

**Data Models:**
- Estimate, EstimateLineItem
- Validation for line items and totals

---

#### **Invoices Module** (`/invoices*`)

**Invoice List Page (`/invoices`)**
- View all invoices
- Status badges (Draft, Submitted, Approved, Paid)
- Filter by status and campus
- Pending payment indicators
- Total amount tracking
- Download/print options

**Invoice Builder Page (`/invoices/new`)**
- Multi-campus invoice support
- Select work requests to invoice
- Add line items per campus
- Work-performed notes (REQUIRED field)
- Location tracking
- Quantity and rate inputs
- Automatic amount calculation
- Campus and funding source selection
- Enhanced validation:
  - Funding source required
  - Work performed notes required for each line item
  - Location required for each line item
- PDF export capability

**Data Models:**
- Invoice, InvoiceLineItem
- Campus-based splitting
- Enhanced validation with detailed error messages

---

#### **Leads Management (`/leads`)**
- Sales pipeline tracking
- Lead stages: New, Qualified, Proposal, Negotiation, Won, Lost
- Lead sources: Referral, Inbound, Event, Cold Outreach, Returning Client, Client Portal
- Lead contact information
- Estimated value tracking
- Convert lead to project
- Notes and follow-up tracking
- Contact association

**Data Models:**
- Lead, LeadIntakeMetadata
- Contact linking

---

#### **Contacts Management (`/contacts`)**
- CRM for all contacts
- Contact types: Client, Internal, Vendor, Partner
- Multi-project association
- Preferred communication channel (Email, Phone, Text)
- Campus assignment
- Search and filter
- Quick contact creation

**Data Models:**
- Contact (with projectIds[], leadIds[])

---

#### **Site Walkthroughs (`/walkthroughs`)**
- Campus site inspection tracking
- Scheduled vs. Completed status
- Site findings documentation:
  - Categories: Safety, Maintenance, Inspection, Historic
  - Severity levels: Critical, High, Medium, Low
  - Estimated costs and recommended actions
- Priority list generation
- Notes and follow-up items

**Data Models:**
- SiteWalkthrough, SiteFinding

---

#### **Historic Documentation (`/historic-documentation`)**
- Preservation and compliance tracking
- Materials used documentation
- Methods applied documentation
- Architect guidance tracking
- Compliance notes
- Photo URLs
- Dedicated component: `HistoricDocumentation.tsx`
- Linked to work requests with historic properties

**Data Models:**
- HistoricDocumentation (linked to WorkRequest)

---

#### **Coming Soon Features**
- **Schedules** (`/schedules`) - Calendar/timeline view
- **Analytics** (`/analytics`) - Reporting and insights
- **Members** (`/members`) - Team management and permissions
- **Settings** (`/settings`) - System configuration

### 2.2 Key Services Architecture

**Service Layer Files (14 services):**

1. **supabaseClient.ts** - Database/Auth initialization
   - Supabase client singleton
   - Auth helper methods (signIn, signUp, signOut, getSession, getUser)
   - Auth state change listener

2. **workRequestService.ts** - Work request CRUD
   - Filters: status, campus, category, priority, is_historic
   - Counts by status
   - Priority-based queries
   - Historic work request filtering
   - Approval and blocked item retrieval

3. **projectService.ts** - Project management
   - Project CRUD
   - Lead linking
   - Contact linking
   - Client share token generation

4. **projectTaskService.ts** - Task/work order management
   - Task templates (10 types: default, historicRestoration, eventSetup, etc.)
   - Template library with questions, materials, labor summaries
   - Task creation from templates
   - Status column mapping
   - AI suggestion generation

5. **estimateService.ts** - Estimate creation and approval
   - Draft management
   - Submit for approval
   - Approve/request changes
   - Line item validation
   - Total calculation

6. **invoiceService.ts** - Invoice management (Enhanced)
   - Multi-campus invoice splitting
   - Enhanced validation (funding source, work notes required)
   - Date range filtering
   - Campus-based filtering
   - Breakdown calculations
   - Draft, submit, approve, mark as paid workflow

7. **leadService.ts** - Lead pipeline
   - CRUD operations
   - Lead-to-project conversion
   - Stage tracking
   - Source tracking

8. **contactService.ts** - Contact management
   - Contact CRUD
   - Type-based organization
   - Company tracking

9. **campusService.ts** - Campus/location management
   - Campus list
   - Funding source tracking

10. **retainerRateService.ts** - Hourly rate management
    - Rate type (Manual Labor, Project Management, Construction Supervision)
    - Hourly rate storage
    - Description and notes

11. **siteWalkthroughService.ts** - Site inspection
    - Walkthrough CRUD
    - Finding documentation
    - Severity tracking
    - Cost estimation

12. **historicDocumentationService.ts** - Preservation tracking
    - Documentation CRUD
    - Materials tracking
    - Method documentation
    - Compliance notes

13. **workUpdateService.ts** - Status updates and notifications
    - Update types: Status, Schedule Change, Delay, Completion, Note
    - Timeline tracking
    - Completion date updates
    - Affects-timeline flag

14. **pdfService.ts** - PDF export
    - Invoice PDF generation
    - Estimate PDF generation
    - HTML to canvas conversion
    - Custom formatting

---

## 3. USER ROLES AND ACCESS CONTROL

### 3.1 Defined Roles

```typescript
type UserRole = 'Owner' | 'Developer' | 'User';
```

### 3.2 Demo User Properties

```typescript
{
  id: 'demo-user-123',
  email: 'demo@pelicanstate.com',
  role: 'Owner',
  campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
  phone: '',
  aud: 'authenticated',
  // ... Supabase auth properties
}
```

### 3.3 Role-Based Access

**Note:** Current implementation uses demo mode auto-login for all users. Full RBAC would need to be implemented in Supabase policies.

**Implied Permission Model (from code structure):**

| Role | Access | Features |
|------|--------|----------|
| **Owner** | All | Create/edit projects, approve estimates/invoices, access analytics |
| **Developer** | Most | Create work requests, manage estimates, limited analytics |
| **User** | Limited | View assignments, submit updates, access own records |

### 3.4 Campus-Based Access

- Users assigned to specific campuses
- Filtering by assigned campus visible in multiple pages
- Demo user has access to all three main campuses

### 3.5 Project Client Visibility

Projects can be configured to show/hide:
- `showBudget` - Financial visibility
- `showTimeline` - Schedule visibility
- `showInvoices` - Billing visibility
- `showContacts` - Team visibility

Controls what clients see via public portal links.

---

## 4. DATA MODELS

### 4.1 Core Entities and Relationships

```
Campus (location/organization)
  ├── Projects (client engagements)
  │   ├── WorkOrders (tasks)
  │   │   ├── Estimates (cost proposals)
  │   │   │   └── Invoices (billing)
  │   │   ├── WorkUpdates (status history)
  │   │   ├── HistoricDocumentation (if is_historic=true)
  │   │   └── Quotes (approval chain)
  │   ├── Leads (pipeline)
  │   └── Contacts (CRM)
  ├── SiteWalkthroughs (inspections)
  └── RetainerRates (labor pricing)
```

### 4.2 WorkRequest (Main Work Order Model)

```typescript
interface WorkRequest {
  id: string;
  request_number: string;              // Human-readable ID
  campus_id: string;
  property: string;                    // Location within campus
  is_historic: boolean;                // Historic property flag
  category: 'Small Task' | 'Event Support' | 'Construction Project';
  description: string;                 // Work summary
  status: WorkRequestStatus;           // State in pipeline
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_cost?: number;
  approved_by?: string;
  approved_at?: string;
  scope_of_work?: string;              // Detailed scope
  inspection_notes?: string;           // Site inspection findings
  historic_documentation?: HistoricDocumentation;  // Linked historic info
}

type WorkRequestStatus = 
  | 'Intake'      // Initial submission
  | 'Scoping'     // Being defined
  | 'Estimate'    // Cost estimation
  | 'Approval'    // Awaiting authorization
  | 'Schedule'    // Being scheduled
  | 'Progress'    // Currently in progress
  | 'Complete'    // Work finished
  | 'Invoice'     // Billing stage
  | 'Paid';       // Payment received
```

### 4.3 Project Model

```typescript
interface Project {
  id: string;
  name: string;
  siteId: string;                       // Linked site/location
  campusId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientLogo?: string;
  internalOwnerId: string;              // PM ownership
  primeVendorId?: string;               // Main contractor
  status: 'Planning' | 'PreConstruction' | 'Active' | 'Closeout' | 'OnHold' | 'Completed';
  clientSummary?: string;
  internalNotes?: string;
  clientVisibility: {
    showBudget: boolean;
    showTimeline: boolean;
    showInvoices: boolean;
    showContacts: boolean;
  };
  shareToken?: string;                  // Public access token
  startDate: string;
  endDate: string;
  totalBudget: number;
  spentBudget: number;                  // Running total
}
```

### 4.4 Estimate Model

```typescript
interface Estimate {
  id: string;
  work_request_id: string;
  line_items: EstimateLineItem[];
  total_amount: number;
  not_to_exceed: number;                // Budget cap
  status: 'Draft' | 'Submitted' | 'Approved' | 'Changes Requested';
  created_at: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
}

interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;                         // 'hrs', 'sq ft', etc.
  rate: number;                         // Hourly rate or unit cost
  amount: number;                       // quantity × rate
}
```

### 4.5 Invoice Model (Enhanced)

```typescript
interface Invoice {
  id?: string;
  invoice_number?: string;              // Auto-generated
  work_request_ids: string[];           // Multi-work-order invoices
  campus_id: string;
  funding_source: string;               // REQUIRED: Budget code/fund
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

interface InvoiceLineItem {
  id?: string;
  work_request_id: string;
  description: string;
  location?: string;                    // REQUIRED: Where work occurred
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  work_performed_notes?: string;        // REQUIRED: What was actually done
}
```

### 4.6 Lead Model

```typescript
interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  stage: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  source: 'Referral' | 'Inbound' | 'Event' | 'Cold Outreach' | 'Returning Client' | 'Client Portal';
  estimatedValue: number;               // Deal size
  nextStep?: string;
  notes?: string;
  campusId?: string;
  projectId?: string;                   // Linked after conversion
  contactIds: string[];                 // Related contacts
  createdAt: string;
  updatedAt: string;
  intakeMetadata?: {
    templateId?: string;
    templateName?: string;
    planQuestions?: string[];
    materialSummary?: string;
    laborSummary?: string;
    submittedBy?: string;
  };
}
```

### 4.7 Contact Model

```typescript
interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  type: 'Client' | 'Internal' | 'Vendor' | 'Partner';
  email: string;
  phone: string;
  campusId?: string;
  projectIds: string[];                 // Multi-project association
  leadIds: string[];
  preferredChannel?: 'Email' | 'Phone' | 'Text';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.8 Historic Documentation Model

```typescript
interface HistoricDocumentation {
  id: string;
  work_request_id: string;
  materials_used: string;               // Materials employed
  methods_applied: string;              // Techniques used
  architect_guidance: string;           // Professional guidance
  compliance_notes: string;             // Regulatory/policy notes
  photo_urls?: string[];               // Evidence photos
  created_at: string;
  updated_at: string;
}
```

### 4.9 Site Walkthrough Model

```typescript
interface SiteWalkthrough {
  id: string;
  campus_id: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'Scheduled' | 'In Progress' | 'Complete';
  findings: SiteFinding[];
  priority_list?: string[];             // Top issues
  notes?: string;
}

interface SiteFinding {
  id: string;
  category: 'Safety' | 'Maintenance' | 'Inspection' | 'Historic';
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  estimated_cost?: number;
  recommended_action?: string;
}
```

### 4.10 RetainerRate Model

```typescript
interface RetainerRate {
  id: string;
  rate_type: 'Manual Labor' | 'Project Management' | 'Construction Supervision';
  hourly_rate: number;
  description: string;
  notes?: string;
}

// Defaults:
// - Manual Labor: $45/hr
// - Project Management: $85/hr
// - Construction Supervision: $95/hr
```

### 4.11 Campus Model

```typescript
interface Campus {
  id: string;
  name: 'Wallace' | 'Woodland' | 'Paris' | others;
  address: string;
  funding_source: string;               // Budget authority
  is_historic: boolean;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

// Current Campuses:
// - Wallace (State Historic Fund A, Critical priority)
// - Woodland/Laplace (Parish Tourism Board, High)
// - Paris (General Maintenance Fund, Low)
// - Cypress Arts District
// - Jefferson Parish Schools
// - Pelican Hospitality Sites
```

### 4.12 WorkUpdate Model

```typescript
interface WorkUpdate {
  id: string;
  work_request_id: string;
  update_type: 'Status' | 'Schedule Change' | 'Delay' | 'Completion' | 'Note';
  message: string;
  created_by: string;
  created_at: string;
  affects_timeline?: boolean;           // Impact on schedule
  new_completion_date?: string;         // If rescheduled
}
```

---

## 5. KEY BUSINESS WORKFLOWS

### 5.1 Work Request Lifecycle

```
1. INTAKE (Submission)
   - User submits work request via form
   - Campus, property, category, priority captured
   - Historic property flagged if applicable
   - Description and scope documented
   ↓
2. SCOPING (Definition)
   - Team evaluates scope
   - Inspection notes added
   - Materials/labor identified
   - Architect review if historic
   ↓
3. ESTIMATE (Costing)
   - Line items created (labor + materials)
   - Total amount calculated
   - Not-to-exceed amount set
   ↓
4. APPROVAL (Authorization)
   - Manager/budget owner approves
   - Approval notes recorded
   - Changes requested if needed (loops back to Estimate)
   ↓
5. SCHEDULE (Planning)
   - Resource dates assigned
   - Team allocation
   - Site preparation scheduled
   ↓
6. PROGRESS (Execution)
   - Work begins
   - Status updates recorded
   - Photos/documentation captured
   - Delays flagged if timeline affected
   ↓
7. COMPLETE (Handoff)
   - QC checklist verified
   - Photos uploaded
   - Completion date recorded
   ↓
8. INVOICE (Billing)
   - Line items matched to completion
   - Work-performed notes verified
   - Campus/funding source confirmed
   - Invoice generated and submitted
   ↓
9. PAID (Closure)
   - Payment processed
   - Payment method recorded
   - Work request closed
```

### 5.2 Invoice Creation Flow (Multi-Campus)

```
1. SELECT WORK REQUESTS
   - Choose completed/ready-to-invoice work orders
   - System identifies impacted campuses
   ↓
2. ADD LINE ITEMS (Per Campus)
   - For each campus, add line items from selected work orders
   - Required fields:
     • Description (what work)
     • Location (where)
     • Quantity & Rate
     • Work-Performed Notes (what was actually done)
   ↓
3. VALIDATE
   - Funding source required
   - Campus confirmed
   - All required fields populated
   - At least one line item per campus
   ↓
4. SUBMIT
   - Status: Draft → Submitted
   - Submitter recorded
   - Date stamped
   ↓
5. APPROVAL
   - Budget owner reviews
   - Status: Submitted → Approved (or rejected)
   - Approval date recorded
   ↓
6. PAYMENT
   - Finance processes payment
   - Status: Approved → Paid
   - Payment method recorded
```

### 5.3 Project Creation & Planning

```
1. NEW PROJECT
   - Select campus and site
   - Enter client information
   - Set budget and timeline
   - Configure client visibility options
   ↓
2. LINK STAKEHOLDERS
   - Attach leads (sales opportunities)
   - Attach contacts (client team)
   - Assign PM owner
   ↓
3. GENERATE TASK PLAN
   - Select project template (default, historic, event, etc.)
   - AI generates walkthrough questions
   - AI estimates material needs
   - AI estimates labor requirements
   ↓
4. CREATE TASKS
   - Auto-generate tasks from template
   - Optionally customize labor rates
   - Manual task creation available
   ↓
5. MANAGE EXECUTION
   - Track task progress on Kanban board
   - Move tasks through status columns
   - Update work on each task
```

### 5.4 Estimate-to-Invoice Workflow

```
Work Request (Estimate status)
  ↓
Create Estimate (line items added)
  ↓
Submit Estimate (status: submitted)
  ↓
Approve Estimate (status: approved)
  ↓
Schedule Work (status: scheduled)
  ↓
Complete Work (status: complete)
  ↓
Link to Invoice (status: invoice)
  ↓
Create Invoice (with line items from completed work)
  ↓
Submit Invoice
  ↓
Approve Invoice
  ↓
Pay Invoice → (status: paid)
```

### 5.5 Historic Property Workflow

```
Work Request (is_historic: true)
  ↓
Trigger Historic Compliance
  ├── Materials review
  ├── Methods approval (SHPO if needed)
  └── Architect guidance documented
  ↓
Add Historic Documentation
  ├── Materials Used
  ├── Methods Applied
  ├── Architect Guidance
  ├── Compliance Notes
  └── Photo URLs
  ↓
Complete with Evidence
  └── Documentation required before closure
```

### 5.6 Client Communication & Portal Access

```
Public Project Portal (Unauthenticated)
  ↓
Client receives share link:
  /client/projects/:projectId/:token
  ↓
Access controlled by shareToken
  (no login required)
  ↓
Visibility configured per project:
  - Show/hide budget
  - Show/hide timeline
  - Show/hide invoices
  - Show/hide contacts
  ↓
Client views customized project summary
```

---

## 6. UI/UX COMPONENTS

### 6.1 Layout Structure

**Main Layout (`MainLayout.tsx`):**
```
┌─ Top Bar (Fixed Height: 80px) ──────────────────────────────────────┐
│ Left: Page Title + Subtitle    | Center: Search  | Right: Actions   │
└─────────────────────────────────────────────────────────────────────┘
┌─ Sidebar (Collapsed Toggle) ──────────────────────────────────────────┐
│ • Brand logo/name                                                      │
│ • Main Menu (Dashboard, Projects, Leads, Contacts, Estimates, etc.)   │
│ • Other (Analytics, Integration, Performance, Members)                │
│ • Bottom: User profile + Logout                                        │
│ • Can collapse to icon-only (80px width)                              │
└─────────────────────────────────────────────────────────────────────┘
┌─ Main Content Area (Scrollable) ────────────────────────────────────┐
│ • Full page content                                                   │
│ • Padding: 32px                                                       │
│ • Background: Neutral-100 (light gray)                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Sidebar Details:**
- Logo: "P" (Pelican) in circle
- Brand: "Pelican State" + "Building Dreams" tagline
- Responsive: Collapses to 96px (icons only) or expands to 256px
- Rounded corners (20px border radius)
- Margin: 16px all sides
- Sections: Main Menu, Other, Bottom Utilities

**Top Bar Details:**
- Search input with keyboard shortcut hint (⌘F)
- Collaborator avatars (3 shown with + button)
- Action buttons: Mail, Bell (notifications), Export
- Export button: Orange pill (primary color)

### 6.2 Navigation Patterns

**Sidebar Navigation:**
- Main menu items with icons and optional badges
- Active state: Primary color background + white text
- Hover state: Neutral-100 background
- Badges show counts (Projects: 28, Billing: 14)
- Collapsed state shows tooltip on hover

**Page Routing:**
- React Router v7 with nested routes
- Protected routes via `ProtectedRoute` component
- Dynamic breadcrumb titles in top bar
- Deep linking supported

**Tab Interfaces:**
- Multiple pages use tab patterns
- Tabs with icons and labels
- Locked tabs with tooltips (work request detail page)
- Scroll-friendly tab navigation

### 6.3 Form Patterns

**Input Components:**
- Text inputs: Full width with placeholder
- Email inputs: Standard email validation
- Number inputs: Currency formatting
- Date inputs: ISO format (YYYY-MM-DD)
- Select dropdowns: Campus, category, priority selection
- Textarea: Multi-line notes and descriptions

**Form Structure:**
- Label above input pattern
- Error messages below field (red text)
- Required field indicators (*)
- Grouped related fields in sections
- Buttons: Primary (action), Secondary (cancel), Tertiary (delete)

**Validation:**
- Client-side validation on submit
- Error collection and display
- Custom validation rules per form type

**Multi-Step Forms:**
- Wizard pattern in intake pages
- Progress indicators
- Back/Next navigation
- Autosave of steps

### 6.4 Data Display Patterns

**Tables:**
- Sortable columns
- Row selection (checkboxes)
- Row actions (edit, delete, view)
- Pagination or infinite scroll
- Status badges with colors
- Badge color codes:
  - Green: Completed, Paid, Active
  - Blue: In Progress, Scheduled
  - Yellow: Approval pending, Medium priority
  - Red: Blocked, Critical priority
  - Gray: Draft, default state

**Cards:**
- Summary cards with icon, title, count, trend
- Project cards with budget/timeline info
- Task cards for Kanban board
- Hover effects and shadows

**Status Indicators:**
- Color-coded badges
- Icons (CheckCircle, Play, Clock, AlertTriangle)
- Progress bars (timeline/budget)
- Percentage displays

**Modals:**
- Centered overlay
- Backdrop blur
- Form content inside
- Close button (X) in corner
- Primary action button

**Kanban Board:**
- Column-based layout (To Do, In Progress, Done)
- Draggable task cards
- Drop zones with visual feedback
- Card actions (edit, delete)

### 6.5 Color Scheme

**Primary Colors:**
- Primary-500: Orange/Accent color for active states and buttons
- Primary-600: Darker orange for hover states
- Primary-50: Light orange for badges and backgrounds

**Neutrals:**
- Neutral-900: Text (darkest)
- Neutral-700: Secondary text
- Neutral-500: Tertiary text
- Neutral-100: Light backgrounds
- Neutral-50: Very light backgrounds
- White: Card/container backgrounds

**Status Colors:**
- Green (#10B981): Success, Complete, Active
- Blue (#3B82F6): Info, In Progress
- Yellow/Amber (#FBBF24): Warning, Needs Action
- Red (#EF4444): Error, Blocked, Critical

**Typography:**
- Heading: Bold, larger font (font-heading class)
- Body: Regular weight (font-body class)
- Sizes: sm (12px), base (14px), lg (16px), xl (18px), 2xl (24px), 3xl (30px)

### 6.6 Responsive Design

**Breakpoints:**
- Mobile: < 640px (not fully optimized in current codebase)
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Responsive Classes:**
- Most layouts use flex/grid for flexibility
- Sidebar has collapse behavior for smaller screens
- Tables may scroll horizontally on mobile
- Mobile view not fully documented in codebase

---

## 7. INTEGRATION POINTS

### 7.1 Supabase Integration

**Database Connection:**
```typescript
// services/supabaseClient.ts
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Auth Integration:**
- Email/password authentication
- Session management via JWT
- Auth state listener for session changes
- Demo mode uses hardcoded user fallback

**Service Layer Pattern:**
```typescript
// Each service wraps Supabase calls
export const workRequestService = {
  async getWorkRequests(filters?) {
    let query = supabase.from('work_requests').select('*');
    // Apply filters
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  // ... more methods
};
```

**Tables Expected in Supabase:**
- work_requests
- estimates
- invoices
- projects
- project_tasks
- work_updates
- site_walkthroughs
- historic_documentation
- contacts
- leads
- campuses
- retainer_rates

### 7.2 External APIs

**PDF Generation:**
- `jsPDF` + `html2canvas` for invoice/estimate PDFs
- Server-side rendering in `pdfService.ts`
- No external API calls (local library usage)

### 7.3 Email & Notifications

**Current Implementation:**
- React Hot Toast for client-side notifications
- Toast notifications for:
  - Success messages (green)
  - Error messages (red)
  - Info messages (blue)

**Not Yet Implemented:**
- Email notifications for status changes
- Email for invoice submissions
- Email for approval requests
- SMS notifications

### 7.4 Client Portal Access Mechanism

**Public Access Without Auth:**
```
Share link: /client/projects/:projectId/:token

Flow:
1. Owner generates token: projectService.generateClientLink(projectId)
2. Token stored in Project.shareToken
3. No login required to access public URL
4. Visibility controlled by Project.clientVisibility settings
5. Read-only interface for clients
```

**Implementation:**
- `ProjectClientViewPage.tsx` component
- Route not protected (no ProtectedRoute wrapper)
- Token validation could be added to verify access

### 7.5 Data Import/Export

**Current:**
- PDF export for invoices via `pdfService.ts`
- PDF export for estimates (via invoice builder)

**Not Implemented:**
- CSV export
- Excel export
- Bulk import
- API webhooks

---

## 8. DEMO MODE SPECIFICS

### 8.1 What Data is Hardcoded for Demo

**Auth Context (`AuthContext.tsx`):**
```typescript
const DEMO_USER: AuthUser = {
  id: 'demo-user-123',
  email: 'demo@pelicanstate.com',
  role: 'Owner',
  campusAssigned: ['Wallace', 'Woodland (Laplace)', 'Paris'],
  // ... other auth properties
};

// Auto-loads on app start - no login required
const [user, setUser] = useState<AuthUser | null>(DEMO_USER);
```

**Pipeline Mock Data (`data/pipeline.ts`):**
- `mockCampuses` (6 locations)
- `mockSites` (7 sites across campuses)
- `mockUsers` (4 team members)
- `mockVendors` (3 vendors)
- `mockProjects` (3 projects)
- `mockLeads` (multiple leads)
- `mockContacts` (multiple contacts)
- `mockWorkOrders` (multiple work orders)
- `mockQuotes` (multiple quotes)
- `mockInvoices` (multiple invoices)

**Work Request Mock Data (`data/mock.ts`):**
- `mockWorkRequests` (4 samples with various statuses)
- `statusCards` (dashboard metrics with hardcoded counts)
- `projectHistoryItems` (team member activity log)

### 8.2 Which Features Work in Demo vs Production

**Works in Demo (Mock Data):**
- ✅ Dashboard with metrics
- ✅ Project list and detail pages
- ✅ Work request creation and list
- ✅ Estimate builder
- ✅ Invoice builder
- ✅ Lead management
- ✅ Contact management
- ✅ Kanban board (tasks)
- ✅ Historic documentation
- ✅ Site walkthroughs
- ✅ Project client portal (with share token)
- ✅ PDF export (invoices, estimates)

**Limited/Partial in Demo:**
- ⚠️ Data persistence (in-memory only, lost on refresh)
- ⚠️ Multi-user collaboration (single demo user)
- ⚠️ Email notifications (toast only)
- ⚠️ Real Supabase connection (would work if env vars set)

**Requires Supabase Production Setup:**
- 🔴 User authentication/multi-user
- 🔴 Data persistence
- 🔴 Real-time collaboration
- 🔴 Historical data retention
- 🔴 Advanced analytics
- 🔴 Email/webhook integrations

### 8.3 Demo Mode Limitations

1. **No Data Persistence**
   - All changes lost on page refresh
   - In-memory arrays modified but not saved

2. **Single User**
   - Only DEMO_USER available
   - No ability to test multi-user workflows
   - No role-based access testing

3. **No Email**
   - No actual email notifications
   - Approvals/status changes don't trigger external communications

4. **Limited Integrations**
   - Supabase client created with dummy credentials if env vars missing
   - Falls back to console warnings
   - No real auth backend

5. **No Real-Time Updates**
   - Changes not reflected across browsers/tabs
   - Supabase subscriptions would provide this in production

---

## 9. MISSING OR INCOMPLETE FEATURES

### 9.1 Routes Marked "Coming Soon"

```typescript
// From App.tsx routing
<Route path="/schedules" element={<div className="p-8"><h1>Schedules (Coming Soon)</h1></div>} />
<Route path="/analytics" element={<div className="p-8"><h1>Analytics (Coming Soon)</h1></div>} />
<Route path="/members" element={<div className="p-8"><h1>Members (Coming Soon)</h1></div>} />
<Route path="/settings" element={<div className="p-8"><h1>Settings (Coming Soon)</h1></div>} />
```

**Coming Soon Pages:**
1. **Schedules** - Calendar/timeline view of projects and tasks
2. **Analytics** - Reporting, dashboards, KPI tracking
3. **Members** - Team management, permissions, roles
4. **Settings** - System configuration, integrations

### 9.2 Unimplemented Services

Based on service files that exist but may not be fully wired:

- **Real-time Supabase subscriptions** - Services use basic queries only
- **Change notifications** - No webhook or event system
- **Advanced filtering** - Services have filter capabilities but UI may not expose all
- **Search functionality** - Partially implemented in services, not all pages

### 9.3 Missing Features from Sidebar

**Sidebar has links to pages that need implementation:**
- `/integrations` - Integration marketplace
- `/performance` - Performance monitoring/analytics
- `/information` - Help/documentation system

### 9.4 Known TODOs in Code

```typescript
// From grep search:
// Most code is production-ready, but these are areas that might need enhancement:

1. Historic documentation - Component exists but may need photo upload UI
2. Retainer rates - Service exists but no UI for management
3. Work updates - Service exists but timeline view may be incomplete
4. Change orders - Mentioned in WorkLogType but no dedicated feature
5. Approvals - Basic workflow exists but no email notifications
6. Payment methods - Invoice model has field but no payment processor integration
```

### 9.5 Incomplete Workflows

**User Management:**
- No interface to create/manage users
- No team member invitations
- No role assignments per user

**Permission Management:**
- No UI for granular permissions
- All demo users have Owner access
- Supabase RLS policies would need to be configured

**Reporting:**
- No analytics dashboard
- No financial reports
- No project health dashboards
- No team utilization reports

**Integrations:**
- No payment processor (Stripe, etc.)
- No accounting software integration (QuickBooks, etc.)
- No calendar/scheduling system integration

---

## 10. PERFORMANCE AND TECHNICAL CONSIDERATIONS

### 10.1 Bundle Sizes

**Dependencies:**
- React 19.2.0 (~45KB gzipped)
- Tailwind CSS 3.4.19 (~15KB gzipped for utility CSS)
- Recharts 3.7.0 (~70KB gzipped) - charting library
- Lucide Icons 0.563.0 (~20KB gzipped) - SVG icon library
- jsPDF 4.1.0 (~100KB gzipped) - PDF generation
- html2canvas 1.4.1 (~80KB gzipped) - Canvas rendering
- Supabase JS SDK 2.95.3 (~90KB gzipped)
- React Router DOM 7.13.0 (~50KB gzipped)

**Estimated Total:** ~500-600KB gzipped (production build)

**Optimization Opportunities:**
- Code splitting by route (React.lazy + Suspense)
- Remove unused chart/PDF dependencies if not needed
- Tree-shake Lucide icons (only import needed ones)
- Compress images and PDFs

### 10.2 Performance Metrics

**Current State:**
- ✅ Fast initial load (demo data in memory)
- ✅ Smooth navigation (SPA architecture)
- ⚠️ Large data sets may cause lag in tables
- ⚠️ PDF generation blocks UI (synchronous)

**Potential Issues:**
1. **No pagination** - Work request list loads all records
2. **No virtual scrolling** - Long tables rendered entirely
3. **Synchronous PDF generation** - UI freezes during export
4. **No caching strategy** - Refetch data on every navigation

### 10.3 Known Issues or Warnings

**Console Warnings:**
```
Missing Supabase environment variables - will use demo mode fallback for authentication
```

**Potential Issues:**
1. **Auth fallback** - Demo mode may hide real Supabase errors
2. **Error handling** - Some services may not handle network errors gracefully
3. **Type safety** - Any-types in some places where TypeScript could be stricter
4. **Validation** - Invoice validation is stringent but error messages could be clearer

### 10.4 Scalability Considerations

**Current Limitations:**
- Mock data stored in memory (can't scale to thousands of records)
- No pagination implemented
- No query optimization (N+1 query potential)
- No data indexing strategy discussed

**For Production Scale-Up:**
1. Implement pagination and virtual scrolling
2. Add Supabase indexes on frequently queried fields
3. Cache frequently accessed data (projects, contacts)
4. Implement request debouncing/throttling
5. Add lazy loading for detail pages
6. Archive/archive old work orders

### 10.5 Security Considerations

**Current State:**
- ✅ TypeScript for type safety
- ✅ Demo user fallback prevents auth errors
- ⚠️ Public client portal uses share token (no encryption)
- ⚠️ No CSRF protection visible
- ⚠️ Client-side validation only (server validation needed)

**Security Recommendations:**
1. **Supabase RLS Policies** - Configure row-level security
2. **HTTPS Only** - Ensure all communication encrypted
3. **Rate Limiting** - Implement API rate limits
4. **Input Sanitization** - Sanitize all user inputs before DB insert
5. **Share Token Validation** - Encrypt/validate project share tokens
6. **Audit Logging** - Track all user actions
7. **Session Management** - Implement session timeouts

### 10.6 Accessibility (A11y)

**Current Implementation:**
- ✅ Semantic HTML (button, nav, aside, main, etc.)
- ✅ Color contrast for text
- ⚠️ Limited keyboard navigation
- ⚠️ No ARIA labels on interactive elements
- ⚠️ No screen reader testing mentioned

**A11y Improvements Needed:**
1. Add ARIA labels to buttons and icons
2. Implement keyboard-only navigation
3. Add focus indicators
4. Test with screen readers (NVDA, VoiceOver)
5. Ensure form inputs have associated labels
6. Add alt text to images

### 10.7 Browser Compatibility

**Build Target:**
- TypeScript 5.9.3 (ES2020+ features)
- React 19.2.0 (requires modern browsers)

**Supported Browsers:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS 14+)

**Not Supported:**
- IE11 or older
- Very old mobile browsers

---

## SUMMARY & KEY TAKEAWAYS FOR USER STORY DEVELOPMENT

### Architecture Highlights:
1. **Modern React + TypeScript SPA** - Type-safe, component-based UI
2. **Mock-First Strategy** - Demo mode enables development without backend
3. **Service Layer Pattern** - Clean separation between UI and data access
4. **Multi-Tenant Ready** - Campus-based access and client visibility controls
5. **Modular Features** - Each major function (estimates, invoices, projects) is discrete

### Core Value Propositions:
1. **Project Management** - Track construction projects from planning to completion
2. **Work Request Processing** - Structured intake-to-completion workflow
3. **Financial Management** - Estimate and invoice generation with approval gates
4. **Historic Property Support** - Special handling for preservation-required work
5. **Client Portal** - Read-only access for clients with configurable visibility

### Business Process Strengths:
1. Clear status workflows (9-state model for work requests)
2. Multi-campus support with fund tracking
3. Historic property compliance documentation
4. Role-based organization (Owner/PM/Finance)
5. Flexible project templates and task automation

### Areas for User Story Focus:
1. **Approval workflows** - Add email notifications and escalations
2. **Real-time collaboration** - Multiple team members editing same items
3. **Advanced reporting** - Financial analysis and project forecasting
4. **Team management** - User provisioning and permission matrix
5. **Integrations** - Accounting, scheduling, communication tools
6. **Mobile access** - Optimize for field work and mobile devices

---

**Document End**

*For additional context, see implementation files in:*
- `/PelicanState/PM Dashboard/app/src/pages/` - UI pages
- `/PelicanState/PM Dashboard/app/src/services/` - Data access layer
- `/PelicanState/PM Dashboard/app/src/data/` - Mock data and models

