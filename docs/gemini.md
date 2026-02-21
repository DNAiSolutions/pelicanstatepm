# 📄 Project Constitution: Pelican State Project Hub

## 🎯 Project Mission
Build a **construction/facilities PM platform** for clients managing multiple properties with different funding sources. Replace scattered email/paper chaos with a **single calm source of truth** for tracking work from request → approval → scheduling → completion → invoicing.

## 🏗️ Architectural Invariants
* **B.L.A.S.T. / A.N.T. Protocol** is active
* **Data-First Rule**: All schemas must be defined before coding
* **Single Source of Truth**: All decisions live in the system, not in email threads
* **Strict Status Gates**: Work cannot progress without explicit approval
* Local files in `.tmp/`, global payloads in cloud (Lovable Cloud)

## 📊 Data Schemas

### Core Entities

#### 1. WorkRequest
```json
{
  "id": "string (UUID)",
  "requestNumber": "string (auto-generated, e.g., WR-2024-001)",
  "property": "enum: Property_A | Property_B | Property_C (REQUIRED)",
  "property": "string (building name, REQUIRED)",
  "isHistoric": "boolean (REQUIRED)",
  "category": "enum: SmallTask | EventSupport | ConstructionProject",
  "title": "string",
  "description": "string",
  "priority": "enum: Low | Medium | High | Urgent",
  "desiredDate": "datetime",
  "status": "enum (see WorkRequestStatus)",
  "requestedBy": "User",
  "requestedAt": "datetime",
  "attachments": "File[]",
  "fundingSource": "string (property-based default or custom)"
}
```

#### 2. WorkRequestStatus (State Machine)
```
Intake → Scoping → EstimateDrafting → AwaitingApproval → 
Approved → Scheduled → InProgress → Blocked → ReadyForReview → 
Completed → Invoicing → Paid → Closed
```

**Rules:**
- Cannot move to `Scheduled` without `Approved` status
- Cannot move to `Approved` without estimate + client approval
- `Blocked` requires: reason + owner + next step

#### 3. Estimate
```json
{
  "id": "string",
  "workRequestId": "string (FK)",
  "lineItems": [
    {
      "description": "string",
      "laborHours": "number",
      "laborRate": "number",
      "materials": "number",
      "subtotal": "number"
    }
  ],
  "total": "number",
  "notToExceed": "boolean",
  "attachments": "File[] (vendor quotes, notes)",
  "status": "enum: Draft | Submitted | Approved | ChangesRequested",
  "approvedBy": "User",
  "approvedAt": "datetime"
}
```

#### 4. HistoricDocumentation (for isHistoric = true)
```json
{
  "workRequestId": "string (FK)",
  "photosRequired": {
    "before": "File[]",
    "during": "File[]",
    "after": "File[]"
  },
  "materialsLog": [
    {
      "product": "string",
      "spec": "string",
      "supplier": "string",
      "color": "string",
      "fasteners": "string (e.g., type of nails)"
    }
  ],
  "methodNotes": "string (how installed / why)",
  "architectGuidance": "File[]",
  "permits": "File[]",
  "changeLog": [
    {
      "change": "string",
      "approvedBy": "User",
      "approvedAt": "datetime"
    }
  ]
}
```

#### 5. Invoice
```json
{
  "id": "string",
  "invoiceNumber": "string (auto-generated)",
  "workRequestIds": "string[] (FK)",
  "property": "string",
  "fundingSource": "string",
  "lineItems": [
    {
      "description": "string",
      "location": "string",
      "amount": "number"
    }
  ],
  "total": "number",
  "status": "enum: Draft | Submitted | ApprovedFriday | Paid | Closed",
  "submittedAt": "datetime",
  "approvedAt": "datetime",
  "paidAt": "datetime",
  "attachments": "File[]"
}
```

#### 6. Schedule
```json
{
  "workRequestId": "string (FK)",
  "startDate": "datetime",
  "endDate": "datetime",
  "assignee": "User",
  "milestones": [
    {
      "name": "string",
      "dueDate": "datetime",
      "status": "enum: Pending | InProgress | Complete"
    }
  ]
}
```

#### 7. WeeklyUpdate (for visibility)
```json
{
  "workRequestId": "string (FK)",
  "progress": "string",
  "blockers": "string",
  "nextSteps": "string",
  "needsFromClient": "string",
  "createdAt": "datetime"
}
```

### Supporting Entities

#### 8. Property
```json
{
  "id": "string",
  "name": "enum: Property_A | Property_B | Property_C",
  "defaultFundingSource": "string",
  "activePrograms": "boolean"
}
```

#### 9. RatesAndServices
```json
{
  "serviceType": "enum: SiteWalkthrough | HandyworkLabor | ProjectManagement | Emergency",
  "rate": "number",
  "unit": "enum: Hourly | Fixed | NotToExceed",
  "description": "string"
}
```

## 📜 Behavioral Rules

### Client Requirements (from call transcript)
1. **No surprise work**: Work cannot start without quote → approval → schedule
2. **Invoices must be detailed**: What work, which location, which property/funding source
3. **One accountable counterparty**: Pelican State invoices client; subs paid internally
4. **Historic sites = audit-ready documentation**: Materials, methods, photos, change logs
5. **Visibility into schedule + delays + blockers** (especially for construction projects)
6. **Communication**: Threaded updates inside work items (not just email)
7. **Weekly digests**: Auto-summary for stakeholders
8. **Split invoicing**: Support separate invoices per property OR one invoice with sections

### System Behavior
1. **Calm + Controlled**: System feels like a "calm operations desk"—quiet confidence
2. **Prioritize reliability over speed**
3. **Never guess at business logic**
4. **Update SOPs before code changes**
5. **Motion as kindness**: Soft fades (200–300ms), subtle highlights for completed fields

### UI/UX Principles
- **Typography**: Clear hierarchy, generous line-height (≥ 1.5)
- **Color**: Neutral background, one confident primary, semantic status chips (AA contrast)
- **Layout**: 8pt grid, more whitespace on client-facing views
- **Voice**: "Accountable + kind" (e.g., "Nothing starts without approval—no surprises")
- **Accessibility**: Keyboard navigable, WCAG AA minimum

## 🛠️ Maintenance Log
- **2026-02-08**: Project initialized (Protocol 0)
- **2026-02-08**: Phase 1 (Blueprint) started
- **2026-02-08**: Call transcript analyzed; data schemas defined
