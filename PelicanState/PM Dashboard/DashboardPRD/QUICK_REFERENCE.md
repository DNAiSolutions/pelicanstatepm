# Pelican State PM Dashboard - Quick Reference Guide

## Technology Stack at a Glance

**Frontend**: React 19.2 + TypeScript 5.9
**Styling**: Tailwind CSS 3.4 
**Routing**: React Router 7.13
**Backend**: Supabase (PostgreSQL + Auth)
**Deployment**: Vercel
**PDF**: jsPDF + html2canvas

## File Organization

```
/src
├── /pages         (18 main page components)
├── /services      (14 service modules for data access)
├── /components    (5 major reusable components)
├── /layouts       (MainLayout with sidebar + topbar)
├── /context       (AuthContext for state management)
├── /data          (Mock data: pipeline.ts, mock.ts)
├── /types         (TypeScript interfaces)
└── /utils         (Utilities like statusMachine.ts)
```

## Core Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | DashboardPage | Metrics overview |
| `/projects` | ProjectOverviewPage | Project list & creation |
| `/projects/:id` | ProjectDetailPage | Project details & tasks |
| `/projects/board` | ProjectTaskBoardPage | Kanban board |
| `/client/projects/:id/:token` | ProjectClientViewPage | Public portal |
| `/work-requests` | WorkRequestListPage | Work order list |
| `/work-requests/new` | WorkRequestIntakePage | Create work request |
| `/work-requests/:id` | WorkRequestDetailPage | Work request details |
| `/estimates` | EstimatesListPage | Estimate list |
| `/estimates/new/:id` | EstimateNewPage | Create estimate |
| `/invoices` | InvoiceListPage | Invoice list |
| `/invoices/new` | InvoiceBuilderPage | Create invoice |
| `/leads` | LeadsPage | Sales pipeline |
| `/contacts` | ContactsPage | Contact management |
| `/walkthroughs` | SiteWalkthroughPage | Site inspections |
| `/historic-documentation` | HistoricDocumentationPage | Preservation records |

## Core Data Models

### WorkRequest (Main Entity)
- 9 status states: Intake → Scoping → Estimate → Approval → Schedule → Progress → Complete → Invoice → Paid
- Has: scope_of_work, inspection_notes, is_historic flag
- Linked to: Estimates, Invoices, HistoricDocumentation

### Project
- Status: Planning, PreConstruction, Active, Closeout, OnHold, Completed
- Contains: WorkOrders, Leads, Contacts
- Clients can view via public share token

### Invoice (Enhanced)
- **REQUIRED fields**: campus_id, funding_source
- **Per line item REQUIRED**: description, location, work_performed_notes, amount
- Supports multi-campus splitting
- Statuses: Draft → Submitted → Approved → Paid

### Estimate
- Statuses: Draft, Submitted, Approved, Changes Requested
- Has not_to_exceed tracking
- Line items with labor + materials

### Campus
- 6 existing: Wallace, Woodland, Paris, Cypress, Jefferson, Hospitality
- Each has: funding_source, priority level

## Service Layer (14 Services)

1. **supabaseClient** - Database & auth
2. **workRequestService** - Work order CRUD + filtering
3. **projectService** - Project management
4. **projectTaskService** - Task templates + generation
5. **estimateService** - Estimate CRUD
6. **invoiceService** - Invoice management (enhanced validation)
7. **leadService** - Lead pipeline (converts to projects)
8. **contactService** - Contact CRUD
9. **campusService** - Campus management
10. **retainerRateService** - Hourly rates
11. **siteWalkthroughService** - Site inspections
12. **historicDocumentationService** - Preservation docs
13. **workUpdateService** - Status updates
14. **pdfService** - PDF generation

## Auth & Roles

- **Roles**: Owner, Developer, User
- **Demo User**: demo@pelicanstate.com (Owner)
- **Campus Assignment**: Users assigned to specific campuses
- **Route Protection**: ProtectedRoute component wraps authenticated routes

## Key Workflows

### Work Request Lifecycle
1. Submit intake form (defaults to "Intake" status)
2. Team adds scope & inspection notes → "Scoping"
3. Create estimate with line items → "Estimate"
4. Get approval → "Approval" → "Approved"
5. Schedule work → "Schedule"
6. Execute work → "Progress"
7. Complete & verify → "Complete"
8. Create invoice → "Invoice"
9. Process payment → "Paid"

### Invoice Creation (Multi-Campus)
1. Select completed work requests
2. Add line items per campus (REQUIRED: description, location, work_performed_notes)
3. System validates funding source & all fields
4. Submit → Approve → Pay

### Project Planning
1. Create project (campus, budget, timeline)
2. Select task template (default, historic, event, etc.)
3. AI generates walkthrough questions + estimates
4. Auto-create tasks OR manually create
5. Move tasks on Kanban board (To Do → In Progress → Done)

## UI Patterns

**Sidebar Navigation**
- Collapsible (256px expanded, 96px collapsed)
- Active items: Primary color background
- Badges show counts

**Top Bar**
- Search with ⌘F shortcut
- Collaborator avatars
- Export button (orange pill)

**Status Badges**
- Green: Complete, Paid
- Blue: In Progress, Scheduled
- Yellow: Approval needed
- Red: Blocked, Critical
- Gray: Draft

**Forms**
- Label above input pattern
- Error messages below (red)
- Multi-step wizards for complex flows
- Validation on submit

## Demo Mode

**What's Hardcoded:**
- Demo user: demo@pelicanstate.com (Owner)
- 6 campuses, 7 sites, 3 projects
- 4 work requests, multiple leads & contacts
- All data in-memory (lost on refresh)

**Works in Demo:**
- ✅ All pages and workflows
- ✅ PDF export
- ✅ Project client portal (with share token)

**Doesn't Work:**
- ❌ Data persistence
- ❌ Multi-user workflows
- ❌ Email notifications
- ❌ Real Supabase connection (would work if env vars set)

## Coming Soon

- **Schedules** - Calendar/timeline view
- **Analytics** - Reporting & dashboards
- **Members** - Team management
- **Settings** - System configuration

## Key Business Rules

1. **Historic Properties**: Flag is_historic=true, requires special documentation
2. **Multi-Campus**: Invoices can span multiple campuses, each with own funding source
3. **Approval Gates**: Estimates & invoices require approval before payment
4. **Client Visibility**: Per-project controls for what clients can see
5. **Funding Source**: Required field for invoice (budget code/fund)
6. **Work Notes**: Required field for each invoice line item (what was actually done)

## Environment Variables

```
VITE_SUPABASE_URL=https://tsiembsbxocszubdmrdi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uIAAvk1ceyqYqF76lzKaFA_QoArYZfT
VITE_ENV=development (optional)
```

## Performance Notes

- Bundle size: ~500-600KB gzipped
- No pagination (loads all records)
- No virtual scrolling
- PDF generation is synchronous (blocks UI)
- Demo data in memory (instant load)

## Security Considerations

- Client-side validation only (add server-side)
- Demo mode bypasses auth (replace in production)
- Share tokens not encrypted (add encryption layer)
- No RLS policies configured (add to Supabase)
- TypeScript type safety throughout

---

**For detailed analysis, see**: /tmp/pm_dashboard_analysis.md
