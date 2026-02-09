# Mobile Responsiveness Testing Guide

## Overview
Test the PM Dashboard on multiple screen sizes to ensure responsive design works correctly.

**Breakpoints to Test:**
- Mobile (375px) - Small phone
- Tablet (768px) - iPad/larger tablet
- Desktop (1440px) - Standard desktop
- Large Desktop (1920px) - Ultra-wide monitor

---

## Quick Reference: Tailwind Breakpoints

| Breakpoint | Width | Device Type | Use in CSS |
|---|---|---|---|
| Default | <640px | Mobile | Default styles |
| `sm:` | ≥640px | Small tablet | `sm:hidden`, `sm:flex` |
| `md:` | ≥768px | Tablet | `md:w-1/2`, `md:block` |
| `lg:` | ≥1024px | Desktop | `lg:flex`, `lg:w-1/3` |
| `xl:` | ≥1280px | Large desktop | `xl:grid-cols-4` |

---

## Testing Procedure

### Step 1: Open DevTools
```
1. Open browser: http://localhost:5174/
2. Press F12 to open Developer Tools
3. Click device toggle button (phone icon) in top-left of DevTools
4. DevTools should now show "Responsive Design Mode"
```

### Step 2: Test Each Breakpoint

---

## Mobile Testing (375px - iPhone SE)

### Device Settings
```
Width: 375px
Height: 667px
Device: iPhone SE or similar
Orientation: Portrait
```

### Step 2.1: Login Page
```
URL: http://localhost:5174/login

Checklist:
[ ] Logo is centered and visible
[ ] Email input field is full width (minus padding)
[ ] Password input is full width
[ ] "Sign In" button is full width (at least 48px tall)
[ ] Input fields have adequate padding (at least 12px)
[ ] No horizontal scroll
[ ] Text is readable (16px+ for inputs)
[ ] Focus states visible on inputs
[ ] Error messages display clearly
```

### Step 2.2: Dashboard Page
```
URL: http://localhost:5174/dashboard

Checklist:
[ ] Sidebar collapses or shows hamburger menu
[ ] Header is sticky or accessible
[ ] 4 status cards stack vertically (1 column)
[ ] Card text is readable
[ ] Buttons are minimum 44x44px (tap-friendly)
[ ] No horizontal scroll
[ ] Spacing between cards is adequate (16px+)
[ ] Brand logo appears (if present)
```

**Expected Layout:**
```
┌─────────────┐
│   Header    │  ← Should be sticky or visible
├─────────────┤
│   Card 1    │  ← Full width
├─────────────┤
│   Card 2    │  ← Full width
├─────────────┤
│   Card 3    │  ← Full width
├─────────────┤
│   Card 4    │  ← Full width
└─────────────┘
```

### Step 2.3: Work Request List
```
URL: http://localhost:5174/work-requests

Checklist:
[ ] Table converts to card view (if responsive)
[ ] OR table scrolls horizontally with visible scroll area
[ ] Card view shows: Title, Campus, Status, Date
[ ] Action buttons are tappable (44x44px minimum)
[ ] List items have adequate spacing (12px+ padding)
[ ] Search/filter controls are accessible
[ ] No text truncation without indication (...) 
[ ] Colors and contrast are readable
[ ] Page title is visible
```

**Expected Card Layout (if card view):**
```
┌─────────────────────────┐
│ Title: HVAC Replacement │
│ Campus: Wallace         │
│ Status: Intake          │
│ Date: 2024-02-08        │
│ [View] [Edit] [Delete]  │  ← Buttons
└─────────────────────────┘
```

### Step 2.4: Work Request Detail
```
URL: http://localhost:5174/work-requests/[id]

Checklist:
[ ] Form fields stack vertically
[ ] Labels are above inputs (not beside)
[ ] Input fields are full width (minus padding)
[ ] All form fields are easily tappable
[ ] Dropdown options are readable
[ ] Status dropdown is accessible
[ ] "Create Estimate" button is visible and tappable
[ ] Textarea has adequate height for text entry
[ ] All information is visible without much scrolling
[ ] Toast notifications don't cover buttons
```

