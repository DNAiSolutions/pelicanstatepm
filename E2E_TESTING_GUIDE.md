# PM Dashboard - Complete E2E Testing Guide

## 🚀 Quick Start

**Dev Server Status:** Running on http://localhost:5174/

### Access the Application
```
Open browser → http://localhost:5174/
You should see the login page
```

---

## 🔐 Authentication Setup

### Test Accounts
| Email | Role | Campus Access | Password |
|-------|------|---|---|
| owner@pelicanstate.pro | Owner | All (Wallace, Woodland, Paris) | Use Supabase auth |
| user@pelicanstate.pro | User | Wallace only | Use Supabase auth |

### How to Login
1. Go to http://localhost:5174/login
2. Enter email: `owner@pelicanstate.pro`
3. Click "Sign Up / Sign In"
4. Follow Supabase auth flow
5. You'll be redirected to /dashboard

---

## 📋 Test Workflow Overview

```
Login → Dashboard → Create Work Request → Create Estimate → 
Create Invoice → Mark as Paid → Verify Status Updates
```

---

## Phase 1: Authentication & Dashboard ✅

### Step 1.1: Login
```
1. Navigate to http://localhost:5174/login
2. Enter email: owner@pelicanstate.pro
3. Click "Sign Up / Sign In"
4. Complete Supabase authentication
```

**Expected Result:** 
- Redirected to http://localhost:5174/dashboard
- Dashboard page loads with 4 status cards visible

### Step 1.2: Dashboard Verification
```
1. Verify you see these 4 cards:
   - Approval Requests (top-left)
   - Active Work Orders (top-right)
   - Blocked Items (bottom-left)
   - Invoices Pending (bottom-right)
2. Verify sidebar appears on left with navigation menu
3. Verify "New Work Request" button is visible
```

**Expected Result:**
- All 4 cards display (values may be 0 initially)
- Sidebar shows 10 menu items
- Page is responsive and loads quickly

### Step 1.3: Sidebar Navigation
```
Click each sidebar menu item:
1. Dashboard (home icon) - Current page
2. Work Requests (document icon)
3. Estimates (calculator icon)
4. Invoices (receipt icon)
5. Schedules (calendar icon)
6. Analytics (chart icon)
7. Members (people icon)
8. Settings (gear icon)
9. Logout (door icon)
```

**Expected Result:**
- Each link navigates to its corresponding page
- "Coming Soon" placeholders appear for future pages
- Pages maintain the sidebar and header

---

## Phase 2: Work Request Creation 📝

### Step 2.1: Create New Work Request
```
1. Click "New Work Request" button (or use /work-requests/new)
2. You should see a form with these fields:
   - Campus (dropdown)
   - Title (text field)
   - Description (textarea)
   - Priority (dropdown: Low/Medium/High)
   - Estimated Hours (number field)
   - Hourly Rate (number field)
   - Category (dropdown if present)
```

### Step 2.2: Fill Work Request Form
```
Fill in the following information:
- Campus: "Wallace" (or select from dropdown)
- Title: "HVAC Unit Replacement - Room 101"
- Description: "Replace failing HVAC unit with new energy-efficient model"
- Priority: "High"
- Estimated Hours: 8
- Hourly Rate: 85.00
- Notes: "Unit is 20 years old and no longer serviceable"
```

**Expected Result:**
- Form accepts all inputs
- Auto-save indicator appears (if implemented)
- No validation errors

### Step 2.3: Auto-Draft Saving
```
1. Watch the form for 2+ seconds
2. Open browser Developer Tools (F12)
3. Check Console for auto-save logs
4. Refresh page (F5)
5. Verify form data persists
```

**Expected Result:**
- Form data is preserved after refresh
- No "unsaved changes" warning on navigation
- Console shows save operations

### Step 2.4: Submit Work Request
```
1. Click "Submit Work Request" button (or "Save" button)
2. Wait for response (should be <2 seconds)
3. Observe toast notification (bottom-right corner)
```

**Expected Result:**
- Toast shows: "Work request created successfully"
- Redirected to /work-requests (list page)
- New work request appears in list
- Status shows "Intake"

