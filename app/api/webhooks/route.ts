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

          // Note: We don't add credits here directly as we rely on the invoice.paid event
          // for both new subscriptions and renewals to avoid duplicate credit assignments
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
            // creditId: string,
            //   customerId: string,
            //   amount: number,
            //   currency: string
            await addCustomerCredit(
              paymentIntent as string,
              checkoutSession.customer as string,
              checkoutSession.amount_total as number,
              checkoutSession.currency as string
            );
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
        case 'payment_intent.created':
        case 'payment_intent.succeeded':
        case 'charge.succeeded':
          console.log(
            `Received event ${event.type} but no specific handler defined`
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
