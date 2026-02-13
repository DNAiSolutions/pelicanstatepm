# Contracting, Permits, Historic Compliance, and Accounting Integrations for a Renovation GC Management System

## Executive summary

A renovation GC system that is “millions-scale ready” needs **one consistent operating backbone** that flexes by contract type, permitting complexity, and historic-review requirements—without turning each job into a bespoke workflow. The most reliable pattern is to treat **contracts, approvals, and cost/billing artifacts as first-class objects** whose state transitions are permissioned, auditable, and mapped to accounting transactions. This mirrors how the industry’s most widely used contract administration form families formalize relationships (general conditions), owner-approved scope/time/cost changes (change orders), and progress payment documentation (pay applications with schedule of values). citeturn4search1turn4search8turn4search2turn4search15

Key recommendations for Pelican State’s launch design:

- **Contract engine at launch:** Support **T&M, fixed price (stipulated sum), cost-plus (with/without GMP), retainer, and milestone** as selectable contract types, modeled with clear billing modes and approval gates. For fixed price and GMP work, ensure the platform supports **schedule of values → progress billing** since it is a common control structure for payment review. citeturn0search0turn0search1turn0search5turn4search2turn4search15
- **AI “recommend + explain + let humans decide”:** AI can suggest contract type and billing cadence, but the system must require **human review and explicit override controls**. NIST stresses AI risk management is not a checklist and should be infused across governance, mapping context, measuring performance, and managing risks. citeturn7view1turn1search5turn1search8
- **Permit register:** Implement as an **optional module for every work request**, but with “smart defaults” for construction projects: jurisdiction + code/version + reviewer + inspections + attachments + notifications. Louisiana adopts the **2021 International Building Code** and **2021 International Residential Code** under its Uniform Construction Code, so your permit model must store code set/version for compliance and auditability. citeturn8view1turn2search2turn2search6
- **Historic mode:** Trigger via a **project flag** set by client or client-designated contact; store the designated reviewer name/role; enforce evidence gates (materials/methods/photos) and sign-offs (architect, SHPO, or designated approver). Secretary of the Interior standards explicitly emphasize repair over replacement where possible, and require substantiation of replacements with documentary/physical/pictorial evidence—exactly the kind of evidence gating your system should enforce. citeturn3search0turn3search1turn3search2turn3search21
- **Accounting & payments:** For Pelican State, the lowest-risk architecture is a **single-writer pattern per financial object**: your app originates operationally-approved invoices (and pushes them into QuickBooks Online), while QuickBooks remains the accounting system of record; payments are processed via a payment provider (Stripe or Authorize.Net) and then posted to QuickBooks as Receive Payment linked to the invoice. This approach aligns with Intuit’s OAuth2 model, sync constraints (SyncToken), and “stay in sync” mechanisms (webhooks + CDC). citeturn1search2turn5search4turn5search1turn5search2turn1search3turn6search4turn6search1

## Contract types and billing methods design

### Comparison table of contract types and billing methods

| Contract type (launch) | Simple invoice | Time & Materials billing | Milestone billing | Progress billing (SOV / pay app) | Typical change control intensity |
|---|---:|---:|---:|---:|---|
| Time & Materials (T&M) | Sometimes | **Primary** | Sometimes | Rare | Medium (scope drift + cap controls) |
| Fixed-price (stipulated sum) | Sometimes | No | Sometimes | **Common** (esp. larger jobs) | **High** (COs drive margin) |
| Cost-plus (no GMP) | Sometimes | Sometimes | Sometimes | **Common** | Medium–High (cost documentation) |
| Cost-plus with GMP | Sometimes | Sometimes | Sometimes | **Common** | **High** (GMP + CO alignment) |
| Retainer (service agreement) | **Primary** | Sometimes | Sometimes | Rare | Medium (scope boundary controls) |
| Milestone-based (deliverables) | Sometimes | No | **Primary** | Sometimes | High (milestone definition disputes) |

Why “progress billing + schedule of values” belongs in “common”: AIA’s pay app structure (G702/G703) and schedule of values guidance are widely used constructs for tracking percent complete, retainage, and payment requests—especially for fixed price and GMP cost-plus work. citeturn4search2turn0search12turn4search15turn4search8

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["AIA G702 Application and Certificate for Payment sample form","AIA G703 Continuation Sheet schedule of values sample","construction schedule of values pay application example"],"num_per_query":1}

