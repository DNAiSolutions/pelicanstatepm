# PM Dashboard - End-to-End Testing Checklist

## Pre-Test Requirements
- ✅ Dev server running on http://localhost:5174/
- ✅ Supabase connection verified
- ✅ Test users configured:
  - owner@pelicanstate.pro (Owner role)
  - user@pelicanstate.pro (User role, Wallace campus only)

## Test Credentials
- **Email:** owner@pelicanstate.pro or user@pelicanstate.pro
- **Password:** Standard Supabase password (check Supabase auth settings)
- **Database:** tsiembsbxocszubdmrdi

## Test Workflow: Work Request → Estimate → Invoice → Payment

### Phase 1: Authentication & Dashboard
- [ ] Login with owner@pelicanstate.pro
- [ ] Verify redirect to /dashboard
- [ ] Verify dashboard cards display (4 metrics visible)
- [ ] Verify sidebar navigation loads (10 menu items)
- [ ] Verify user can logout

### Phase 2: Work Request Creation
- [ ] Click "New Work Request" button
- [ ] Fill form:
  - Campus: Select "Wallace"
  - Title: "HVAC Unit Replacement - Room 101"
  - Description: "Replace failing HVAC unit with new unit"
  - Priority: "High"
  - Estimated Hours: 8
  - Hourly Rate: 85
- [ ] Verify auto-draft saves every 2 seconds (check browser console)
- [ ] Submit form
- [ ] Verify redirect to work request list

### Phase 3: Work Request List & Detail
- [ ] View work request list page
- [ ] Verify new work request appears in list
- [ ] Click on work request to open detail page
- [ ] Verify all form data displays correctly
- [ ] Change status: "Intake" → "Scoping" (via detail page dropdown)
- [ ] Verify status updates immediately
- [ ] Verify historic documentation tab (if available)

### Phase 4: Estimate Creation
- [ ] From work request detail, click "Create Estimate"
- [ ] Fill estimate form:
  - Line Item 1: "Labor - HVAC Replacement" | 8 hours | $85/hr = $680
  - Line Item 2: "Materials - New HVAC Unit" | 1 unit | $4,200
  - Total: $4,880 (auto-calculated)
  - Not-to-Exceed: $5,000
- [ ] Verify total calculation is correct
- [ ] Verify NTE validation (should warn if total > NTE)
- [ ] Click "Download PDF"
- [ ] Verify PDF downloads with correct format
- [ ] Submit estimate
- [ ] Verify work request status auto-updates to "Estimate"

### Phase 5: Invoice Creation
- [ ] Navigate to Invoices page
- [ ] Click "New Invoice"
- [ ] Select work request from dropdown
- [ ] Verify line items auto-populate from estimate
- [ ] Select campus for invoice: "Wallace"
- [ ] Select funding source (e.g., "Operating Budget")
- [ ] Add note: "Final invoice for HVAC replacement"
- [ ] Click "Generate Invoice"
- [ ] Verify invoice displays with all line items
- [ ] Click "Download PDF"
- [ ] Verify PDF shows invoice number, date, campus, funding source
- [ ] Submit invoice
- [ ] Verify work request status updates to "Invoice"

### Phase 6: Invoice List & Payment Tracking
- [ ] Navigate to Invoices list page
- [ ] Verify new invoice appears in list
- [ ] Verify status shows "Pending"
- [ ] Click invoice to view details
- [ ] Click "Mark as Paid"
- [ ] Verify status changes to "Paid"
- [ ] Verify payment date is recorded

### Phase 7: Multi-Campus Testing
- [ ] Login with owner account (has access to all campuses)
- [ ] Create new work request for "Woodland/Laplace" campus
- [ ] Create estimate and invoice for this campus
- [ ] In invoice form, test splitting invoice across multiple campuses
- [ ] Verify each campus portion calculates correctly
- [ ] Download PDF and verify campus information is accurate

### Phase 8: Role-Based Access Control
- [ ] Logout and login with user@pelicanstate.pro (User role)
- [ ] Verify can only see "Wallace" campus in dropdowns
- [ ] Attempt to navigate to other campus work requests (should fail or filter)
- [ ] Create work request in Wallace campus (should succeed)
- [ ] Verify cannot create work request for other campuses

### Phase 9: PDF Generation Verification
- [ ] Download 3 PDFs:
  1. Estimate PDF
  2. Invoice PDF
  3. Historic Report PDF (if applicable)
- [ ] Verify each PDF opens correctly in browser
- [ ] Verify PDF contains accurate data
- [ ] Verify formatting is professional
- [ ] Verify logos/branding appear (if configured)

### Phase 10: Form Validation & Error Handling
- [ ] Try creating work request with empty title (should show error)
- [ ] Try creating estimate with no line items (should show error)
- [ ] Try creating invoice without selecting work request (should show error)
- [ ] Try entering negative values (should reject)
- [ ] Try entering non-numeric values in numeric fields (should reject)
- [ ] Verify error messages are clear and helpful

### Phase 11: Data Persistence
- [ ] Create a work request
- [ ] Refresh browser (F5)
- [ ] Verify work request still exists and data is intact
- [ ] Logout and login again
- [ ] Verify work request still visible
- [ ] Verify no data loss

### Phase 12: Navigation & UI
- [ ] Test all sidebar menu items (10 items)
- [ ] Verify links navigate to correct pages
- [ ] Test breadcrumb navigation (if present)
- [ ] Verify responsive layout on different screen sizes
- [ ] Verify buttons are clickable and provide feedback
- [ ] Verify toast notifications display (success/error messages)

## Test Results Summary

### Pass/Fail Status
| Phase | Test Name | Status | Notes |
|-------|-----------|--------|-------|
| 1 | Authentication & Dashboard | ⬜ | |
| 2 | Work Request Creation | ⬜ | |
| 3 | Work Request List & Detail | ⬜ | |
| 4 | Estimate Creation | ⬜ | |
| 5 | Invoice Creation | ⬜ | |
| 6 | Invoice List & Payment | ⬜ | |
| 7 | Multi-Campus Testing | ⬜ | |
| 8 | Role-Based Access | ⬜ | |
| 9 | PDF Generation | ⬜ | |
| 10 | Form Validation | ⬜ | |
| 11 | Data Persistence | ⬜ | |
| 12 | Navigation & UI | ⬜ | |

### Issues Found
(List any bugs or issues discovered during testing)

### Recommendations
(List any improvements or optimizations needed)

## Test Date: ________________
## Tested By: ________________
## Approved: ________________
