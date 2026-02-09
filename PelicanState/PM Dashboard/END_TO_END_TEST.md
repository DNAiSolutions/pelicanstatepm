# End-to-End Workflow Test Guide

This guide walks through the complete workflow from work request creation to payment marking in the Pelican State PM Dashboard.

## Prerequisites
- Supabase project set up (see GET_STARTED.txt)
- Three test users created:
  - `owner@pelicanstate.org` (Owner role)
  - `developer@pelicanstate.org` (Developer role)
  - `user@pelicanstate.org` (User role, Wallace campus only)
- Development server running: `npm run dev`

---

## Complete Workflow Test (30-45 minutes)

### Phase 1: Login & Dashboard (2 minutes)

**Test 1.1: Login as Owner**
1. Open http://localhost:5173
2. Enter: `owner@pelicanstate.org`
3. Password: `TestPass123!`
4. ✅ **Expected**: Dashboard loads with 4 status cards
   - Requests Needing Approval: 3
   - Active Work: 5
   - Blocked Items: 1
   - Invoices Pending: 2

**Test 1.2: Verify Quick Actions**
1. See right sidebar with quick action buttons
2. Click "Create Work Request" button
3. ✅ **Expected**: Redirects to Work Request Intake Form

---

### Phase 2: Create Work Request (5 minutes)

**Test 2.1: Fill Work Request Form**
1. Select Campus: **Wallace**
2. Property: **Historic Building - Main Wing**
3. Historic Property: **YES**
4. Category: **Structural Repairs**
5. Description: **Repair deteriorating foundation and restore historic masonry**
6. Estimated Cost: **$45,000**
7. Click "Create Work Request"
8. ✅ **Expected**: 
   - Request created with ID (e.g., WR-2024-001)
   - Status: "Intake" 
   - Redirects to work request details page

**Test 2.2: Verify Auto-Save**
1. Go back and edit the work request
2. Change description slightly
3. Wait 2 seconds
4. ✅ **Expected**: "Draft auto-saved" notification appears

---

### Phase 3: Build Estimate (7 minutes)

**Test 3.1: Create Estimate**
1. From work request detail, click "Create Estimate" button
2. Add three line items:
   - Labor (100 hrs @ $75/hr): **$7,500**
   - Materials (masonry/mortar): **$12,000**
   - Equipment rental (2 weeks): **$5,500**
3. Subtotal shows: **$25,000**
4. Set Not-to-Exceed: **$45,000**
5. Notes: "Foundation repair using period-appropriate materials"
6. ✅ **Expected**: 
   - Total displays correctly
   - Not-to-exceed shows in orange (warning color)
   - No "over budget" warning

**Test 3.2: Download Estimate PDF**
1. Click "Download PDF" button
2. ✅ **Expected**:
   - PDF downloads as `Estimate-WR-2024-001.pdf`
   - PDF contains:
     * Pelican State header
     * "ESTIMATE" title
     * All three line items with amounts
     * Subtotal: $25,000
     * Not-to-Exceed: $45,000
     * Footer: "This is an estimate..."

**Test 3.3: Submit Estimate for Approval**
1. Click "Submit for Approval" button
2. ✅ **Expected**:
   - Success toast: "Estimate submitted for approval!"
   - Work request status changes to "Approval"
   - Redirects to work request detail page

---

### Phase 4: Historic Documentation (5 minutes)

**Test 4.1: Add Historic Documentation**
1. Click "Historic Documentation" tab on work request
2. Upload photos:
   - Before photo (any image file)
   - During photo (any image file)
   - After photo (any image file)
3. Add materials to materials log:
   - Product: Lime Mortar, Spec: Historic Grade, Supplier: Heritage Supplies, Fasteners: Stainless Steel, Qty: 50 bags
4. Method Notes: "Used traditional lime mortar to maintain historic integrity"
5. Architect Guidance: "Follow 1920s construction standards. Preserve original stone wherever possible"
6. Compliance Notes: "Work complies with historic preservation guidelines. No synthetic materials used."
7. Click "Save Documentation"
8. ✅ **Expected**: "Historic documentation saved" notification

**Test 4.2: Download Historic Report PDF**
1. Click "Download PDF Report" button
2. ✅ **Expected**:
   - PDF downloads as `Historic-Report-WR-2024-001.pdf`
   - PDF contains:
     * Header: "PELICAN STATE - Historic Work Report"
     * Work request number and property name
     * Materials Log section with all items
     * Method Notes
     * Architect Guidance
     * Compliance Notes
     * Footer: "This document is part of the permanent record..."

---

### Phase 5: Create Invoice (8 minutes)

**Test 5.1: Mark Work as Complete**
1. From work request detail, click "Update Status"
2. Change to: **"Complete"**
3. Click Save
4. ✅ **Expected**: Status updates to "Complete"

**Test 5.2: Create Single Campus Invoice**
1. Go to "Create Invoice" (from sidebar or dashboard)
2. Select work request: Check the Wallace campus request
3. Add line items:
   - Foundation work (Labor): $7,500
   - Materials: $12,000
   - Equipment: $5,500
4. Click "Preview PDF" button
5. ✅ **Expected**:
   - PDF downloads as `Invoice-Preview-Wallace.pdf`
   - PDF shows:
     * "INVOICE" title
     * Campus: Wallace
     * Funding Source: (from campus)
     * All line items
     * Total: $25,000

**Test 5.3: Submit Invoice**
1. Notes: "Invoice for foundation repair work at historic building"
2. Click "Create & Submit Invoice(s)"
3. ✅ **Expected**:
   - Success toast: "1 invoice(s) created and submitted!"
   - Redirects to invoices list
   - New invoice shows "Submitted" status

---

### Phase 6: Multi-Campus Invoice Test (10 minutes)