### Step 2.5: Estimate Builder
```
URL: http://localhost:5174/estimates/new/[id]

Checklist:
[ ] Form fields stack vertically
[ ] "Add Line Item" button is tappable
[ ] Line items display in readable format
[ ] Line item inputs are full-width
[ ] Edit/delete buttons are tappable (44x44px)
[ ] Total calculation is visible
[ ] NTE field is accessible
[ ] "Download PDF" button is visible
[ ] "Submit" button doesn't get cut off
[ ] No horizontal scroll
[ ] Subtotals are visible for each line item
```

### Step 2.6: Invoice Builder
```
URL: http://localhost:5174/invoices/new

Checklist:
[ ] Work request dropdown is accessible
[ ] Campus dropdown is full width
[ ] Funding source dropdown is full width
[ ] Line items display in readable format
[ ] Notes field has adequate height
[ ] "Generate Invoice" button is visible
[ ] Total calculation is prominent
[ ] No horizontal scroll
[ ] All dropdowns open above input (not cut off bottom)
```

### Step 2.7: Invoice List
```
URL: http://localhost:5174/invoices

Checklist:
[ ] Converts to card view or horizontal scrolling
[ ] Invoice number, date, amount visible
[ ] Status badge is visible and readable
[ ] "View", "Edit", "Mark Paid" buttons are tappable
[ ] Search/filter controls are accessible
[ ] No critical information is hidden
```

### Mobile Testing Verdict
- [ ] All major pages tested
- [ ] No horizontal scroll (unless intentional)
- [ ] All buttons are tappable (44x44px minimum)
- [ ] Text is readable (16px+ for inputs)
- [ ] Form fields are easily usable
- [ ] Layout adapts well to 375px width

---

## Tablet Testing (768px - iPad)

### Device Settings
```
Width: 768px
Height: 1024px
Device: iPad or similar
Orientation: Portrait
```

### Step 3.1: Overall Layout
```
Checklist:
[ ] Sidebar may show or be collapsible
[ ] Main content area has adequate width
[ ] Content doesn't feel cramped
[ ] Two-column layouts may appear
[ ] Cards may be in 2x2 grid
[ ] Tables become more readable
[ ] All text is clearly readable
[ ] Buttons have adequate spacing
```

**Expected Dashboard Layout:**
```
┌──────────────────────────────────┐
│           Header                 │
├──────┬──────────────────────────┤
│ Nav  │  Card 1  │  Card 2       │  ← 2 columns
│      ├──────────┼───────────────┤
│      │  Card 3  │  Card 4       │  ← 2 columns
└──────┴──────────┴───────────────┘
```

### Step 3.2: Forms at Tablet Size
```
Checklist:
[ ] Form fields may appear in 2 columns
[ ] Labels are clear above fields
[ ] Input fields have adequate width
[ ] "Add" buttons are accessible
[ ] Form doesn't feel cramped
[ ] All fields are visible without excess scrolling
```

### Step 3.3: Tables at Tablet Size
```
Checklist:
[ ] Most columns are visible
[ ] Horizontal scroll may be needed for 5+ columns
[ ] Text is readable in table cells
[ ] Action buttons are visible and tappable
[ ] Column headers are clear
[ ] Sorting/filtering works smoothly
```

### Step 3.4: Navigation
```
Checklist:
[ ] Sidebar visibility is appropriate (may still collapse)
[ ] Breadcrumbs appear if implemented
[ ] Header navigation is accessible
[ ] Links are tappable (40x40px minimum)
[ ] Current page is highlighted
```

### Tablet Testing Verdict
- [ ] Layout adapts well to 768px width
- [ ] Content feels balanced, not cramped
- [ ] Tables and forms are usable
- [ ] No excessive scrolling needed
- [ ] Navigation is accessible

---

## Desktop Testing (1440px)

### Device Settings
```
Width: 1440px
Height: 900px
Device: Standard Desktop
Orientation: N/A
```