### Contract type specifications for the software

Below, each contract type is defined as a **configuration of billing logic + required fields + approval gates + accounting impacts**, not as a separate workflow. This is what keeps a single product scalable.

#### Time & Materials (T&M)

**Billing methods:** T&M invoices (weekly/biweekly/monthly); optionally “not-to-exceed” (NTE) caps and/or milestone invoicing for discrete phases.

**Typical use-cases:** High-uncertainty renovation repairs; discovery-driven scopes; emergency work where defining a fixed scope is impractical up front (AI should flag when scope volatility is high). This aligns with GAO’s emphasis that reliable estimates require documenting assumptions and updating with actuals—T&M effectively acknowledges uncertainty and relies on strong actual tracking. citeturn7view0turn1search4

**Required data fields (minimum viable):**
- Rate table: labor classes (crew lead, carpenter, PM, etc.) with bill rates; equipment rates; material markup rules.
- Daily/shift time entries: person, role, date, hours, billable/nonbillable, work performed notes.
- Materials: item, qty, unit cost, markup, receipts.
- Cap fields (optional): NTE amount, allowed variance, cap approval contact.

**Approval gates:**
- Estimate/authorization: “Proceed T&M” approval (with rate sheet accepted).
- Cap gate: NTE change requires explicit approval before exceeding.
- Invoice gate: internal review → client approval or “sent” state (depending on your governance model).

**Accounting impacts in QuickBooks:**
- Invoice lines map to labor/services and materials items; revenue recognized as invoiced; costs appear in job costing if bills/expenses are coded to the job.
- Strong linkage between time entries/material receipts in your system and invoice line provenance improves auditability and dispute resolution (especially if client is sensitive to transparency).

**Sample user story:**  
As an estimator, I want to convert a highly uncertain opportunity into a T&M contract with an optional NTE cap so that the team can start work while controlling client risk and ensuring every billed hour/material is traceable to a dated field log.

#### Fixed-price (stipulated sum)

**Billing methods:** milestone billing or progress billing; sometimes single invoice at completion for small scopes. AIA’s A101 is explicitly structured for stipulated sum agreements and is intended for use with general conditions (A201). citeturn0search0turn4search1

**Typical use-cases:** Scope is clear and measurable; drawings/specs are stable; client demands price certainty.

**Required data fields:**
- Contract sum; alternates; allowances; exclusions; a baseline scope statement.
- If progress billed: schedule of values (SOV) line items with planned values, retainage %, stored materials rules. AIA guidance frames SOV as a structured breakdown to support payment processing and progress tracking. citeturn4search15turn4search2
- Change order baseline: original contract + CO ledger.

**Approval gates:**
- Estimate approval → contract execution (signed).
- SOV approval (owner/client + internal controller).
- Pay app cycle: percent complete updates → internal review → owner/architect certification (where applicable) before “application submitted.” AIA pay app instructions describe retainage, previous payments, and payment request structure. citeturn4search2turn0search12
- Change order gate: no scope change without executed change instrument.

**Accounting impacts in QuickBooks:**
- Invoice schedule aligns to SOV; retainage may require separate tracking depending on accounting setup.
- Change orders adjust contract value; progress invoices should reflect revised contract sum and prior billings.

**Sample user story:**  
As a PM, I want progress billing to be generated from an approved SOV and updated percent-complete so that pay apps are consistent, auditable, and automatically reflect approved change orders.

#### Cost-plus (without GMP)

**Billing methods:** progress billing (typical) or periodic cost reimbursement invoices.

**Typical use-cases:** Renovations with evolving design; owner wants transparency and reimbursable cost control; project not suited to competitive bid. AIA A103 describes cost of the work plus a fee where cost is not fully known at commencement and is not intended for competitive bidding. citeturn0search5

**Required data fields:**
- Fee structure: fixed fee or percentage; reimbursable categories; non-reimbursable categories.
- Cost documentation: vendor invoices/bills, receipts, time logs.
- Audit rights / substantiation fields (in practice: attachments + coded cost categories).

**Approval gates:**
- Cost policy acceptance by client (what counts as cost of the work).
- Internal review for allowability before billing.
- Change controls for scope/time even if cost is reimbursable (schedule and scope still matter).

