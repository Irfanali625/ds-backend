import Stripe from "stripe";
import { PaymentMethod, PaymentStatus } from "../../models/Payment";
import { paymentRepository } from "../../repository/paymentRepository";
import { SubscriptionService } from "../subscriptionService";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn(
    "STRIPE_SECRET_KEY is not set. Stripe payments will be unavailable."
  );
}

export const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2022-11-15",
    })
  : null;

const DEFAULT_CURRENCY = process.env.STRIPE_CURRENCY || "usd";
const STRIPE_PRODUCT_NAME =
  process.env.STRIPE_PRODUCT_NAME || "Premium Subscription";

interface CreateStripeCheckoutParams {
  userId: string;
  successUrl: string;
  cancelUrl: string;
  amountCents: number;
}

interface CreateStripeCheckoutResult {
  url: string;
  sessionId: string;
  paymentId: string;
}

export async function createStripeCheckoutSession({
  userId,
  successUrl,
  cancelUrl,
  amountCents,
}: CreateStripeCheckoutParams): Promise<CreateStripeCheckoutResult> {
  if (!stripeClient) {
    throw new Error("Stripe client not configured");
  }

  // Create payment record in pending state
  const payment = await paymentRepository.create({
    userId,
    amount: amountCents / 100,
    currency: DEFAULT_CURRENCY.toUpperCase(),
    method: PaymentMethod.STRIPE,
    status: PaymentStatus.PENDING,
  });

  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    metadata: {
      userId,
      paymentId: payment.id,
    },
    line_items: [
      {
        price_data: {
          currency: DEFAULT_CURRENCY,
          unit_amount: amountCents,
          product_data: {
            name: STRIPE_PRODUCT_NAME,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  await paymentRepository.updateMetadata(payment.id, {
    provider: PaymentMethod.STRIPE,
    stripeSessionId: session.id,
  });

  return {
    url: session.url as string,
    sessionId: session.id,
    paymentId: payment.id,
  };
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string | undefined
) {
  if (!stripeClient) {
    throw new Error("Stripe client not configured");
  }
  if (!stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  if (!signature) {
    throw new Error("Missing Stripe-Signature header");
  }

  const event = stripeClient.webhooks.constructEvent(
    rawBody,
    signature,
    stripeWebhookSecret
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      const userId = session.metadata?.userId;

      if (!paymentId || !userId) {
        console.error("Stripe webhook missing metadata", session.id);
        return;
      }

      // Update payment status
      const updatedPayment = await paymentRepository.updateStatus(
        paymentId,
        PaymentStatus.COMPLETED,
        session.payment_intent?.toString()
      );

      if (!updatedPayment) {
        console.error("Stripe webhook: payment not found", paymentId);
        return;
      }

      // If payment was already completed, skip
      if (updatedPayment.subscriptionId) {
        return;
      }

      // Create subscription for the user
      await SubscriptionService.createPremiumSubscriptionForPayment({
        userId,
        paymentId,
        paymentMethod: PaymentMethod.STRIPE,
      });
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await paymentRepository.updateStatus(paymentId, PaymentStatus.FAILED);
      }
      break;
    }
    default:
      // Ignore other events for now
      break;
  }
}