---

## Phase 3: Work Request List & Detail 📋

### Step 3.1: Work Request List
```
1. You should now be on /work-requests page
2. You should see a table with columns:
   - Request # (e.g., WR-001)
   - Campus
   - Title
   - Status
   - Created Date
   - Actions
3. Your newly created request should be at the top
```

**Expected Result:**
- At least 1 work request visible in list
- Request shows "Intake" status
- Campus is correctly displayed
- Columns are sortable/filterable (if implemented)

### Step 3.2: View Work Request Detail
```
1. Click on your newly created work request row
2. You should be redirected to /work-requests/[id]
3. You should see:
   - Request number and title
   - All form fields you filled in
   - Current status: "Intake"
   - Status history timeline (if implemented)
   - Action buttons
```

**Expected Result:**
- All data displays correctly
- No missing information
- Page loads within 1 second

### Step 3.3: Update Status
```
1. Find the Status dropdown/selector
2. Change status from "Intake" to "Scoping"
3. Verify confirmation dialog appears (optional)
4. Confirm the change
```

**Expected Result:**
- Status updates immediately
- Toast notification: "Status updated to Scoping"
- Status change is reflected in database (verify in list page)

### Step 3.4: Historic Documentation (if available)
```
1. Look for a "Historic Documentation" tab
2. If present, click on it
3. You should see:
   - Materials log section
   - Method notes section
   - Architect guidance section
   - Compliance notes section
```

**Expected Result:**
- Tab loads without errors
- "Download Historic Report" button is visible
- Report downloads as PDF when clicked

---

## Phase 4: Estimate Creation 💰

### Step 4.1: Create Estimate
```
1. From work request detail page, look for:
   - "Create Estimate" button, OR
   - Navigate to /estimates/new/[work-request-id]
2. You should see an estimate form with:
   - Line items section (add multiple items)
   - Total amount (auto-calculated)
   - Not-to-Exceed amount field
```

**Expected Result:**
- Form loads
- No validation errors on load
- Line items section is empty/ready for input

### Step 4.2: Add Line Items
```
Add two line items:

Line Item 1:
- Description: "Labor - HVAC Replacement"
- Quantity: 8
- Unit: Hours
- Rate: 85.00
- Total: 680.00 (should auto-calculate)

Line Item 2:
- Description: "Materials - New HVAC Unit"
- Quantity: 1
- Unit: Unit
- Rate: 4200.00
- Total: 4200.00 (should auto-calculate)
```

**Expected Result:**
- Each line item accepts input
- Line item totals calculate correctly
- Can add/remove line items
- Cannot submit with invalid data

### Step 4.3: Set Not-to-Exceed
```
1. Set Not-to-Exceed: 5000.00
2. Current total should be 4880.00
3. Note: 4880 < 5000 (within limit)
```

**Expected Result:**
- NTE field accepts numeric input
- No warning shown (total is within NTE)
- If total exceeds NTE, warning appears

### Step 4.4: Verify Calculations
```
Check the following calculations:
- Line Item 1: 8 hours × $85 = $680 ✓
- Line Item 2: 1 × $4,200 = $4,200 ✓
- Total: $680 + $4,200 = $4,880 ✓
- NTE Status: $4,880 < $5,000 ✓
```

**Expected Result:**
- All calculations are correct
- Display is formatted with 2 decimal places
- Currency symbol is displayed

### Step 4.5: Download PDF
```
1. Click "Download PDF" button
2. Wait for PDF to generate (should be <2 seconds)
3. File should download as estimate PDF
4. Verify filename: "estimate-[id].pdf" or similar
```

**Expected Result:**
- PDF downloads successfully
- PDF opens in browser or downloads to disk
- PDF contains:
  - All line items with quantities and rates
  - Total amount
  - NTE amount
  - Professional formatting
  - Company branding (if configured)

### Step 4.6: Submit Estimate
```
1. Click "Submit Estimate" button
2. Verify toast notification appears
3. Observe that form may transition to read-only
```