**Accounting impacts in QuickBooks:**
- Requires disciplined coding of bills/expenses to project/job and cost codes; invoices may include fee lines and reimbursable passthrough lines.

**Sample user story:**  
As an accountant, I want every billed reimbursable cost to be linked to a source document and cost category so that owner audits can be satisfied and disputes can be resolved quickly.

#### Cost-plus with GMP

**Billing methods:** progress billing is common; milestones can supplement specific deliverables.

**Typical use-cases:** Larger renovations where scope evolves but owner wants a cost ceiling; aligns to AIA A102 (cost of work plus fee with GMP). citeturn0search1

**Required data fields:**
- GMP value; contingency structure (owner contingency vs contractor contingency); shared savings rules (if any).
- Same cost documentation as cost-plus; plus stronger CO integration because GMP must be revised only via approved changes.

**Approval gates:**
- GMP establishment gate: requires review of estimate basis, risk, contingencies.
- Change order gate: AIA change order documentation is explicitly used to implement changes agreed to by owner/contractor/architect, including adjustments to sum and time. citeturn4search8turn4search0
- Pay app gate: percent complete + cost-to-date validation against GMP and CO ledger.

**Accounting impacts in QuickBooks:**
- Requires continuous comparison of committed + actual costs against GMP; if you show client portal “budget consumption,” you must distinguish “approved changes” vs “pending changes.”

**Sample user story:**  
As a PM, I want the system to prevent billing beyond the current GMP unless a change order revises the GMP so that cost ceilings remain enforceable and visible.

#### Retainer

**Billing methods:** simple invoice on cadence (monthly/quarterly); optionally applied credits against T&M or fixed-price work orders.

**Typical use-cases:** Ongoing facilities maintenance; multi-site clients; “on-call” renovation support.

**Required data fields:**
- Retainer amount; period; included services; rollover rules; rates for out-of-scope work; usage tracking (hours/costs applied against retainer).

**Approval gates:**
- Retainer agreement approval/signature.
- Monthly reconciliation review: retainer drawdown vs remaining balance, and client verification.

**Accounting impacts in QuickBooks:**
- May be treated as regular invoiced revenue; if you support prepayments/deposits, you may need an “unearned revenue” approach in accounting configuration (implementation varies by accounting policy).

**Sample user story:**  
As a client contact, I want to see monthly retainer usage with supporting work logs so that I can validate the value received and forecast upcoming spend.

#### Milestone-based

**Billing methods:** milestone invoices tied to defined deliverables; can be combined with progress billing for long phases.

**Typical use-cases:** Renovations with clear phase completion points (design completion, permit issuance, demo complete, rough-in complete, final inspection, punchlist complete).

**Required data fields:**
- Milestone definitions; acceptance criteria; dependency gates (e.g., permit approval required).
- Approval contacts for milestone acceptance.

**Approval gates:**
- Milestone acceptance sign-off (client and internal PM).
- Change control gate to protect milestone definitions when scope changes.

**Accounting impacts in QuickBooks:**
- Invoices created per milestone; revenue recognition depends on accounting policy, but operationally you must link invoice to milestone acceptance artifact.

**Sample user story:**  
As a PM, I want milestone billing to be released only after the client accepts the milestone checklist so that billing is consistent with contractual deliverables.

### AI contract type suggestion and override logic

Your AI recommender should operate as a **policy-guided decision support system**, not an autonomous contractual decision-maker. NIST’s AI RMF frames risk management as cross-cutting Governance plus Map/Measure/Manage functions, and explicitly notes actions are not a checklist nor necessarily an ordered set of steps. citeturn7view1turn1search8

**Inputs required (minimum set):**
- Walkthrough scope signals: measurements, room counts, system counts, photos, condition notes.
- “Estimate basis” metadata: assumptions, exclusions, unknowns list (GAO-style documentation focus). citeturn7view0turn1search4
- Historical cost library features: comparable jobs, unit costs, labor productivity, change order rates.
- Client preferences: transparency needs, funding structure constraints, risk tolerance.
- Contract constraints: desired timeline, schedule risk, permit/historic flags.
- Internal constraints: crew availability, subcontractor lead times.

