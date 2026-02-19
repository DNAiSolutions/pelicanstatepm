type QuickBooksInvoice = {
  id: string;
  invoiceId: string;
  customerName: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Paid';
  syncToken: number;
};

type QuickBooksPayment = {
  id: string;
  invoiceId: string;
  amount: number;
  reference?: string;
  createdAt: string;
};

const invoices: QuickBooksInvoice[] = [];
const payments: QuickBooksPayment[] = [];

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const quickbooksService = {
  async pushInvoice(invoiceId: string, payload: { customerName: string; amount: number }): Promise<QuickBooksInvoice> {
    const record: QuickBooksInvoice = {
      id: createId('qbo'),
      invoiceId,
      customerName: payload.customerName,
      amount: payload.amount,
      status: 'Submitted',
      syncToken: 1,
    };
    invoices.push(record);
    return record;
  },

  async recordPayment(invoiceId: string, amount: number): Promise<QuickBooksPayment> {
    const payment: QuickBooksPayment = {
      id: createId('qbo-pay'),
      invoiceId,
      amount,
      reference: `QB-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    payments.push(payment);
    const invoice = invoices.find((item) => item.invoiceId === invoiceId);
    if (invoice) {
      invoice.status = 'Paid';
      invoice.syncToken += 1;
    }
    return payment;
  },

  listInvoices(): QuickBooksInvoice[] {
    return invoices;
  },

  listPayments(): QuickBooksPayment[] {
    return payments;
  },
};