**Test 6.1: Create Second Work Request (Different Campus)**
1. Create another work request:
   - Campus: **Woodland/Laplace**
   - Property: **Historic Church - Roof Repair**
   - Historic: YES
   - Description: **Roof restoration using period-appropriate shingles**
   - Estimated Cost: **$32,000**

**Test 6.2: Complete Workflow for Second Request**
1. Create estimate with line items totaling $18,000
2. Download PDF (verify it's for Woodland/Laplace campus)
3. Submit estimate
4. Update status to "Complete"
5. ✅ **Expected**: Second work request ready for invoicing

**Test 6.3: Create Multi-Campus Invoice**
1. Go to "Create Invoice"
2. Select BOTH work requests:
   - Check Wallace campus request
   - Check Woodland/Laplace request
3. Add line items for both requests
4. Click "Preview PDF"
5. ✅ **Expected**: 
   - PDF shows first campus (Wallace) data
   - Note at bottom: "A separate invoice will be created for each campus"

**Test 6.4: Submit Multi-Campus Invoice**
1. Click "Create & Submit Invoice(s)"
2. ✅ **Expected**:
   - Success toast: "2 invoice(s) created and submitted!"
   - Two invoices created (one per campus)
   - Each with correct campus and funding source
   - Both show "Submitted" status

---

### Phase 7: Role-Based Access Control (5 minutes)

**Test 7.1: Test Developer Role**
1. Logout and login as: `developer@pelicanstate.org`
2. ✅ **Expected**: 
   - Can see all campuses
   - Can create/edit work requests
   - Can create estimates
   - Can create invoices

**Test 7.2: Test User Role (Campus-Only Access)**
1. Logout and login as: `user@pelicanstate.org` (User role)
2. ✅ **Expected**:
   - Can only see Wallace campus data
   - Trying to access Woodland/Laplace work requests shows nothing or error
   - Can create estimates/invoices only for Wallace campus

---

### Phase 8: Verify PDF Generation Consistency (3 minutes)

**Test 8.1: Re-download Previously Generated PDFs**
1. Go to first work request
2. Click "Download PDF" on estimate section
3. ✅ **Expected**:
   - PDF downloads successfully
   - Filename matches: `Estimate-WR-2024-001.pdf`
   - Contains same data as before

**Test 8.2: Download Invoice PDF Again**
1. Go to invoices list
2. Find first invoice
3. Download PDF (if button exists)
4. ✅ **Expected**: PDF downloads correctly

---

## Test Checklist

**Authentication & Navigation**
- [ ] Login with all three user roles works
- [ ] Logout works
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control enforced
- [ ] Campus filtering works for User role

**Work Requests**
- [ ] Create work request with all fields
- [ ] Auto-save drafts work (wait 2 sec, refresh page)
- [ ] Work request shows correct status
- [ ] Update status transitions work (Intake → Approval → Complete)
- [ ] Historic property flag saves correctly

**Estimates**
- [ ] Add/remove line items
- [ ] Total calculates correctly
- [ ] Not-to-exceed validation works
- [ ] Submit estimate updates work request status
- [ ] Save draft functionality works
- [ ] Estimate PDF downloads with correct formatting
- [ ] PDF contains all line items and totals

**Historic Documentation**
- [ ] Upload before/during/after photos
- [ ] Add materials log entries
- [ ] Save documentation
- [ ] Historic report PDF downloads
- [ ] PDF contains materials, methods, architect guidance, compliance notes

**Invoices**
- [ ] Select work requests for invoicing
- [ ] Add line items correctly
- [ ] Single campus invoice creates one invoice
- [ ] Multi-campus invoices create separate invoices per campus
- [ ] Funding sources are correct for each campus
- [ ] Invoice PDF preview downloads
- [ ] Submit invoices marks them as "Submitted"

**PDFs**
- [ ] Estimate PDF formatting is correct (header, title, line items, total)
- [ ] Invoice PDF formatting is correct (campus, funding source)
- [ ] Historic report PDF formatting is correct
- [ ] All PDFs download with correct filenames
- [ ] PDF layout works with multiple pages (if applicable)

---

## Expected Final State After Complete Test

**Dashboard shows:**
- 0-1 Requests Needing Approval (all submitted)
- 0-2 Active Work (completed)
- 0 Blocked Items
- 2 Invoices Pending (both multi-campus invoices)

**Database contains:**
- 2 work requests (both with status "Complete")
- 2 estimates (both "Submitted")
- 2-4 invoices (depending on campus splitting)
- Historic documentation for at least 1 request
- 6 PDFs generated and downloaded

---

## Troubleshooting Common Issues

**"Work request not found"**
- Check Supabase database: Make sure work requests table has data
- Clear browser cache and refresh
- Check browser console for error messages

**"Estimate submission fails"**
- Verify line items have descriptions and amounts
- Check that total is a valid number
- Look at Supabase error logs

**"PDF doesn't download"**
- Check browser download settings
- Verify jsPDF library loaded correctly (check console)
- Try different browser

**"Multi-campus invoice shows only one campus"**
- Verify both work requests have different campus_id values
- Check that line items are properly associated with work requests
- Look at invoices table to see if multiple invoices were created

**"Historic documentation photos don't save"**
- Verify historic-docs storage bucket exists in Supabase
- Check storage bucket is public
- Check browser console for upload errors

---

## Performance Notes

Expected performance benchmarks:
- Page load time: < 2 seconds
- Estimate PDF generation: < 1 second
- Invoice PDF generation: < 1 second
- Historic report PDF generation: < 2 seconds
- Multi-campus invoice creation: < 2 seconds

If slower than expected, check:
- Network tab in DevTools for slow API calls
- JavaScript console for errors
- Supabase query performance