**Model outputs:**
- Suggested contract type + billing cadence (e.g., “fixed + progress billing monthly with 10% retainage”).
- Rationale text tied to measurable features (scope clarity score, volatility score, comparable-job density).
- Draft proposal skeleton: scope, exclusions, allowances, recommended change order policy.
- Optional: “recommended risk buffers” (contingency line, allowance set) but always as a recommendation.

**Confidence indicators (show in UI, store in audit):**
- Data completeness score (e.g., missing measurements, insufficient photos).
- Similarity score to historical comps (how many comparable jobs, spread, recency).
- Volatility risk score (presence of unknowns that historically trigger change orders).

**Human approval gates (non-negotiable):**
- Estimator approval of contract type recommendation (accept/override required).
- PM approval of billing cadence and schedule impacts.
- Accounting/admin approval when retainage, deposits, or unusual billing terms apply.
- Audit log must store: input snapshot ID, model version, output, overrides and reasons, approver identities, and timestamps, consistent with “accountable & transparent” governance expectations in NIST RMF framing. citeturn7view1turn1search5

## Permit register scope, data model, workflows, and UI rules

A permit register must be optional at the work request level but become structurally important when jobs trigger permitting, plan review, inspections, or special authorities. In Louisiana, the Uniform Construction Code adoption explicitly references **IBC 2021** and **IRC 2021**, which should be stored as structured permit metadata (not just text notes). citeturn8view1turn2search21  
Louisiana’s fire marshal plan review guidance indicates plan review and code enforcement involvement can be contract-based with parishes/municipalities, so your system must store “review authority” and “review pathway” per jurisdiction. citeturn2search2turn2search14

### Permit register data model table

| Object | Field | Type | Required | Notes |
|---|---|---:|---:|---|
| PermitRegister | work_request_id | UUID/FK | Yes | One work request can have 0..n permits |
| PermitRegister | jurisdiction_name | String | Yes | Parish/municipality; used for routing |
| PermitRegister | jurisdiction_type | Enum | Yes | Parish / City / State agency / Federal |
| PermitRegister | permit_type | Enum | Yes | Building, electrical, mechanical, plumbing, demolition, signage, etc. |
| PermitRegister | code_set | Enum | No | IBC/IRC/IEBC/etc.; stored for audit; LA uses IBC/IRC 2021 baseline citeturn8view1 |
| PermitRegister | code_version | String | No | e.g., “2021” |
| PermitRegister | reviewer_authority | Enum | Yes | Local AHJ, contracted OSFM plan review, third-party provider, etc. citeturn2search2turn2search14 |
| PermitRegister | reviewer_contact | String | No | Name/email/phone |
| PermitRegister | status | Enum | Yes | Not needed / Needed / Drafting / Submitted / In review / Revisions required / Approved / Issued / Finaled / Closed |
| PermitRegister | critical_dates | JSON | No | Submission date, approval date, expiration date |
| PermitRegister | fees | Money + JSON | No | Fees by type; include payment status |
| PermitRegister | attachments | List | No | Plans, calculations, reviewer letters, permit card |
| Inspection | permit_id | UUID/FK | Yes | Child table |
| Inspection | inspection_type | Enum | Yes | Rough-in, framing, final, etc. |
| Inspection | scheduled_at | DateTime | No | |
| Inspection | result | Enum | No | Pass/Fail/Partial/Reschedule |
| Inspection | inspector_notes | Text | No | |
| Inspection | attachment_refs | List | No | Photos, signed tags |

### Permit workflows and notifications

**Workflow (optional but standardized):**
- A PM/designated coordinator toggles “Permits needed” on a work request.
- System prompts for: jurisdiction, permit types, reviewer authority, code set/version.
- Upon submission, status changes to “Submitted,” and the system starts countdown reminders for typical review SLAs (configurable per jurisdiction).
- “Revisions required” creates tasks: revise drawings, respond to comments, resubmit package.
- Inspections are scheduled against the permit record; a failed inspection blocks work request closeout.

**Notifications (events to implement):**
- Permit status change notifications to PM + estimator + client (client visibility controlled).
- Inspection scheduled reminders to field lead and client contact (optional).
- “Permit expiring soon” alert if expiration date exists.
- “Final inspection required” alerts when nearing completion milestone.

**UI/UX rules (to keep optional but visible):**
- Permit tab should show a “Not required / Add permit” switch.
- Permit list should allow multiple permits per work request (common in renovations).
- Status should be visible on the project timeline; permit blockers should show as “hard stops.”
- Permit attachments must be searchable and pinned (permit card, approval letter).

