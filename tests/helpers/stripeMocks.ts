import Stripe from 'stripe';

/**
 * Creates a mock Stripe invoice object for testing
 */
export function createMockInvoice(props: {
  id: string;
  customer: string;
  subscription: string | null;
  status: string;
  amount_paid: number;
  currency: string;
}): Stripe.Invoice {
  const { id, customer, subscription, status, amount_paid, currency } = props;

  return {
    id,
    customer,
    subscription,
    status,
    amount_paid,
    currency,
    object: 'invoice',
    // Add other required Invoice properties with default values
    account_country: 'US',
    account_name: 'Test Account',
    application: null,
    application_fee_amount: null,
    attempt_count: 1,
    auto_advance: true,
    billing_reason: subscription ? 'subscription_cycle' : 'manual',
    charge: 'ch_123456',
    collection_method: 'charge_automatically',
    created: Math.floor(Date.now() / 1000),
    custom_fields: null,
    description: null,
    discount: null,
    due_date: null,
    ending_balance: 0,
    footer: null,
    hosted_invoice_url: 'https://example.com',
    invoice_pdf: 'https://example.com/pdf',
    last_finalization_error: null,
    lines: {
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/invoices/inv_123456/lines'
    },
    livemode: false,
    metadata: {},
    next_payment_attempt: null,
    number: 'INV12345',
    on_behalf_of: null,
    paid: status === 'paid',
    paid_out_of_band: false,
    payment_intent: 'pi_123456',
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null
    },
    period_end: Math.floor(Date.now() / 1000),
    period_start: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // 30 days ago
    post_payment_credit_notes_amount: 0,
    pre_payment_credit_notes_amount: 0,
    quote: null,
    receipt_number: null,
    rendering_options: null,
    starting_balance: 0,
    statement_descriptor: null,
    tax: null,
    test_clock: null,
    total: amount_paid,
    total_discount_amounts: [],
    total_tax_amounts: [],
    transfer_data: null,
    webhooks_delivered_at: null
  } as Stripe.Invoice;
}

/**
 * Creates a mock Stripe subscription object for testing
 */
export function createMockSubscription(props: {
  id: string;
  customer: string;
  status: string;
  price_id: string;
}): Stripe.Subscription {
  const { id, customer, status, price_id } = props;

  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    customer,
    status,
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    automatic_tax: { enabled: false },
    billing_cycle_anchor: now,
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    collection_method: 'charge_automatically',
    created: now - 60 * 60, // 1 hour ago
    current_period_end: now + 30 * 24 * 60 * 60, // 30 days from now
    current_period_start: now,
    days_until_due: null,
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    discount: null,
    ended_at: null,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_123456',
          object: 'subscription_item',
          billing_thresholds: null,
          created: now,
          metadata: {},
          price: {
            id: price_id,
            object: 'price',
            active: true,
            billing_scheme: 'per_unit',
            created: now,
            currency: 'usd',
            custom_unit_amount: null,
            livemode: false,
            lookup_key: null,
            metadata: {},
            nickname: null,
            product: 'prod_123456',
            recurring: {
              aggregate_usage: null,
              interval: 'month',
              interval_count: 1,
              usage_type: 'licensed'
            },
            tax_behavior: 'unspecified',
            tiers_mode: null,
            transform_quantity: null,
            type: 'recurring',
            unit_amount: 1900,
            unit_amount_decimal: '1900'
          },
          quantity: 1,
          subscription: id,
          tax_rates: []
        }
      ],
      has_more: false,
      url: `/v1/subscription_items?subscription=${id}`
    },
    latest_invoice: 'inv_123456',
    livemode: false,
    metadata: {},
    next_pending_invoice_item_invoice: null,
    pause_collection: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: 'off'
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    quantity: 1,
    schedule: null,
    start_date: now,
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_start: null
  } as Stripe.Subscription;
}

/**
 * Creates a mock Stripe event for testing
 */
export function createMockEvent<T>(type: string, data: T): Stripe.Event {
  return {
    id: `evt_${Math.random().toString(36).substring(2, 15)}`,
    object: 'event',
    api_version: '2022-11-15',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data as any
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null
    },
    type
  };
}
