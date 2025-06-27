// Jest is automatically available in the global scope
import { addCustomerCredit, getCreditsValue } from '@/utils/supabase/admin';
import { POST } from '@/app/api/webhooks/route';
import assert from 'assert';

// Mock dependencies
jest.mock('@/utils/stripe/config', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn()
    },
    paymentIntents: {
      update: jest.fn().mockResolvedValue({})
    }
  }
}));

jest.mock('@/utils/supabase/admin', () => ({
  upsertProductRecord: jest.fn(),
  upsertPriceRecord: jest.fn(),
  manageSubscriptionStatusChange: jest.fn(),
  deleteProductRecord: jest.fn(),
  deletePriceRecord: jest.fn(),
  addCustomerCredit: jest.fn(),
  getCreditsValue: jest.fn()
}));

describe('Payment Intent Credit Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('payment_intent.succeeded calls addCustomerCredit with correct parameters', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a payment intent event
    const mockStripeEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123456',
          object: 'payment_intent',
          amount: 1900,
          currency: 'usd',
          customer: 'cus_123456',
          metadata: {},
          invoice: null // Explicitly set invoice to null to match our new condition
        }
      }
    };

    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret';

    // Setup constructEvent mock
    const { stripe } = require('@/utils/stripe/config');
    stripe.webhooks.constructEvent.mockReturnValue(mockStripeEvent);

    // Execute the webhook handler
    await POST(mockRequest);

    // Verify addCustomerCredit was called with correct parameters
    expect(addCustomerCredit).toHaveBeenCalledWith(
      'pi_123456',
      'cus_123456',
      1900,
      'usd'
    );
  });

  test('payment_intent.succeeded does not call addCustomerCredit when already handled by checkout', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a payment intent event that was already handled by checkout
    const mockStripeEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123456',
          object: 'payment_intent',
          amount: 1900,
          currency: 'usd',
          customer: 'cus_123456',
          metadata: {
            handled_by_checkout: 'true'
          }
        }
      }
    };

    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret';

    // Setup constructEvent mock
    const { stripe } = require('@/utils/stripe/config');
    stripe.webhooks.constructEvent.mockReturnValue(mockStripeEvent);

    // Execute the webhook handler
    await POST(mockRequest);

    // Verify addCustomerCredit was not called
    expect(addCustomerCredit).not.toHaveBeenCalled();
  });

  test('payment_intent.succeeded does not call addCustomerCredit when no customer is associated', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a payment intent event with no customer
    const mockStripeEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123456',
          object: 'payment_intent',
          amount: 1900,
          currency: 'usd',
          customer: null,
          metadata: {}
        }
      }
    };

    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret';

    // Setup constructEvent mock
    const { stripe } = require('@/utils/stripe/config');
    stripe.webhooks.constructEvent.mockReturnValue(mockStripeEvent);

    // Execute the webhook handler
    await POST(mockRequest);

    // Verify addCustomerCredit was not called
    expect(addCustomerCredit).not.toHaveBeenCalled();
  });

  test('checkout.session.completed marks payment intent as handled', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a checkout session completed event
    const mockStripeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123456',
          object: 'checkout.session',
          mode: 'payment',
          payment_intent: 'pi_123456',
          customer: 'cus_123456',
          amount_total: 1900,
          currency: 'usd',
          payment_status: 'paid' // Add this field to match new requirement
        }
      }
    };

    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret';

    // Setup constructEvent mock
    const { stripe } = require('@/utils/stripe/config');
    stripe.webhooks.constructEvent.mockReturnValue(mockStripeEvent);

    // Execute the webhook handler
    await POST(mockRequest);

    // Verify addCustomerCredit was called with the correct parameters
    expect(addCustomerCredit).toHaveBeenCalledWith(
      'pi_123456',
      'cus_123456',
      1900,
      'usd'
    );

    // Verify payment intent was marked as handled
    expect(stripe.paymentIntents.update).toHaveBeenCalledWith('pi_123456', {
      metadata: { handled_by_checkout: 'true' }
    });
  });

  test('checkout.session.completed for subscription does not add credits directly', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a checkout session completed event for a subscription
    const mockStripeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123456',
          object: 'checkout.session',
          mode: 'subscription',
          subscription: 'sub_123456',
          customer: 'cus_123456'
        }
      }
    };

    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret';

    // Setup constructEvent mock
    const { stripe } = require('@/utils/stripe/config');
    stripe.webhooks.constructEvent.mockReturnValue(mockStripeEvent);

    // Execute the webhook handler
    await POST(mockRequest);

    // Verify manageSubscriptionStatusChange was called
    const {
      manageSubscriptionStatusChange
    } = require('@/utils/supabase/admin');
    expect(manageSubscriptionStatusChange).toHaveBeenCalledWith(
      'sub_123456',
      'cus_123456',
      true
    );

    // Verify addCustomerCredit was not called
    expect(addCustomerCredit).not.toHaveBeenCalled();
  });
});