A practical Louisiana-specific UX enhancement: For jurisdictions that require OSFM plan review coordination, your permit record should support capturing “approval letter received” as an attachment since some local permit offices require the approval letter before issuing permits. citeturn2search2turn2search22

## Historic mode triggers, evidence gates, and sign-off workflow

Historic work is governed by the Secretary of the Interior’s standards and related regulatory frameworks, which emphasize preserving character-defining features and repairing rather than replacing where feasible; replacement should match visual qualities and, where possible, materials, and missing features should be substantiated by documentary/physical/pictorial evidence. citeturn3search0turn3search2turn3search5  
Louisiana’s historic preservation guidance explicitly points users back to these standards for rehabilitation, and Louisiana historic tax credit processes involve SHPO-related review steps (commonly via “Part 2” work description review). citeturn3search1turn3search21turn3search4

### Historic-mode trigger and role model

**Trigger rule (as requested):**
- A project-level boolean `historic_mode = true` can be set by:
  - Client organization admin, or
  - Client-designated contact (role: “Historic Approver”), or
  - Internal admin/PM (if granted).

**Reviewer registry:**
- Store `designated_reviewer_name`, `designated_reviewer_title`, `reviewer_org` (architect, SHPO, client’s designated reviewer).
- Store `reviewer_authority_type` enum: Architect / SHPO / Client-designated / Other.

### Historic artifact data model table

| Artifact type | Required fields | Required evidence | Sign-off required | Notes |
|---|---|---:|---:|---|
| Material specification | material name, manufacturer (if known), spec/grade, quantity, location | Photo(s) of installed material + packaging/label if available | Yes (if configured) | Supports “match where possible materials” expectation citeturn3search0 |
| Method statement | method, tooling, surface prep, reversible? (yes/no), rationale | Before/during/after photos | Yes | Helps document treatment approach per standards citeturn3search5 |
| Condition assessment | observed conditions, deterioration type, cause hypothesis | Photos + measurements | Optional | Supports “repair vs replace” decision trail citeturn3search0 |
| Replacement justification | why repair not feasible, what replaced, evidence basis | Documentary/physical/pictorial references | Yes | Directly required conceptually by standards evidence expectations citeturn3search0 |
| Review comments log | reviewer notes, dates, disposition | Attachments | Yes | Mirrors structured Part 2-type review workflows citeturn3search21turn3search4 |

### Evidence gates and sign-off workflow

**Evidence gates (blocking rules):**
- Work request cannot transition to “Complete” if:
  - Materials list is missing for historic-tagged scope items, or
  - Required photo sets are missing (min: before + after; optionally during), or
  - Method statement missing for any “treatment category” flagged as sensitive (configurable), or
  - Required reviewer sign-off not present (depending on authority type).

**Sign-off workflow:**
- “Submit for historic review” generates a review packet (PDF bundle + link).
- Reviewer can:
  - Approve (sign-off),
  - Request changes (creates tasks),
  - Reject (blocks completion).
- System records: reviewer identity, title, date, artifacts reviewed, and any conditions.

This structure supports preservation-grade traceability without forcing every project into historic overhead, and it aligns with the standards’ emphasis on evidence and careful treatment selection. citeturn3search0turn3search5

## QuickBooks and payments integration architecture

### Sync patterns evaluated

**App-authoritative invoices (push to QBO):**  
Your system is the source of truth for invoice creation after internal approvals; invoices are created in QBO via API; payments may be processed externally and then recorded in QBO as Receive Payment linked to the invoice. Intuit’s invoicing workflows emphasize that invoicing is fundamental and requires proper setup of entities and scopes. citeturn1search7turn6search2

**QBO-authoritative invoices (read-only mirror):**  
Invoices are created/edited only in QBO; your app reads invoices and displays them in the client portal. Easier accounting control, but weaker operational gating (approvals, scope-based billing controls).

**Bi-directional (both can create/edit):**  
Highest complexity. Requires conflict resolution using QBO concurrency controls (SyncToken changes whenever an object is updated) and reliable change detection via webhooks and/or CDC polling. citeturn5search2turn5search4turn5search1

### Recommended best practice for Pelican State