### Step 4.1: Overall Layout
```
Checklist:
[ ] Sidebar visible on left (may be collapsible)
[ ] Content takes up appropriate width
[ ] Content doesn't stretch too wide
[ ] Layout is balanced and not cramped
[ ] Sidebar width is appropriate (~250-300px)
[ ] Main content has readable line length (<900px if prose)
[ ] Whitespace is balanced
```

### Step 4.2: Dashboard at Desktop
```
Checklist:
[ ] 4 status cards in 2x2 grid
[ ] Cards have consistent sizing
[ ] Spacing between cards is adequate (20px+)
[ ] "New Work Request" button is visible
[ ] Sidebar navigation is fully visible
[ ] No content is cut off right edge
[ ] Sidebar is not too wide
```

### Step 4.3: Tables at Desktop
```
Checklist:
[ ] All important columns visible (no horizontal scroll)
[ ] Row height is adequate (40-50px)
[ ] Alternating row colors help readability (if used)
[ ] Action buttons are aligned
[ ] Table fits within viewport width
[ ] Column widths are proportional
[ ] Hover effects on rows (if implemented)
```

### Step 4.4: Forms at Desktop
```
Checklist:
[ ] Form fields may be 2-3 columns
[ ] Labels are beside or above fields (both work)
[ ] Input fields have ideal width (300-400px)
[ ] Line item table is readable
[ ] All form fields fit without excess scrolling
[ ] Submit button is aligned properly
[ ] Related fields are grouped visually
```

### Step 4.5: Sidebar
```
Checklist:
[ ] Sidebar width is 250-300px
[ ] Menu items have 40-50px height
[ ] Icons are clearly visible (20-24px)
[ ] Text labels are readable
[ ] Active item is highlighted
[ ] Hover effects work smoothly
[ ] Footer of sidebar is positioned well
```

### Desktop Testing Verdict
- [ ] Layout looks professional
- [ ] Content is well-balanced
- [ ] All columns and fields fit
- [ ] No horizontal scroll needed
- [ ] Whitespace is appropriate

---

## Large Desktop Testing (1920px)

### Device Settings
```
Width: 1920px
Height: 1080px
Device: Large Monitor
Orientation: N/A
```

### Step 5.1: Overall Appearance
```
Checklist:
[ ] Content doesn't stretch excessively
[ ] Large whitespace is not awkward
[ ] Sidebar may appear proportionally smaller
[ ] Maximum content width is respected (if implemented)
[ ] Layout still feels balanced
[ ] Not all pixels are used (some padding/max-width)
```

### Step 5.2: Forms and Tables
```
Checklist:
[ ] Forms don't use excessive width
[ ] Tables don't feel stretched
[ ] Line item count is visible without scroll
[ ] Multiple cards fit in grid (3-4 columns possible)
[ ] Still readable and not overwhelming
```

### Large Desktop Verdict
- [ ] Layout remains balanced
- [ ] Not stretched excessively
- [ ] Good use of space
- [ ] Professional appearance maintained

---

## Critical Responsive Tests

### Test 1: Sidebar Toggle (if implemented)
```
On mobile (375px):
1. Click hamburger menu (if present)
2. Sidebar should slide in from left
3. Content should be covered or pushed
4. Click outside sidebar to close
5. Sidebar should collapse

Expected: Clean animation, no layout breaks
```

### Test 2: Dropdown Menus
```
On all sizes:
1. Open any dropdown
2. Verify options don't extend beyond viewport
3. On mobile: Options open upward if near bottom
4. On desktop: Standard behavior
5. Click outside to close

Expected: Dropdowns fit within viewport
```

### Test 3: Modal Dialogs (if present)
```
On all sizes:
1. Open any modal/dialog
2. Verify modal is centered
3. On mobile: Modal has padding from edges (16px+)
4. On tablet/desktop: Modal has max-width
5. Close button is easily accessible

Expected: Modals are usable at all sizes
```

