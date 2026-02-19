type PaymentIntent = {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'requires_capture' | 'succeeded' | 'canceled';
  clientSecret: string;
  metadata?: Record<string, unknown>;
};

const createId = () => `pi_${Math.random().toString(36).slice(2, 10)}`;
const intents: PaymentIntent[] = [];

export const stripeService = {
  async createPaymentIntent(invoiceId: string, amount: number, currency = 'usd', metadata?: Record<string, unknown>): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: createId(),
      invoiceId,
      amount,
      currency,
      status: 'requires_capture',
      clientSecret: `${createId()}_secret`,
      metadata,
    };
    intents.push(intent);
    return intent;
  },

  async capturePayment(intentId: string): Promise<PaymentIntent> {
    const intent = intents.find((item) => item.id === intentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    intent.status = 'succeeded';
    return intent;
  },

  async retrievePaymentIntent(intentId: string): Promise<PaymentIntent | undefined> {
    return intents.find((item) => item.id === intentId);
  },

  async handleWebhook(event: { type: string; data: Record<string, any> }) {
    if (event.type === 'payment_intent.succeeded') {
      const intentId = event.data.id;
      const intent = intents.find((item) => item.id === intentId);
      if (intent) {
        intent.status = 'succeeded';
      }
      return intent;
    }
    return undefined;
  },
};
