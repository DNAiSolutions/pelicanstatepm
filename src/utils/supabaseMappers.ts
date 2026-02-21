import type {
  Contract,
  Milestone,
  ScheduleOfValuesEntry,
  CostLedgerEntry,
  Invoice,
  InvoiceLineItem,
  Project,
  Contact,
  Lead,
  PermitRecord,
  HistoricArtifact,
} from '../types';

const defaultClientVisibility = {
  show_budget: true,
  show_timeline: true,
  show_invoices: true,
  show_contacts: true,
};

export function mapContractRow(row: any): Contract {
  return {
    id: row.id,
    project_id: row.project_id,
    contract_type: row.contract_type,
    billing_method: row.billing_method,
    contract_value: row.contract_value ?? undefined,
    fee_percentage: row.fee_percentage ?? undefined,
    retainer_amount: row.retainer_amount ?? undefined,
    retainage_percentage: row.retainage_percentage ?? undefined,
    start_date: row.start_date,
    end_date: row.end_date ?? undefined,
    status: row.status,
    created_by: row.created_by ?? 'system',
    approved_by: row.approved_by ?? undefined,
    approved_at: row.approved_at ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapMilestoneRow(row: any): Milestone {
  return {
    id: row.id,
    contract_id: row.contract_id,
    name: row.name,
    description: row.description ?? undefined,
    scheduled_date: row.scheduled_date ?? undefined,
    amount: Number(row.amount ?? 0),
    status: row.status,
    ready_to_bill_at: row.ready_to_bill_at ?? undefined,
    invoiced_invoice_id: row.invoiced_invoice_id ?? undefined,
    paid_at: row.paid_at ?? undefined,
    created_at: row.created_at,
  };
}

export function mapScheduleOfValuesRow(row: any): ScheduleOfValuesEntry {
  return {
    id: row.id,
    contract_id: row.contract_id,
    line_item: row.line_item,
    budget_amount: Number(row.budget_amount ?? 0),
    percent_complete: Number(row.percent_complete ?? 0),
    amount_earned: Number(row.amount_earned ?? 0),
    last_updated: row.last_updated,
  };
}

export function mapCostLedgerRow(row: any): CostLedgerEntry {
  return {
    id: row.id,
    project_id: row.project_id,
    contract_id: row.contract_id ?? undefined,
    category: row.category,
    description: row.description ?? '',
    committed_amount: row.committed_amount ?? undefined,
    actual_amount: row.actual_amount ?? undefined,
    vendor_id: row.vendor_id ?? undefined,
    invoice_reference: row.invoice_reference ?? undefined,
    recorded_by: row.recorded_by ?? 'system',
    recorded_at: row.recorded_at,
  };
}

export function mapInvoiceLineItem(row: any): InvoiceLineItem {
  return {
    id: row.id ?? row.line_item_id ?? row.work_order_id,
    work_order_id: row.work_order_id ?? row.workOrderId,
    description: row.description ?? '',
    location: row.location ?? '',
    quantity: Number(row.quantity ?? 1),
    rate: Number(row.rate ?? 0),
    amount: Number(row.amount ?? 0),
    work_performed_notes: row.work_performed_notes ?? '',
  };
}

export function mapInvoiceRow(row: any): Invoice {
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    project_id: row.project_id,
    contract_id: row.contract_id ?? undefined,
    property_id: row.property_id,
    funding_code: row.funding_source,
    prime_vendor_id: row.prime_vendor_id,
    work_order_ids: row.work_request_ids ?? [],
    line_items: (row.line_items ?? []).map(mapInvoiceLineItem),
    total_amount: Number(row.total_amount ?? 0),
    billing_reference_id: row.billing_reference_id,
    retainage_withheld: row.retainage_withheld ?? undefined,
    retainage_released: row.retainage_released ?? undefined,
    gross_margin_snapshot: row.gross_margin_snapshot ?? undefined,
    stripe_payment_intent_id: row.stripe_payment_intent_id ?? undefined,
    quickbooks_invoice_id: row.quickbooks_invoice_id ?? undefined,
    status: row.status,
    submitted_at: row.submitted_at ?? undefined,
    approved_at: row.approved_at ?? undefined,
    approved_by_id: row.approved_by ?? undefined,
    paid_at: row.paid_at ?? undefined,
    payment_method: row.payment_method ?? undefined,
    payment_reference: row.payment_reference ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    site_id: row.site_id ?? '',
    property_id: row.property_id ?? undefined,
    client_name: row.client_name ?? '',
    client_phone: row.client_phone ?? '',
    client_email: row.client_email ?? '',
    client_logo: row.client_logo ?? undefined,
    internal_owner_id: row.internal_owner_id ?? 'user-1',
    prime_vendor_id: row.prime_vendor_id ?? undefined,
    status: row.status,
    client_summary: row.client_summary ?? undefined,
    internal_notes: row.internal_notes ?? undefined,
    client_visibility: {
      ...defaultClientVisibility,
      ...(row.client_visibility ?? {}),
    },
    share_token: row.share_token ?? undefined,
    start_date: row.start_date ?? new Date().toISOString(),
    end_date: row.end_date ?? new Date().toISOString(),
    total_budget: Number(row.total_budget ?? 0),
    spent_budget: Number(row.spent_budget ?? 0),
    walkthrough_notes: row.walkthrough_notes ?? undefined,
    walkthrough_plan: row.walkthrough_plan ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapContactRow(row: any): Contact {
  const project_ids = (row.contact_projects ?? []).map((link: any) => link.project_id);
  const lead_ids = (row.contact_leads ?? []).map((link: any) => link.lead_id);
  return {
    id: row.id,
    name: row.name,
    title: row.title ?? '',
    company: row.company ?? '',
    type: row.type ?? 'Client',
    email: row.email ?? '',
    phone: row.phone ?? '',
    property_id: row.property_id ?? undefined,
    project_ids,
    lead_ids,
    preferred_channel: row.preferred_channel ?? undefined,
    notes: row.notes ?? undefined,
    client_portal_enabled: Boolean(row.client_portal_enabled),
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export function mapLeadRow(row: any): Lead {
  const contact_ids = (row.contact_leads ?? []).map((link: any) => link.contact_id);
  return {
    id: row.id,
    company_name: row.company_name ?? '',
    contact_name: row.contact_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    stage: row.stage,
    source: row.source ?? 'Inbound',
    estimated_value: Number(row.estimated_value ?? 0),
    next_step: row.next_step ?? undefined,
    notes: row.notes ?? undefined,
    property_id: row.property_id ?? undefined,
    project_id: row.project_id ?? undefined,
    contact_ids,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    intake_metadata: row.intake_metadata ?? undefined,
    intake_channel: row.intake_channel ?? undefined,
    recommended_next_step: row.recommended_next_step ?? undefined,
    decision_confidence: row.decision_confidence ?? undefined,
    decision_notes: row.decision_notes ?? undefined,
    job_address: row.job_address ?? undefined,
    urgency: row.urgency ?? undefined,
    access_notes: row.access_notes ?? undefined,
    attachments: row.attachments ?? [],
    follow_up_status: row.follow_up_status ?? undefined,
    preferred_channel: row.preferred_channel ?? undefined,
    call_source: row.call_source ?? undefined,
    handled_by: row.handled_by ?? undefined,
    project_type: row.project_type ?? undefined,
    walkthrough_scheduled: Boolean(row.walkthrough_scheduled),
    walkthrough_date: row.walkthrough_date ?? undefined,
    walkthrough_event_id: row.walkthrough_event_id ?? undefined,
    walkthrough_notes: row.walkthrough_notes ?? undefined,
    walkthrough_prep_brief: row.walkthrough_prep_brief ?? undefined,
    walkthrough_session_ids: row.walkthrough_session_ids ?? [],
    walkthrough_plan: row.walkthrough_plan ?? undefined,
  };
}

export function mapPermitRow(row: any): PermitRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    work_order_id: row.work_order_id ?? undefined,
    jurisdiction_name: row.jurisdiction_name,
    jurisdiction_type: row.jurisdiction_type,
    permit_type: row.permit_type,
    code_set: row.code_set ?? undefined,
    code_version: row.code_version ?? undefined,
    reviewer_authority: row.reviewer_authority,
    reviewer_contact: row.reviewer_contact ?? undefined,
    status: row.status,
    submission_date: row.submission_date ?? undefined,
    approval_date: row.approval_date ?? undefined,
    expiration_date: row.expiration_date ?? undefined,
    fees: row.fees ?? undefined,
    attachments: row.attachments ?? [],
    notes: row.notes ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export function mapHistoricArtifactRow(row: any): HistoricArtifact {
  return {
    id: row.id,
    project_id: row.project_id,
    work_order_id: row.work_order_id ?? undefined,
    artifact_type: row.artifact_type,
    description: row.description,
    evidence_urls: row.evidence_urls ?? [],
    reviewer_required: Boolean(row.reviewer_required),
    review_status: row.review_status,
    reviewer_id: row.reviewer_id ?? undefined,
    reviewer_notes: row.reviewer_notes ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export function mapPermitInspectionRow(row: any): any {
  return {
    id: row.id,
    permit_id: row.permit_id,
    inspection_type: row.inspection_type,
    scheduled_at: row.scheduled_at ?? undefined,
    result: row.result ?? undefined,
    inspector_notes: row.inspector_notes ?? undefined,
    attachments: row.attachments ?? [],
  };
}
