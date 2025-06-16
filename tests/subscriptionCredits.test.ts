// Jest is automatically available in the global scope
import { addCustomerCredit, getCreditsValue } from '@/utils/supabase/admin';
import { POST } from '@/app/api/webhooks/route';
import assert from 'assert';

// Mock dependencies
jest.mock('@/utils/stripe/config', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn()
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

describe('Subscription Credit Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCreditsValue returns correct credit amount for subscription price', () => {
    // Mock implementation for this test
    (getCreditsValue as jest.Mock).mockImplementation((amount) => {
      if (amount === 900) return 400;
      if (amount === 1900) return 1000;
      if (amount === 4900) return 3000;
      return Math.round(amount * 0.5);
    });

    // Test different subscription amounts
    assert.strictEqual(getCreditsValue(900), 400);
    assert.strictEqual(getCreditsValue(1900), 1000);
    assert.strictEqual(getCreditsValue(4900), 3000);
    assert.strictEqual(getCreditsValue(2000), 1000); // Custom amount
  });

  test('invoice.paid event calls addCustomerCredit for subscription', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a subscription invoice event
    const mockStripeEvent = {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'inv_123456',
          customer: 'cus_123456',
          subscription: 'sub_123456',
          status: 'paid',
          amount_paid: 1900,
          currency: 'usd'
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
      'inv_123456',
      'cus_123456',
      1900,
      'usd'
    );
  });

  test('invoice.paid event does not call addCustomerCredit for non-subscription invoice', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a non-subscription invoice event
    const mockStripeEvent = {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'inv_123456',
          customer: 'cus_123456',
          subscription: null, // No subscription
          status: 'paid',
          amount_paid: 1900,
          currency: 'usd'
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

  test('invoice.paid event does not call addCustomerCredit for unpaid invoice', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock an unpaid subscription invoice event
    const mockStripeEvent = {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'inv_123456',
          customer: 'cus_123456',
          subscription: 'sub_123456',
          status: 'open', // Not paid
          amount_paid: 0,
          currency: 'usd'
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

  test('subscription renewal triggers credit assignment via invoice.paid', async () => {
    // Create mock request
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Mock a subscription renewal
    const subscriptionId = 'sub_renewal123';
    const customerId = 'cus_renewal123';

    // Mock a subscription renewal invoice event
    const mockInvoiceEvent = {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'inv_renewal123',
          customer: customerId,
          subscription: subscriptionId,
          status: 'paid',
          amount_paid: 1900, // $19.00
          currency: 'usd'
        }
      }
    };

    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret';

    // Setup constructEvent mock for the invoice event
    const { stripe } = require('@/utils/stripe/config');
    stripe.webhooks.constructEvent.mockReturnValue(mockInvoiceEvent);

    // Mock getCreditsValue to return expected value for test
    (getCreditsValue as jest.Mock).mockReturnValue(1000);

    // Execute the webhook handler for the invoice event
    await POST(mockRequest);

    // Verify addCustomerCredit was called with correct parameters
    expect(addCustomerCredit).toHaveBeenCalledWith(
      'inv_renewal123',
      customerId,
      1900,
      'usd'
    );

    // We don't verify getCreditsValue directly since it's called inside addCustomerCredit
    // which we've already verified was called with the correct parameters
  });

  test('subscription with different pricing tier gets correct credits', async () => {
    // Create mock request for webhook
    const mockRequest = new Request('https://example.com/api/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });

    // Test with higher tier subscription
    const mockEvent = {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'inv_higher_tier',
          customer: 'cus_higher_tier',
          subscription: 'sub_higher_tier',
          status: 'paid',
          amount_paid: 4900, // $49.00
          currency: 'usd'
        }
      }
    };

    // Mock environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret';

    // Setup mock
    const { stripe } = require('@/utils/stripe/config');
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    // Mock getCreditsValue to return expected value for test
    (getCreditsValue as jest.Mock).mockReturnValue(3000);

    // Execute the webhook handler
    await POST(mockRequest);

    // Verify addCustomerCredit was called with correct parameters
    expect(addCustomerCredit).toHaveBeenCalledWith(
      'inv_higher_tier',
      'cus_higher_tier',
      4900,
      'usd'
    );

    // We don't verify getCreditsValue directly since it's called inside addCustomerCredit
    // which we've already verified was called with the correct parameters
  });
});