**Expected Result:**
- Toast shows: "Estimate created successfully"
- Work request status auto-updates to "Estimate"
- Redirected to work request list or detail page

---

## Phase 5: Invoice Creation 🧾

### Step 5.1: Navigate to Invoice Creator
```
1. Click "Invoices" in sidebar, or
2. Navigate to /invoices/new
3. You should see an invoice form with:
   - Work request dropdown
   - Campus selector
   - Funding source selector
   - Line items (pre-populated from estimate)
   - Total amount
   - Notes field
```

**Expected Result:**
- Form loads
- No initial validation errors

### Step 5.2: Select Work Request
```
1. Click "Work Request" dropdown
2. You should see: "HVAC Unit Replacement - Room 101"
3. Select it
```

**Expected Result:**
- Dropdown shows your work request
- Line items auto-populate from estimate
- Totals auto-calculate

### Step 5.3: Verify Line Items
```
The following should auto-populate:
- Line Item 1: "Labor - HVAC Replacement" | $680
- Line Item 2: "Materials - New HVAC Unit" | $4,200
- Total: $4,880
```

**Expected Result:**
- All line items display
- No data loss from estimate
- Can edit line items if needed

### Step 5.4: Select Campus & Funding
```
1. Select Campus: "Wallace"
2. Select Funding Source: 
   - Look for options like "Operating Budget", "Capital Budget", etc.
   - Select any available option
```

**Expected Result:**
- Dropdowns show available options
- Selection is saved
- No validation errors

### Step 5.5: Add Notes
```
Add notes: "Final invoice for HVAC replacement project. Unit installed and tested."
```

**Expected Result:**
- Notes field accepts text
- No character limit violations
- Text is preserved

### Step 5.6: Generate Invoice
```
1. Click "Generate Invoice" or "Create Invoice" button
2. System should auto-generate invoice number
3. You should see preview or confirmation
```

**Expected Result:**
- Invoice number is auto-generated (e.g., "INV-001")
- Invoice date is today's date
- All information is accurate

### Step 5.7: Download Invoice PDF
```
1. Click "Download PDF" button
2. Wait for PDF to generate (should be <2 seconds)
3. Verify PDF downloads
```

**Expected Result:**
- PDF downloads successfully
- PDF contains:
  - Invoice number
  - Date
  - Campus name
  - Funding source
  - All line items
  - Total amount
  - Professional formatting

### Step 5.8: Submit Invoice
```
1. Click "Submit Invoice" or "Save Invoice" button
2. Verify toast notification
3. Work request status should update to "Invoice"
```

**Expected Result:**
- Toast shows: "Invoice created successfully"
- Work request status is now "Invoice"
- Redirected to invoice list page

---

## Phase 6: Invoice List & Payment 💳

### Step 6.1: View Invoice List
```
1. Click "Invoices" in sidebar
2. Navigate to /invoices
3. You should see a table with:
   - Invoice number
   - Work request title
   - Campus
   - Total amount
   - Status (should be "Pending" or "Draft")
   - Created date
   - Actions
```

**Expected Result:**
- Your created invoice appears in list
- Status shows "Pending"
- All data is accurate

### Step 6.2: Mark as Paid
```
1. Find your invoice in the list
2. Click on the invoice row OR click "View" button
3. Look for "Mark as Paid" button
4. Click it
```

