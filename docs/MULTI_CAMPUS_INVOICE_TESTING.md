# Multi-Property Invoice Splitting - Testing Guide

## Overview
The PM Dashboard supports creating invoices that span multiple properties. When work requests from different properties are selected, the system automatically splits the invoice by property and funding source.

---

## Feature Description

### How It Works
1. **Select Work Requests** - Choose completed work requests from multiple properties
2. **Add Line Items** - Assign each line item to a specific work request
3. **Auto-Split** - System groups items by property
4. **Create Invoices** - Separate invoice generated for each property
5. **Funding Source** - Each property uses its own funding source automatically

### Example
```
Input:
- Work Request 1: Wallace Property (Funding: State Budget A)
- Work Request 2: Woodland Property (Funding: State Budget B)
- Work Request 3: Wallace Property (Funding: State Budget A)

Output:
- Invoice 1: Wallace (Items 1 & 3, $4,880, State Budget A)
- Invoice 2: Woodland (Item 2, $5,200, State Budget B)
```

---

## Pre-Test Setup

### Required Test Data
1. **3 Work Requests (minimum)** - Different properties
   - WR1: Wallace Property
   - WR2: Woodland/Laplace Property
   - WR3: Paris Property

2. **3 Estimates** - One for each work request
   - Should have completed estimates ready to invoice

3. **Status:** All work requests must be "Complete" status
   - Change status in work request detail page

### Setup Steps
```
1. Create 3 work requests (different properties)
2. For each work request:
   - Create estimate with line items
   - Change status to "Complete"
3. Verify all 3 appear in invoice form dropdown
```

---

## Test Scenarios

### Scenario 1: Single Property Invoice (Baseline)

**Test Objective:** Verify invoice creation works for single property (baseline test)

#### Test Steps
```
1. Navigate to /invoices/new
2. Select work request dropdown
3. Check "WR-001 - HVAC Replacement (Wallace)"
4. Click "Add Item"
5. Fill line item:
   - Description: "Labor - HVAC"
   - Location: "Room 101"
   - Amount: $680
6. Click "Preview PDF"
   - Verify PDF shows: Property: Wallace, Funding: State Budget A
7. Click "Create & Submit Invoice(s)"
8. Verify:
   - Invoice created successfully (toast message)
   - Invoice number: INV-001 (or similar)
   - Status: Submitted
   - Property: Wallace
   - Funding Source: State Budget A
```

**Expected Result:**
- ✅ Single invoice created
- ✅ Property info correct
- ✅ Funding source correct
- ✅ PDF shows correct information

---

### Scenario 2: Two Properties Invoice Splitting

**Test Objective:** Verify invoices are correctly split across 2 properties

#### Test Steps
```
1. Navigate to /invoices/new
2. Select multiple work requests:
   - Check "WR-001 - HVAC Replacement (Wallace)"
   - Check "WR-002 - Roof Repair (Woodland)"
3. Click "Add Item"
4. Fill Line Item 1:
   - Description: "Labor - HVAC"
   - Location: "Room 101, Wallace"
   - Work Request: WR-001
   - Amount: $680
5. Click "Add Item" again
6. Fill Line Item 2:
   - Description: "Labor - Roof Repair"
   - Location: "Roof, Woodland"
   - Work Request: WR-002
   - Amount: $1,200
7. Verify Invoice Summary shows:
   ┌─────────────────────────────────┐
   │ Invoice Summary by Property       │
   ├─────────────────────────────────┤
   │ Wallace       | State Budget A   │
   │ Woodland      | State Budget B   │
   └─────────────────────────────────┘
8. Click "Create & Submit Invoice(s)"
```

**Expected Results:**
- ✅ 2 invoices created (one per property)
- ✅ Invoice 1: Wallace, $680, State Budget A
- ✅ Invoice 2: Woodland, $1,200, State Budget B
- ✅ Both show "Submitted" status
- ✅ Toast shows success message
- ✅ Both invoices appear in invoice list

**Verification Steps:**
```
1. Go to /invoices
2. Verify both invoices appear in list:
   - INV-001: $680, Wallace, Submitted
   - INV-002: $1,200, Woodland, Submitted
3. Click each to verify details:
   - Property correct
   - Funding source correct
   - Line items correct
4. Download PDFs for both and verify they show correct property info
```

---

### Scenario 3: Three Properties Invoice Splitting

**Test Objective:** Verify splitting works correctly with 3 properties

#### Test Steps
```
1. Navigate to /invoices/new
2. Select all 3 work requests:
   - WR-001 (Wallace)
   - WR-002 (Woodland)
   - WR-003 (Paris)
3. Add 3 line items:
   
   Item 1:
   - Description: "Electrical Work - Wallace"
   - Location: "Building A"
   - Work Request: WR-001
   - Amount: $2,400
   
   Item 2:
   - Description: "Plumbing Work - Woodland"
   - Location: "Building B"
   - Work Request: WR-002
   - Amount: $1,800
   
   Item 3:
   - Description: "HVAC Work - Paris"
   - Location: "Building C"
   - Work Request: WR-003
   - Amount: $3,100

4. Verify summary shows all 3 properties:
   ┌─────────────────────────────────┐
   │ Wallace       | State Budget A   │
   │ Woodland      | State Budget B   │
   │ Paris         | State Budget C   │
   └─────────────────────────────────┘

5. Click "Create & Submit Invoice(s)"
```