**Recommendation:** Use a **single-writer per object** approach:
- **Your app is authoritative for operational approvals and invoice origination** (estimate → approval → invoice draft → internal approval → “post to QBO”).
- **QBO remains authoritative for the accounting ledger** (official AR, deposits, reconciliation).
- **Edits after posting:** treat as “revision via change order / credit memo,” not silent edits, to avoid audit ambiguity and sync conflicts.

This recommendation is grounded in Intuit’s integration realities:
- OAuth2/realmId binding ties tokens to the specific QBO company. citeturn1search2turn1search9
- Webhooks are explicitly positioned for event-triggered sync, while CDC provides a polling mechanism to retrieve changed data (useful as a backstop if events are missed). citeturn5search4turn5search1turn5search23
- SyncToken-based concurrency means last-write-wins is not safe without explicit conflict logic. citeturn5search2turn5search10

### Entity mapping between the system and QuickBooks

Core mapping (minimum viable and stable):

- Customer/Client → QBO Customer
- Project/Job → map as:
  - QBO Customer + internal project ID stored in QBO custom fields/notes (if available), **or**
  - QBO Project feature (if you choose to rely on it; ensure capability checks)
- Invoice → QBO Invoice
- Payments → QBO ReceivePayment linked to Invoice (Intuit guidance for applying payments to invoices uses Receive Payment transactions and linking to the invoice). citeturn1search3turn1search14
- Vendors/Subcontractors (if you extend procurement) → QBO Vendor + QBO Bill/Expense objects (accounting side)

### OAuth2 flow and scopes

Implement Intuit OAuth2 authorization code flow:
1. Redirect user to Intuit authorization endpoint.
2. Receive authorization code.
3. Exchange code for access + refresh tokens; tokens are tied to the authorized QBO company (realmId). citeturn1search2turn1search9
4. Store tokens encrypted; refresh access token as needed.

Scopes should be least-privilege:
- `com.intuit.quickbooks.accounting` for accounting data.
- Add `com.intuit.quickbooks.payment` only if you will process payments through QuickBooks Payments API. Intuit documents these scopes explicitly. citeturn5search3turn5search7turn6search6

### Sync rules and conflict resolution

**Core sync rules:**
- Every synced object stores:
  - `qbo_id`, `qbo_sync_token`, `last_synced_at`, and a hash of key fields.
- Outbound writes (create/update) are idempotent:
  - Use internal “sync job IDs” to prevent duplicate invoice creation.

**Inbound change detection:**
- Subscribe to QBO webhooks for Invoice, Payment, Customer entities.
- If a webhook is missed or delayed, run CDC as a reconciliation backstop (CDC returns entities changed within a lookback period). citeturn5search4turn5search1turn5search23

**Conflict resolution policy (practical):**
- If QBO invoice differs from your posted invoice:
  - If QBO change is “payment applied” or “status-only,” accept and sync back.
  - If QBO change is “line edit,” flag as breach of single-writer policy: create an exception task requiring accountant/admin review, and consider generating a correcting adjustment rather than overwriting.

### Stripe or Authorize.Net vs QuickBooks Payments

You asked to evaluate using a separate payment processor and then pushing payment status to QBO.

**Stripe pattern (recommended if you want a modern checkout + strong developer ergonomics):**
- Create invoice in app → post invoice to QBO.
- Generate a Stripe payment link / checkout session.
- Stripe sends webhook events like `payment_intent.succeeded` on successful payment; you consume the webhook to mark invoice as paid in your system. citeturn6search4turn6search0turn6search12
- Then, create QBO Receive Payment linked to the invoice to keep accounting consistent. citeturn1search3turn1search14

**Authorize.Net pattern (recommended if you want a traditional gateway often used in construction + card-not-present options):**
- Similar flow; consume Authorize.Net webhooks.
- Authorize.Net documentation explicitly notes webhooks should be used alongside reporting APIs (e.g., getTransactionDetails) for full detail/current status. citeturn6search1turn6search17
- Post Receive Payment to QBO once transaction is settled/confirmed (policy decision: authorize vs capture vs settlement).

**QuickBooks Payments API:**
- If you want payments fully inside the Intuit ecosystem, use QBO Payments API resources (charges/refunds) and `com.intuit.quickbooks.payment` scope. citeturn6search10turn5search3turn6search6
- This can reduce one reconciliation step but may constrain the client portal UX depending on what you want to build.