**Expected Result:**
- Invoice detail page opens
- Status changes to "Paid"
- Payment date is recorded (today's date)
- Toast notification confirms the change

### Step 6.3: Verify Status in List
```
1. Go back to invoice list
2. Look for your invoice
3. Verify status now shows "Paid"
```

**Expected Result:**
- Invoice list reflects the status change
- No page refresh needed (if real-time is implemented)

### Step 6.4: Work Request Status Final
```
1. Navigate back to Work Request Detail
2. Verify status is now "Paid"
3. Note the complete workflow: 
   Intake → Scoping → Estimate → Invoice → Paid
```

**Expected Result:**
- Work request status shows "Paid"
- Status history shows all transitions
- Workflow is complete

---

## Phase 7: Multi-Campus Testing 🏫

### Step 7.1: Create Work Request for Different Campus
```
1. Click "New Work Request"
2. Campus: Select "Woodland (Laplace)"
3. Title: "Roof Repair - Building C"
4. Description: "Emergency roof repair after storm damage"
5. Priority: "High"
6. Estimated Hours: 12
7. Hourly Rate: 90.00
8. Submit
```

**Expected Result:**
- Work request created for Woodland campus
- Appears in work request list
- Campus filter shows "Woodland (Laplace)"

### Step 7.2: Create Estimate for Different Campus
```
1. Go to work request detail
2. Create estimate with:
   - Line Item 1: "Labor" | 12 hours | $90 = $1,080
   - Line Item 2: "Materials - Shingles" | 500 sq ft | $8 = $4,000
   - Total: $5,080
   - NTE: $5,500
3. Submit estimate
```

**Expected Result:**
- Estimate created
- Status updates to "Estimate"
- No campus conflicts

### Step 7.3: Create Invoice with Campus Info
```
1. Navigate to create new invoice
2. Select the Woodland work request
3. Campus should auto-select: "Woodland (Laplace)"
4. Funding Source: May differ based on campus
5. Submit invoice
```

**Expected Result:**
- Invoice associated with correct campus
- Funding source reflects campus setting
- PDF shows correct campus information

### Step 7.4: Test Campus-Based Splitting (Optional)
```
If invoice splitting is implemented:
1. Create an invoice
2. Look for "Add Campus" or "Split Invoice" option
3. Add another campus
4. Split the total amount:
   - Wallace: 50% = $2,440
   - Woodland: 50% = $2,440
5. Verify calculations
```

**Expected Result:**
- Invoice can be split across campuses
- Percentages/amounts calculate correctly
- PDF shows all campus allocations

---

## Phase 8: Role-Based Access Control 🔐

### Step 8.1: Logout
```
1. Click user menu or "Settings"
2. Find "Logout" button
3. Click "Logout"
```

**Expected Result:**
- Redirected to /login
- Session is cleared
- Cannot access /dashboard without logging in

### Step 8.2: Login as Regular User
```
1. Enter email: user@pelicanstate.pro
2. Complete Supabase authentication
3. You should be redirected to dashboard
```

**Expected Result:**
- Login successful
- Dashboard loads
- This user has limited permissions

### Step 8.3: Verify Campus Filtering
```
1. Create new work request
2. Click Campus dropdown
3. You should ONLY see: "Wallace"
4. Woodland and Paris should NOT appear
```

**Expected Result:**
- Campus dropdown restricted to Wallace only
- Cannot create work request for other campuses
- Cannot access other campus data

### Step 8.4: Verify Work Request Visibility
```
1. Go to work request list
2. You should see:
   - The Wallace work request you created earlier ✓
   - The Woodland work request you created as Owner ✗ (should NOT be visible)
3. No Woodland/Paris work requests in list
```

**Expected Result:**
- User sees only their assigned campus data
- No access to other campus information
- Row-level security (RLS) is working

### Step 8.5: Logout and Re-login as Owner
```
1. Logout
2. Login with owner@pelicanstate.pro
3. Verify you can see all campuses again
```

**Expected Result:**
- Full access restored
- All campuses visible
- All work requests visible

---

## Phase 9: PDF Generation 📄

### Step 9.1: Test All PDF Types
```
Generate and verify the following PDFs:

1. Estimate PDF:
   - Contains line items with quantities and rates
   - Shows total amount
   - Shows not-to-exceed amount
   - Has professional formatting
   - Includes company name/logo (if configured)

2. Invoice PDF:
   - Contains invoice number and date
   - Shows campus name
   - Shows funding source
   - Lists all line items
   - Shows total amount
   - Has professional formatting

3. Historic Report PDF (if applicable):
   - Shows materials log
   - Shows method notes
   - Shows architect guidance
   - Shows compliance notes
   - Has professional formatting
```

**Expected Result:**
- All PDFs download successfully
- PDFs open and display correctly
- No formatting errors
- All data is accurate

### Step 9.2: Verify PDF Formatting
```
For each PDF:
1. Open in PDF viewer
2. Check page margins
3. Verify fonts are readable
4. Check that all text is visible
5. Verify table formatting
6. Check logo placement (if applicable)
```

**Expected Result:**
- PDFs are well-formatted
- Professional appearance
- All content is legible
- No content cut off

---

## Phase 10: Form Validation & Error Handling ❌

### Step 10.1: Work Request Validation
```
Test Case 1: Empty Title
1. Create new work request
2. Leave Title field empty
3. Try to submit
Expected: Error message "Title is required"

Test Case 2: Invalid Hours
1. Enter "abc" in Estimated Hours field
2. Try to submit
Expected: Error message "Must be a number"

Test Case 3: Negative Values
1. Enter "-100" in Hourly Rate field
2. Try to submit
Expected: Error message "Must be positive"

Test Case 4: Missing Campus
1. Leave Campus dropdown empty
2. Try to submit
Expected: Error message "Campus is required"
```

**Expected Result:**
- All validations work as expected
- Error messages are clear
- Form prevents submission until fixed

### Step 10.2: Estimate Validation
```
Test Case 1: No Line Items
1. Open estimate form
2. Don't add any line items
3. Try to submit
Expected: Error message "At least one line item required"

Test Case 2: NTE Less Than Total
1. Add line items totaling $5,000
2. Set NTE to $4,000
3. Try to submit
Expected: Warning or error "Total exceeds NTE"
```

**Expected Result:**
- Validation prevents invalid estimates
- Clear error messages guide user

### Step 10.3: Invoice Validation
```
Test Case 1: No Work Request Selected
1. Open invoice form
2. Leave work request empty
3. Try to submit
Expected: Error message "Work request required"

Test Case 2: Missing Campus
1. Select work request
2. Leave campus empty
3. Try to submit
Expected: Error message "Campus required"
```

**Expected Result:**
- Invoice validation works
- User cannot submit incomplete invoices

---

## Phase 11: Data Persistence 💾

### Step 11.1: Refresh Test
```
1. Create a work request
2. Go to detail page
3. Press F5 to refresh
4. Verify all data is still there
5. Check timestamps are unchanged
```

**Expected Result:**
- Data persists after refresh
- No data loss
- Timestamps remain accurate

### Step 11.2: Session Persistence
```
1. Create an invoice
2. Logout
3. Login again with same user
4. Navigate to invoice list
5. Verify invoice still exists
```

**Expected Result:**
- Data survives logout/login cycle
- No loss of information
- Session handling is correct

### Step 11.3: Browser Storage
```
1. Open browser DevTools (F12)
2. Go to Application → LocalStorage
3. Look for app-related keys
4. Verify draft data is stored
5. Create a work request (don't submit)
6. Refresh page
7. Verify form data persists
```

**Expected Result:**
- Auto-draft data stored in browser
- Form recovers from draft on refresh
- No data loss on navigation

---

## Phase 12: Navigation & UI 🎨

### Step 12.1: Test All Sidebar Links
```
For each sidebar item:
1. Click the link
2. Verify page loads
3. Verify correct page is displayed
4. Verify sidebar highlights current page
5. Verify header updates (if applicable)

Sidebar Items (10 total):
- Dashboard
- Work Requests
- Estimates
- Invoices
- Schedules
- Analytics
- Members
- Settings
- Logout
```

**Expected Result:**
- All links navigate correctly
- Sidebar shows active state
- No broken pages

### Step 12.2: Responsive Design
```
Test on different screen sizes:

Mobile (375px):
1. Press F12 to open DevTools
2. Click device toggle (phone icon)
3. Select iPhone SE (375x667)
4. Verify:
   - Sidebar collapses or becomes mobile-friendly
   - Text is readable
   - Buttons are clickable (at least 44x44px)
   - No horizontal scroll

Tablet (768px):
1. Select iPad (768x1024)
2. Verify:
   - Layout adapts to medium width
   - Sidebar may show/hide with toggle
   - Table columns fit or scroll

Desktop (1440px):
1. Resize to 1440x900
2. Verify:
   - Full layout displays
   - Sidebar visible
   - Proper spacing
```

**Expected Result:**
- App is responsive at all screen sizes
- No layout breaks
- Usable on mobile, tablet, desktop
- Tailwind breakpoints work (sm:, md:, lg:)

### Step 12.3: Toast Notifications
```
Test toast messages:

1. Create a work request
2. Watch bottom-right corner
3. You should see: "Work request created successfully"
4. Toast should auto-dismiss after 3-5 seconds
5. Verify no other toasts appear during normal operation

Different toast types:
- Success (green) - on creation/update
- Error (red) - on validation failure
- Info (blue) - on navigation
```

**Expected Result:**
- Toasts appear for important actions
- Messages are clear and helpful
- Auto-dismiss works
- No spam of notifications

### Step 12.4: Button Interactions
```
Test button behavior:

1. Click any form submit button
2. Verify button shows loading state (optional)
3. Verify button is disabled during submission
4. Wait for response
5. Button returns to normal state

Test for all buttons:
- "New Work Request"
- "Submit" buttons
- "Download PDF"
- "Mark as Paid"
- Delete buttons (if present)
```

**Expected Result:**
- Buttons show appropriate loading/disabled states
- Users cannot double-submit
- Feedback is immediate

---

## 📊 Complete Test Results Table

| Phase | Test | Status | Duration | Notes |
|-------|------|--------|----------|-------|
| 1 | Auth & Dashboard | ⬜ | ~2 min | |
| 2 | Work Request Creation | ⬜ | ~3 min | |
| 3 | WR List & Detail | ⬜ | ~2 min | |
| 4 | Estimate Creation | ⬜ | ~4 min | |
| 5 | Invoice Creation | ⬜ | ~4 min | |
| 6 | Invoice List & Payment | ⬜ | ~2 min | |
| 7 | Multi-Campus | ⬜ | ~5 min | |
| 8 | RBAC | ⬜ | ~5 min | |
| 9 | PDF Generation | ⬜ | ~3 min | |
| 10 | Form Validation | ⬜ | ~5 min | |
| 11 | Data Persistence | ⬜ | ~3 min | |
| 12 | Navigation & UI | ⬜ | ~5 min | |

**Total Testing Time:** ~43 minutes

---

## ✅ Sign-Off

**Test Date:** _________________
**Tester:** _________________
**Build Version:** _________________

**Overall Result:**
- [ ] All phases passed ✅
- [ ] Some issues found ⚠️
- [ ] Critical issues found ❌

**Issues Found:**
(Document any bugs or unexpected behavior)

**Recommendations:**
(Improvements or optimizations needed)

**Sign-off:** _________________

---

## 🆘 Troubleshooting

### Issue: "Cannot login"
**Solution:**
1. Verify Supabase URL is correct: `https://tsiembsbxocszubdmrdi.supabase.co`
2. Check that test users exist in Supabase auth
3. Try signing up as new user instead
4. Check browser console for error messages

### Issue: "Work request doesn't save"
**Solution:**
1. Open DevTools (F12)
2. Check Network tab for failed requests
3. Verify Supabase connection in console
4. Check browser console for error messages
5. Verify `.env.local` has correct credentials

### Issue: "PDF doesn't download"
**Solution:**
1. Check browser console for errors
2. Verify browser allows downloads
3. Try different browser
4. Check Firewall/antivirus blocking

### Issue: "Forms show validation errors"
**Solution:**
1. Verify all required fields are filled
2. Check that values match expected format
3. Try clearing browser cache (Ctrl+Shift+Delete)
4. Check for JavaScript errors in console

### Issue: "Multi-campus selection not working"
**Solution:**
1. Verify you're logged in as Owner role
2. Check that all 3 campuses exist in database
3. Try creating new work request from scratch
4. Check browser console for errors

---

## 📞 Support

If you encounter issues during testing:
1. Check this troubleshooting section
2. Review browser console (F12) for errors
3. Check Supabase dashboard for database errors
4. Document the issue and steps to reproduce
5. Check the application logs

**Dev Server Logs:**
The dev server running on http://localhost:5174/ will show errors in the terminal.