**Expected Results:**
- ✅ 3 invoices created
- ✅ INV-001: Wallace, $2,400
- ✅ INV-002: Woodland, $1,800
- ✅ INV-003: Paris, $3,100
- ✅ Total: $7,300 across all invoices
- ✅ Each has correct funding source
- ✅ Each shows "Submitted" status

**Verification:**
```
1. Go to /invoices - verify 3 invoices
2. Filter by property (if available):
   - Wallace: 1 invoice
   - Woodland: 1 invoice
   - Paris: 1 invoice
3. Verify totals match expectations
4. Verify funding sources are different for each
```

---

### Scenario 4: Multiple Line Items, Same Property

**Test Objective:** Verify multiple items from same property are combined in one invoice

#### Test Steps
```
1. Navigate to /invoices/new
2. Select work request:
   - WR-001 (Wallace)
3. Add 4 line items from same work request:
   
   Item 1: Labor - $500
   Item 2: Materials - $1,200
   Item 3: Equipment Rental - $300
   Item 4: Travel - $100
   
   Total: $2,100

4. Click "Create & Submit Invoice(s)"
```

**Expected Results:**
- ✅ Only 1 invoice created (same property)
- ✅ All 4 line items appear in invoice
- ✅ Total: $2,100
- ✅ Property: Wallace
- ✅ Funding: State Budget A

---

### Scenario 5: Multiple Items, Split Across Properties

**Test Objective:** Verify items from same work request distribute to correct property

#### Test Steps
```
1. Navigate to /invoices/new
2. Select multiple work requests:
   - WR-001 (Wallace) - 3 items
   - WR-002 (Woodland) - 2 items
   - WR-001 (Wallace) - 2 more items

3. Add items with this distribution:
   
   Items 1-3 → WR-001 (Wallace):
   - Item 1: Labor - $800
   - Item 2: Materials - $1,500
   - Item 3: Equipment - $300
   
   Items 4-5 → WR-002 (Woodland):
   - Item 4: Labor - $600
   - Item 5: Materials - $1,200
   
   Items 6-7 → WR-001 (Wallace):
   - Item 6: Cleanup - $200
   - Item 7: Inspection - $150

4. Click "Create & Submit Invoice(s)"
```

**Expected Results:**
- ✅ 2 invoices created
- ✅ Invoice 1 (Wallace):
  - Items: 1, 2, 3, 6, 7
  - Total: $3,150
  - Funding: State Budget A
- ✅ Invoice 2 (Woodland):
  - Items: 4, 5
  - Total: $1,800
  - Funding: State Budget B
- ✅ Combined Total: $4,950

**Verification:**
```
1. Navigate to invoice list
2. Filter by Wallace:
   - Should show 1 invoice with $3,150
3. Filter by Woodland:
   - Should show 1 invoice with $1,800
4. Click each invoice and verify line items match
```

---

### Scenario 6: PDF Download for Multi-Property

**Test Objective:** Verify PDF preview shows correct property info before creation

#### Test Steps
```
1. Navigate to /invoices/new
2. Select 2 work requests (different properties)
3. Add 2 line items (one per property)
4. Click "Preview PDF" button
5. Verify PDF downloads:
   - Filename: "Invoice-Preview-[Property].pdf"
   - OR shows preview of first property
```

**Expected Results:**
- ✅ PDF generates successfully
- ✅ PDF shows correct property
- ✅ PDF shows correct funding source
- ✅ Line items are accurate
- ✅ Total amount is correct

---

### Scenario 7: Role-Based Access with Multi-Property

**Test Objective:** Verify limited users can only see/split their assigned property

#### Test Steps
```
1. Logout as owner
2. Login as user@pelicanstate.pro (User role, Wallace only)
3. Navigate to /invoices/new
4. Check work request dropdown
5. Should ONLY see:
   - WR-001 (Wallace) ✅
   - NOT WR-002 (Woodland)
   - NOT WR-003 (Paris)
6. Create invoice with only Wallace item
7. Logout and login as owner again
8. Verify user-created invoice exists for Wallace only
```

**Expected Results:**
- ✅ Limited user sees only assigned property work requests
- ✅ Cannot select other property work requests
- ✅ Cannot create multi-property invoices (RLS enforced)
- ✅ Invoice only created for assigned property

---

### Scenario 8: Invoice Payment Tracking (Multi-Property)

**Test Objective:** Verify each split invoice can be marked paid independently