### Test 4: Toast Notifications
```
On all sizes:
1. Trigger success notification
2. Toast appears bottom-right corner
3. On mobile: Toast has bottom padding (safe area)
4. Toast doesn't cover critical buttons
5. Toast auto-dismisses properly

Expected: Toasts don't interfere with usage
```

### Test 5: Scrolling
```
On all sizes:
1. No unexpected horizontal scroll
2. Vertical scrolling works smoothly
3. Sticky header remains accessible
4. Sidebar doesn't scroll horizontally
5. Tables scroll horizontally (intentional)

Expected: Scroll behavior is natural
```

---

## Visual Regression Checklist

### Colors & Contrast
```
[ ] Text contrast meets WCAG AA standard (4.5:1 for normal text)
[ ] Form inputs have visible focus states
[ ] Buttons are visually distinct
[ ] Links are underlined or colored distinctly
[ ] Error states are clearly visible
[ ] Disabled state is clearly visible
```

### Typography
```
[ ] Body text is 14-16px minimum
[ ] Headings are appropriately sized
[ ] Line height is adequate (1.5x for body text)
[ ] Font weights are distinct
[ ] Monospace fonts used for data/codes
[ ] Text is not italicized unless intentional
```

### Spacing
```
[ ] Padding inside containers is consistent (8px/16px)
[ ] Margins between elements are consistent
[ ] No elements touching viewport edges
[ ] Adequate spacing around buttons
[ ] White space aids readability
```

### Icons
```
[ ] Icons are at least 20x20px
[ ] Icons have clear meaning
[ ] SVG icons render crisply
[ ] Icon colors have adequate contrast
[ ] Hover states on icon buttons
```

---

## Performance on Mobile

### Page Load
```
[ ] Dashboard loads in <3 seconds on 3G
[ ] Sidebar appears immediately
[ ] Content isn't blocked by loading states
[ ] Images load progressively
[ ] No layout shift as images load
```

### Interaction
```
[ ] Buttons respond immediately to tap
[ ] Form submission doesn't freeze UI
[ ] Scrolling is smooth (60fps if possible)
[ ] Animations don't cause jank
[ ] No lag when opening dropdowns
```

### Mobile-Specific Issues
```
[ ] Zoom works (not disabled)
[ ] Viewport meta tag is set
[ ] Touch targets are 44x44px minimum
[ ] No horizontal scroll from content
[ ] iOS safe area respected (notch handling)
```

---

## Testing Results Summary

| Screen | Pass | Fail | Notes |
|--------|------|------|-------|
| 375px Mobile | ⬜ | | |
| 768px Tablet | ⬜ | | |
| 1440px Desktop | ⬜ | | |
| 1920px Large | ⬜ | | |

### Overall Verdict
- [ ] All breakpoints pass
- [ ] Minor issues (non-critical)
- [ ] Major issues found
- [ ] Needs redesign

### Issues Found
(List any responsive design issues)

### Recommendations
(Improvements needed)

---

## How to Test Specific Breakpoints

### Using Tailwind Classes
Check your CSS for responsive classes:
```
Default: w-full h-screen
sm: sm:w-1/2
md: md:flex md:w-1/3
lg: lg:grid-cols-4
xl: xl:grid-cols-6
```

### Common Responsive Patterns to Test

**1. Sidebar (Collapsible on Mobile)**
```
Mobile: Hidden or off-canvas
Tablet: May be collapsed
Desktop: Always visible
```

**2. Grid/Columns**
```
Mobile: 1 column (100% width)
Tablet: 2 columns (50% width each)
Desktop: 3-4 columns
```

**3. Table (Converts to Cards)**
```
Mobile: Card view or vertical scroll
Tablet: Limited columns visible
Desktop: All columns visible
```

**4. Form (Multi-column)**
```
Mobile: Single column (full width)
Tablet: 2 columns
Desktop: 2-3 columns
```

---

## Sign-Off

**Test Date:** _________________
**Tester:** _________________

**Responsive Design Passes:** ✅ / ❌

**Notes:**
_____________________________________________________________

**Approved By:** _________________