**Recommendation for Pelican State:**  
Start with **Stripe or Authorize.Net for payment capture** and use QBO as the accounting ledger by posting Receive Payment linked to invoices. This keeps your client portal experience consistent while still ensuring QuickBooks remains accurate for AR and reconciliation, leveraging Intuit’s documented payment linkage flow. citeturn1search3turn6search4turn6search1

### Reconciliation flow

A resilient reconciliation flow is event-driven + periodically reconciled:

- Payment processor webhook received → mark invoice “Paid (Pending sync)” in app.
- Attempt QBO Receive Payment creation immediately.
- Nightly reconciliation job:
  - Uses QBO CDC to confirm payment/invoice states (backstop). citeturn5search1
  - Verifies processor settlement reports vs QBO deposits.
  - Flags mismatches (paid in processor but not in QBO; paid in QBO but not in processor).

## PRD artifacts, flowchart, acceptance criteria, user stories, and compliance checklist

### Mermaid flowchart for estimate → approval → contract → billing → closeout

This flow is consistent with standard contract administration practices: change orders as formal instruments for changes in sum/time and pay applications built from schedule of values for progress billing, while estimate discipline follows GAO’s “document assumptions, build WBS, update with actuals” guidance. citeturn4search8turn4search2turn4search15turn7view0

```mermaid
flowchart TD
  A[Intake / Opportunity] --> B[Walkthrough + Measurements + Photos]
  B --> C[Estimate Draft + Basis of Estimate]
  C --> D{AI Suggest Contract Type & Billing}
  D --> E[Estimator Review: Accept/Override + Rationale]
  E --> F[Client Proposal Delivered]
  F --> G{Client Approval?}
  G -- No --> H[Revise Scope / Pricing]
  H --> C
  G -- Yes --> I[Contract Executed]
  I --> J{Permits Needed?}
  J -- Yes --> K[Permit Register: Submit -> Review -> Approve]
  K --> L[Schedule + Procure]
  J -- No --> L[Schedule + Procure]
  L --> M[Execute Work + Daily Logs]
  M --> N{Historic Mode?}
  N -- Yes --> O[Evidence Gates: Materials/Methods/Photos + Reviewer Sign-off]
  N -- No --> P[Quality Check + Punchlist]
  O --> P
  P --> Q{Billing Mode}
  Q -- T&M --> R[T&M Invoice from Time + Materials]
  Q -- Progress --> S[Pay App from SOV + Retainage]
  Q -- Milestone --> T[Milestone Acceptance -> Invoice]
  R --> U[Post Invoice to QuickBooks + Send to Client]
  S --> U
  T --> U
  U --> V{Payment Received?}
  V -- Yes --> W[Record Payment (Processor) + Push Receive Payment to QuickBooks]
  V -- No --> X[Collections / Reminders]
  W --> Y[Closeout Binder: Warranties, Lien Waivers, As-builts]
  Y --> Z[Project Closed]
```

### Sample PRD-level acceptance criteria

**Contract engine**
- The user can select one of: T&M, Fixed Price, Cost-Plus (GMP optional), Retainer, Milestone at opportunity conversion.
- The system generates required fields per contract type (cannot execute contract without required fields).
- Progress billing requires an approved SOV before first pay application. citeturn4search15turn4search2
- Change order creation captures scope delta, cost delta, and time delta and requires configured signers before becoming “approved,” consistent with the role of change orders in documenting agreed changes. citeturn4search8turn4search0

**AI contract recommender**
- The AI must show: recommended contract type, billing cadence, confidence indicators, and rationale tied to input features.
- The user must choose “accept” or “override” and provide an override reason.
- The system must log: input snapshot reference, model version, output, user decision, approver identity, timestamp (audit trail aligned to NIST “accountable & transparent” framing). citeturn7view1turn1search5

**Permit register**
- Permit register is available on every work request, default Off.
- If enabled, user must enter jurisdiction and permit type.
- Permit status changes trigger notifications to the assigned PM.
- Inspection failures block closing the work request if “inspection required for closeout” is enabled.

**Historic mode**
- Historic mode is a project flag set by authorized client contact or internal admin.
- When on, required artifacts (materials/methods/photos) must be present before completion.
- Reviewer sign-off is required when configured; reviewer identity and role are stored.