#### Test Steps
```
1. Create multi-property invoice (2 properties)
2. Go to /invoices
3. Find Invoice 1 (Wallace, $2,400)
4. Click on it
5. Click "Mark as Paid"
6. Verify status: Paid ✅
7. Go back to list
8. Find Invoice 2 (Woodland, $1,800)
9. Verify status still: Submitted
10. Click on Invoice 2
11. Click "Mark as Paid"
12. Verify status: Paid ✅
```

**Expected Results:**
- ✅ Each invoice tracked independently
- ✅ Can mark one as paid while others pending
- ✅ Payment dates recorded correctly
- ✅ List view shows correct status for each

---

## Edge Cases & Validation

### Test Case 1: No Line Items
```
Steps:
1. Select 2 work requests (different properties)
2. Don't add any line items
3. Try to click "Create & Submit"

Expected: Button disabled or error message shows
Message: "Add at least one line item"
```

### Test Case 2: Empty Property
```
Steps:
1. Select work request
2. Add line item but leave "Work Request" blank
3. Try to submit

Expected: Error message about missing work request
Message: "Line item X: Work request required"
```

### Test Case 3: Negative Amount
```
Steps:
1. Add line item
2. Enter negative amount (-100)
3. Try to submit

Expected: Error message
Message: "Amount must be greater than 0"
```

### Test Case 4: Duplicate Line Items
```
Steps:
1. Add same line item twice
2. Submit

Expected: Both items appear in correct invoices
Calculation: Total includes both line items
```

---

## PDF Verification Checklist

For each split invoice, verify PDF contains:

```
☐ Correct invoice number (INV-001, INV-002, etc.)
☐ Correct property name
☐ Correct funding source for property
☐ All line items for that property
☐ Correct total for that property
☐ Invoice date
☐ Professional formatting
☐ Readable text
☐ No truncated content
☐ Company branding (if configured)
```

### Example: 2-Property Invoice PDFs

**Invoice 1 (PDF for Wallace):**
```
┌─────────────────────────────┐
│ PELICAN STATE PM DASHBOARD  │
│                             │
│ Invoice Number: INV-001     │
│ Date: February 8, 2024      │
│ Property: Wallace             │
│ Funding Source: Budget A    │
├─────────────────────────────┤
│ Description    | Amount     │
├─────────────────────────────┤
│ Labor          | $680       │
│ Materials      | $4,200     │
├─────────────────────────────┤
│ TOTAL          | $4,880     │
└─────────────────────────────┘
```

**Invoice 2 (PDF for Woodland):**
```
┌─────────────────────────────┐
│ PELICAN STATE PM DASHBOARD  │
│                             │
│ Invoice Number: INV-002     │
│ Date: February 8, 2024      │
│ Property: Woodland (Laplace)  │
│ Funding Source: Budget B    │
├─────────────────────────────┤
│ Description    | Amount     │
├─────────────────────────────┤
│ Labor          | $1,200     │
│ Materials      | $4,000     │
├─────────────────────────────┤
│ TOTAL          | $5,200     │
└─────────────────────────────┘
```

---

## Test Results Table

| Scenario | Test | Status | Notes |
|----------|------|--------|-------|
| 1 | Single Property | ⬜ | |
| 2 | Two Properties | ⬜ | |
| 3 | Three Properties | ⬜ | |
| 4 | Same Property Multiple | ⬜ | |
| 5 | Split Distribution | ⬜ | |
| 6 | PDF Download | ⬜ | |
| 7 | RBAC Limited User | ⬜ | |
| 8 | Payment Tracking | ⬜ | |
| EC1 | No Line Items | ⬜ | |
| EC2 | Empty Work Request | ⬜ | |
| EC3 | Negative Amount | ⬜ | |
| EC4 | Duplicate Items | ⬜ | |

---

## Database Verification

After creating multi-property invoices, verify in Supabase:

### Check Invoices Table
```sql
SELECT 
  id,
  invoice_number,
  property_id,
  funding_source,
  total_amount,
  status
FROM invoices
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

Expected: Multiple invoices with different property_id values

### Check Line Items per Invoice
```sql
SELECT 
  id,
  invoice_number,
  jsonb_array_length(line_items) as item_count,
  total_amount
FROM invoices
WHERE created_at > NOW() - INTERVAL '1 hour';
```

Expected: Line items distributed by property

---

## Performance Considerations

### Large Multi-Property Invoices
```
Test: Create invoice with 50+ line items across 3 properties

Performance Checklist:
[ ] Form loads in <2 seconds
[ ] Adding items doesn't lag
[ ] Preview PDF generates in <3 seconds
[ ] Invoice creation completes in <5 seconds
[ ] No timeout errors
```

---

## Sign-Off

**Test Date:** _________________
**Tester:** _________________

**All Tests Passed:** ✅ / ❌

**Issues Found:**
(List any failures or unexpected behavior)

**Notes:**
_____________________________________________________________

**Approved By:** _________________

