import {
  getInvoiceById,
  mockPaymentSyncRecords,
  type Invoice,
} from '../data/pipeline';
import { billingGuardService } from './billingGuardService';
import { stripeService } from './stripeService';
import { quickbooksService } from './quickbooksService';
import { auditLogService } from './auditLogService';
import { authzService } from './authzService';

const createRecordId = () => `psr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const paymentSyncService = {
  async syncInvoiceToStripe(invoiceId: string, actingUserId: string) {
    authzService.assertCanSyncInvoice(actingUserId);
    const invoice = this.getInvoiceOrThrow(invoiceId);
    const guard = billingGuardService.evaluateInvoice(invoice);
    if (!guard.allowed) {
      throw new Error(guard.reasons.join('; '));
    }
    const intent = await stripeService.createPaymentIntent(invoice.id, invoice.totalAmount, 'usd', { projectId: invoice.projectId });
    invoice.stripePaymentIntentId = intent.id;
    this.trackSyncRecord(invoice, 'Stripe', 'Synced', intent.id, { amount: invoice.totalAmount });
    auditLogService.record({
      entity: 'Invoice',
      entityId: invoice.id,
      action: 'SYNC_STRIPE',
      actorId: actingUserId,
      metadata: { intentId: intent.id },
    });
    return intent;
  },

  async syncInvoiceToQuickBooks(invoiceId: string, customerName: string, actingUserId: string) {
    authzService.assertCanSyncInvoice(actingUserId);
    const invoice = this.getInvoiceOrThrow(invoiceId);
    const record = await quickbooksService.pushInvoice(invoice.id, { customerName, amount: invoice.totalAmount });
    invoice.quickbooksInvoiceId = record.id;
    this.trackSyncRecord(invoice, 'QuickBooks', 'Synced', record.id, { customerName });
    auditLogService.record({
      entity: 'Invoice',
      entityId: invoice.id,
      action: 'SYNC_QUICKBOOKS',
      actorId: actingUserId,
      metadata: { qboId: record.id },
    });
    return record;
  },

  async recordStripeWebhook(event: { type: string; data: Record<string, any> }) {
    const intent = await stripeService.handleWebhook(event);
    if (intent && intent.status === 'succeeded') {
      const invoice = getInvoiceById(intent.invoiceId);
      if (invoice) {
        invoice.status = 'Paid';
        invoice.paidAt = new Date().toISOString();
        invoice.paymentMethod = 'Stripe';
        invoice.paymentReference = intent.id;
        this.trackSyncRecord(invoice, 'Stripe', 'Synced', intent.id, { webhook: true });
        auditLogService.record({
          entity: 'Payment',
          entityId: intent.id,
          action: 'STRIPE_WEBHOOK',
          actorId: 'system-webhook',
          metadata: { invoiceId: invoice.id },
        });
      }
    }
    return intent;
  },

  async recordManualPayment(invoiceId: string, amount: number, actingUserId: string) {
    authzService.requireRole(actingUserId, ['Finance', 'Owner']);
    const invoice = this.getInvoiceOrThrow(invoiceId);
    await quickbooksService.recordPayment(invoice.id, amount);
    invoice.status = 'Paid';
    invoice.paidAt = new Date().toISOString();
    invoice.paymentMethod = 'QuickBooks';
    invoice.paymentReference = `QB-${Date.now()}`;
    this.trackSyncRecord(invoice, 'QuickBooks', 'Synced', invoice.paymentReference, { amount });
    auditLogService.record({
      entity: 'Payment',
      entityId: invoice.id,
      action: 'QUICKBOOKS_PAYMENT',
      actorId: actingUserId,
      metadata: { amount },
    });
  },

  trackSyncRecord(invoice: Invoice, provider: 'Stripe' | 'QuickBooks', status: 'Pending' | 'Synced' | 'Failed', reference?: string, payload?: Record<string, unknown>) {
    mockPaymentSyncRecords.push({
      id: createRecordId(),
      invoiceId: invoice.id,
      provider,
      status,
      reference,
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  getInvoiceOrThrow(invoiceId: string): Invoice {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  },
};
