import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import {
  upsertProductRecord,
  upsertPriceRecord,
  manageSubscriptionStatusChange,
  deleteProductRecord,
  deletePriceRecord,
  addCustomerCredit
} from '@/utils/supabase/admin';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid', // Add this event
  'payment_intent.created',
  'payment_intent.succeeded',
  'charge.succeeded'
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret)
      return new Response('Webhook secret not found.', { status: 400 });
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProductRecord(event.data.object as Stripe.Product);
          break;
        case 'price.created':
        case 'price.updated':
          await upsertPriceRecord(event.data.object as Stripe.Price);
          break;
        case 'price.deleted':
          await deletePriceRecord(event.data.object as Stripe.Price);
          break;
        case 'product.deleted':
          await deleteProductRecord(event.data.object as Stripe.Product);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          console.log(
            `Processing ${event.type} event for subscription ${subscription.id}`
          );

          // Handle subscription state change
          await manageSubscriptionStatusChange(
            subscription.id,
            subscription.customer as string,
            event.type === 'customer.subscription.created'
          );

          // For new subscriptions, fetch the latest invoice and process credits if needed
          if (event.type === 'customer.subscription.created') {
            try {
              console.log(`Fetching latest invoice for subscription ${subscription.id}`);
              const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
              
              if (latestInvoice.status === 'paid') {
                console.log(`Processing subscription invoice payment manually: ${latestInvoice.id} for subscription ${subscription.id}`);
                
                await addCustomerCredit(
                  latestInvoice.id,
                  subscription.customer as string,
                  latestInvoice.amount_paid,
                  latestInvoice.currency
                );
                
                console.log(`Successfully added ${latestInvoice.amount_paid} credits for customer ${subscription.customer} from subscription creation`);
              } else {
                console.log(`Latest invoice ${latestInvoice.id} for subscription ${subscription.id} is not paid (status: ${latestInvoice.status})`);
              }
            } catch (error) {
              console.error(`Failed to process latest invoice for new subscription ${subscription.id}: ${error}`);
              // Don't throw here - we've already updated the subscription status
            }
          }
          
          // We still rely on the invoice.paid event for renewals to avoid duplicate credit assignments
          break;
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            await manageSubscriptionStatusChange(
              subscriptionId as string,
              checkoutSession.customer as string,
              true
            );
          }
          if (checkoutSession.mode === 'payment') {
            const paymentIntent = checkoutSession.payment_intent;
            // Verify the payment status is paid
            if (checkoutSession.payment_status === 'paid') {
              console.log(`Processing checkout session payment: ${checkoutSession.id} with payment intent ${paymentIntent}`);
              
              try {
                // Add credits based on checkout session information
                await addCustomerCredit(
                  paymentIntent as string,
                  checkoutSession.customer as string,
                  checkoutSession.amount_total as number,
                  checkoutSession.currency as string
                );
                
                // Mark this payment intent as handled by checkout to avoid duplicate credits
                if (paymentIntent) {
                  await stripe.paymentIntents.update(paymentIntent as string, {
                    metadata: { handled_by_checkout: 'true' }
                  });
                  console.log(`Marked payment intent ${paymentIntent} as handled by checkout`);
                }
                
                console.log(`Successfully added credits for checkout session ${checkoutSession.id}`);
              } catch (error) {
                console.error(`Failed to add credits for checkout session: ${error}`);
                throw error; // Re-throw to trigger the error handling below
              }
            } else {
              console.log(`Skipping checkout session ${checkoutSession.id} - payment status is not 'paid' (status: ${checkoutSession.payment_status})`);
            }
          }
          break;
        case 'invoice.paid':
          const invoice = event.data.object as Stripe.Invoice;

          // Only process if this invoice is for a subscription
          if (invoice.subscription && invoice.status === 'paid') {
            console.log(
              `Processing subscription invoice payment: ${invoice.id} for subscription ${invoice.subscription}`
            );
            // Credit for subscriptions
            try {
              await addCustomerCredit(
                invoice.id, // Use invoice ID as the unique identifier
                invoice.customer as string,
                invoice.amount_paid,
                invoice.currency
              );
              console.log(
                `Successfully added ${invoice.amount_paid} credits for customer ${invoice.customer}`
              );
            } catch (error) {
              console.error(
                `Failed to add credits for subscription payment: ${error}`
              );
              throw error; // Re-throw to trigger the error handling below
            }
          } else {
            console.log(
              `Skipping invoice ${invoice.id} - not a paid subscription invoice`
            );
          }
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // Skip if this payment intent is for an invoice/subscription
          if (paymentIntent.invoice) {
            console.log(
              `Skipping payment intent ${paymentIntent.id} - associated with invoice ${paymentIntent.invoice} which will be handled by invoice.paid event`
            );
            break;
          }
          
          // Check if this payment intent is already associated with a checkout session
          // to avoid duplicate credits
          if (!paymentIntent.metadata?.handled_by_checkout) {
            console.log(
              `Processing direct payment intent: ${paymentIntent.id}, amount: ${paymentIntent.amount}, currency: ${paymentIntent.currency}`
            );
            
            try {
              // Make sure we have a customer to credit
              if (paymentIntent.customer) {
                await addCustomerCredit(
                  paymentIntent.id,
                  paymentIntent.customer as string,
                  paymentIntent.amount,
                  paymentIntent.currency
                );
                console.log(
                  `Successfully added credits for payment intent ${paymentIntent.id} to customer ${paymentIntent.customer}`
                );
              } else {
                console.warn(
                  `Payment intent ${paymentIntent.id} has no customer associated with it, cannot assign credits`
                );
              }
            } catch (error) {
              console.error(
                `Failed to add credits for payment intent: ${error}`
              );
              throw error; // Re-throw to trigger the error handling below
            }
          } else {
            console.log(
              `Skipping payment intent ${paymentIntent.id} - already handled by checkout session`
            );
          }
          break;
        case 'payment_intent.created':
          // Just log for monitoring purposes
          console.log(
            `Payment intent created: ${(event.data.object as Stripe.PaymentIntent).id}`
          );
          break;
        case 'charge.succeeded':
          // Charges are usually handled via payment_intent.succeeded or checkout.session.completed
          // but we log them for monitoring purposes
          console.log(
            `Charge succeeded: ${(event.data.object as Stripe.Charge).id} for payment intent ${(event.data.object as Stripe.Charge).payment_intent}`
          );
          break;
        default:
          console.warn(`Unhandled relevant event: ${event.type}`);
          break;
      }
    } catch (error) {
      console.log(error);
      return new Response(
        'Webhook handler failed. View your Next.js function logs.',
        {
          status: 400
        }
      );
    }
  } else {
    return new Response(`Unsupported event type: ${event.type}`, {
      status: 400
    });
  }
  return new Response(JSON.stringify({ received: true }));
}