**QuickBooks integration**
- Users can connect via OAuth2 and select the target company; realmId is stored with the connection. citeturn1search2turn1search17
- “Post to QBO” creates invoices; sync stores QBO IDs and SyncToken.
- If QBO returns a SyncToken mismatch/conflict, the system surfaces an actionable resolution state (refresh + reapply changes or manual review), consistent with SyncToken behavior as versioning. citeturn5search2turn5search10
- Webhooks + CDC are supported for inbound sync reliability. citeturn5search4turn5search1

### User stories covering estimator, PM, client, accountant, historic reviewer

1. **Estimator:** As an estimator, I want to input walkthrough measurements/photos and see an AI-recommended contract type with rationale so that I can pick the most risk-appropriate agreement for the opportunity. citeturn7view0turn7view1  
2. **Estimator:** As an estimator, I want the system to require assumptions/exclusions for fixed-price and GMP estimates so that proposals remain defensible and change orders are clear. citeturn7view0turn4search8  
3. **PM:** As a PM, I want switching billing modes (milestone → progress or T&M cap) to require approvals so that billing terms don’t drift without governance. citeturn4search1  
4. **PM:** As a PM, I want a permit register that can be enabled per work request and then blocks closeout until required inspections are passed so that compliance is enforced operationally. citeturn2search6turn2search2  
5. **Client contact:** As a client contact, I want to approve milestone completion via checklist so that invoicing matches contract deliverables.  
6. **Accountant:** As an accountant, I want posted invoices to be pushed into QuickBooks and locked in the PM system so that the accounting ledger stays consistent and edits are controlled. citeturn1search2turn5search2  
7. **Accountant:** As an accountant, I want payments collected via Stripe or Authorize.Net to automatically create a linked Receive Payment in QuickBooks so that AR and deposits reconcile cleanly. citeturn6search4turn6search1turn1search3  
8. **Historic reviewer:** As the designated historic reviewer, I want to review a packet of materials/methods/photos and approve or request changes so that historic integrity documentation is complete and auditable. citeturn3search0turn3search5  
9. **PM:** As a PM, I want change orders to adjust contract sum/time and flow into billing so that progress invoices always reflect approved scope. citeturn4search8turn4search2  
10. **Client contact:** As a client contact, I want the portal to show permit status and major blockers so that I can anticipate schedule impacts. citeturn2search2turn5search4

### Security and compliance checklist

**QuickBooks integration security**
- OAuth2 authorization code flow; encrypt access/refresh tokens; strict scoped access (accounting scope only unless Payments API required). citeturn1search2turn5search7turn6search2
- Implement webhook endpoint verification and replay protection; maintain CDC backstop polling for missed events. citeturn5search4turn5search1turn5search8
- Concurrency safety using SyncToken-aware updates; surface conflicts as reviewable exceptions. citeturn5search2turn5search10

**Louisiana licensing & permitting**
- License rules engine flags requirements based on project value/type (LSLBC thresholds include $50,000 commercial and specialty trade triggers; MEP over $10,000; mold remediation over $7,500). citeturn2search0turn2search4
- Permit register stores jurisdiction + reviewer pathway (local vs OSFM contract enforcement) and code version (IBC/IRC 2021 baseline). citeturn2search2turn8view1turn2search14

**Lien rights and lien waiver controls**
- For residential/home improvement scenarios, store lien-rights notice delivery and acknowledgment; Louisiana law provides a Notice of Lien Rights concept and advises protective steps like written contracts, bonds, recordation, and lien waivers. citeturn2search3turn2search7
- Collect conditional/unconditional lien waivers tied to vendor payments and closeout binder.

**Historic / SHPO / CRT references**
- Historic mode evidence gating aligns to Secretary of the Interior standards emphasis on preserving features and substantiating replacements with evidence. citeturn3search0turn3search5
- Louisiana historic rehabilitation/tax incentive paths are administered with reference to those standards and involve SHPO-type review steps (Part 2 work description review patterns). citeturn3search1turn3search21turn3search4

**Payment processor security**
- Consume processor webhooks for payment confirmation (`payment_intent.succeeded` for Stripe; Authorize.Net webhook events with reporting API verification), then post verified payments to QBO. citeturn6search4turn6search1turn6search8