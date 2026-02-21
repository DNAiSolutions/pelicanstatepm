import { supabase } from './supabaseClient';
import { invoiceService } from './invoiceService';
import { billingGuardService } from './billingGuardService';
import { stripeService } from './stripeService';
import { quickbooksService } from './quickbooksService';
import { auditLogService } from './auditLogService';
import { authzService } from './authzService';
import type { Invoice } from '../types';

type SyncStatus = 'Pending' | 'Synced' | 'Failed';

export const paymentSyncService = {
  async syncInvoiceToStripe(invoiceId: string, actingUserId: string) {
    authzService.assertCanSyncInvoice(actingUserId);
    const invoice = await this.getInvoiceOrThrow(invoiceId);
    const guard = await billingGuardService.evaluateInvoice(invoice);
    if (!guard.allowed) throw new Error(guard.reasons.join('; '));

    const intent = await stripeService.createPaymentIntent(invoice.id!, invoice.total_amount, 'usd', {
      projectId: invoice.project_id,
    });
    await invoiceService.update(invoice.id!, { stripe_payment_intent_id: intent.id } as any);
    await this.trackSyncRecord(invoice.id!, 'Stripe', 'Synced', intent.id, { amount: invoice.total_amount });
    auditLogService.record({
      entity: 'Invoice',
      entityId: invoice.id!,
      action: 'SYNC_STRIPE',
      actorId: actingUserId,
      metadata: { intentId: intent.id },
    });
    return intent;
  },

  async syncInvoiceToQuickBooks(invoiceId: string, customerName: string, actingUserId: string) {
    authzService.assertCanSyncInvoice(actingUserId);
    const invoice = await this.getInvoiceOrThrow(invoiceId);
    const guard = await billingGuardService.evaluateInvoice(invoice);
    if (!guard.allowed) throw new Error(guard.reasons.join('; '));

    const record = await quickbooksService.pushInvoice(invoice.id!, {
      customerName,
      amount: invoice.total_amount,
    });
    await invoiceService.update(invoice.id!, { quickbooks_invoice_id: record.id } as any);
    await this.trackSyncRecord(invoice.id!, 'QuickBooks', 'Synced', record.id, { customerName });
    auditLogService.record({
      entity: 'Invoice',
      entityId: invoice.id!,
      action: 'SYNC_QUICKBOOKS',
      actorId: actingUserId,
      metadata: { qboId: record.id },
    });
    return record;
  },

  async recordStripeWebhook(event: { type: string; data: Record<string, any> }) {
    const intent = await stripeService.handleWebhook(event);
    if (intent?.status === 'succeeded') {
      await invoiceService.update(intent.invoiceId, {
        status: 'Paid',
        paid_at: new Date().toISOString(),
        payment_method: 'Stripe',
      } as any);
      await this.trackSyncRecord(intent.invoiceId, 'Stripe', 'Synced', intent.id, { webhook: true });
      auditLogService.record({
        entity: 'Payment',
        entityId: intent.id,
        action: 'STRIPE_WEBHOOK',
        actorId: 'system-webhook',
        metadata: { invoiceId: intent.invoiceId },
      });
    }
    return intent;
  },

  async recordManualPayment(invoiceId: string, amount: number, actingUserId: string) {
    authzService.requireRole(actingUserId, ['Finance', 'Owner']);
    const invoice = await this.getInvoiceOrThrow(invoiceId);
    await quickbooksService.recordPayment(invoice.id!, amount);
    await invoiceService.update(invoice.id!, {
      status: 'Paid',
      paid_at: new Date().toISOString(),
      payment_method: 'QuickBooks',
    } as any);
    await this.trackSyncRecord(invoice.id!, 'QuickBooks', 'Synced', `QB-${Date.now()}`, { amount });
    auditLogService.record({
      entity: 'Payment',
      entityId: invoice.id!,
      action: 'QUICKBOOKS_PAYMENT',
      actorId: actingUserId,
      metadata: { amount },
    });
  },

  async trackSyncRecord(
    invoiceId: string,
    provider: 'Stripe' | 'QuickBooks',
    status: SyncStatus,
    reference?: string,
    payload?: Record<string, unknown>
  ) {
    const { error } = await supabase.from('payment_sync_records').insert({
      invoice_id: invoiceId,
      provider,
      status,
      reference,
      payload,
    });
    if (error) throw error;
  },

  async getInvoiceOrThrow(invoiceId: string): Promise<Invoice> {
    const invoice = await invoiceService.getInvoice(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  },
};

export type PaymentSyncService = typeof paymentSyncService;
