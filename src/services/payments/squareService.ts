import { Client, Environment } from "square";
import crypto from "crypto";
import { PaymentMethod, PaymentStatus } from "../../models/Payment";
import { paymentRepository } from "../../repository/paymentRepository";
import { SubscriptionService } from "../subscriptionService";

const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareLocationId = process.env.SQUARE_LOCATION_ID;
const squareEnvironment = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
const squareWebhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

if (!squareAccessToken || !squareLocationId) {
  console.warn("Square configuration missing (SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID). Square payments will be unavailable.");
}

export const squareClient = squareAccessToken
  ? new Client({
      accessToken: squareAccessToken,
      environment: squareEnvironment === "production" ? Environment.Production : Environment.Sandbox,
    })
  : null;

const SQUARE_PRODUCT_NAME = process.env.SQUARE_PRODUCT_NAME || "Premium Subscription";
const SQUARE_CURRENCY = process.env.SQUARE_CURRENCY || "USD";

interface CreateSquareCheckoutParams {
  userId: string;
  successUrl: string;
  cancelUrl?: string;
  amountCents: number;
}

interface CreateSquareCheckoutResult {
  url: string;
  paymentId: string;
  paymentLinkId: string;
}

export async function createSquareCheckoutLink({
  userId,
  successUrl,
  cancelUrl,
  amountCents,
}: CreateSquareCheckoutParams): Promise<CreateSquareCheckoutResult> {
  if (!squareClient) {
    throw new Error("Square client not configured");
  }

  // Create payment record in pending state
  const payment = await paymentRepository.create({
    userId,
    amount: amountCents / 100,
    currency: SQUARE_CURRENCY,
    method: PaymentMethod.SQUARE,
    status: PaymentStatus.PENDING,
  });

  const idempotencyKey = `square-${payment.id}-${Date.now()}`;

  const requestBody: any = {
    idempotencyKey,
    checkoutOptions: {
      redirectUrl: successUrl,
    },
    order: {
      locationId: squareLocationId!,
      metadata: {
        paymentId: payment.id,
        userId,
      },
      lineItems: [
        {
          name: SQUARE_PRODUCT_NAME,
          quantity: "1",
          basePriceMoney: {
            amount: BigInt(amountCents),
            currency: SQUARE_CURRENCY,
          },
        },
      ],
    },
  };

  if (cancelUrl) {
    requestBody.checkoutOptions.cancellationUrl = cancelUrl;
  }

  const response = await squareClient.checkoutApi.createPaymentLink(requestBody as any);

  const link = response.result.paymentLink;
  if (!link?.url) {
    throw new Error("Failed to create Square payment link");
  }

  await paymentRepository.updateMetadata(payment.id, {
    provider: PaymentMethod.SQUARE,
    squarePaymentLinkId: link.id,
    orderId: link.orderId,
  });

  return {
    url: link.url,
    paymentId: payment.id,
    paymentLinkId: link.id!,
  };
}

interface SquareWebhookEvent {
  type: string;
  data: {
    id: string;
    object: {
      payment?: {
        id: string;
        status?: string;
        orderId?: string;
      };
    };
  };
}

interface SquareWebhookParams {
  rawBody: Buffer;
  signature: string | undefined;
  url: string;
}

export async function handleSquareWebhook({ rawBody, signature, url }: SquareWebhookParams) {
  if (!squareClient) {
    throw new Error("Square client not configured");
  }
  if (!squareWebhookSignatureKey) {
    throw new Error("SQUARE_WEBHOOK_SIGNATURE_KEY is not configured");
  }

  if (!signature) {
    throw new Error("Missing Square webhook signature");
  }

  const hmac = crypto.createHmac("sha256", squareWebhookSignatureKey);
  hmac.update(url + rawBody.toString());
  const expectedSignature = hmac.digest("base64");

  if (expectedSignature !== signature) {
    throw new Error("Invalid Square webhook signature");
  }

  const event = JSON.parse(rawBody.toString()) as SquareWebhookEvent;

  switch (event.type) {
    case "payment.updated":
    case "payment.created": {
      const paymentObject = event.data.object.payment;
      if (!paymentObject) return;

      const orderId = paymentObject.orderId;
      if (!orderId) return;

      const orderResponse = await squareClient.ordersApi.retrieveOrder(orderId);
      const order = orderResponse.result.order;
      const metadataPaymentId = order?.metadata?.paymentId;
      const metadataUserId = order?.metadata?.userId;

      if (!metadataPaymentId || !metadataUserId) {
        console.error("Square webhook missing metadata for order", orderId);
        return;
      }

      // Only complete on completed payments
      if (paymentObject.status !== "COMPLETED") {
        return;
      }

      const updatedPayment = await paymentRepository.updateStatus(
        metadataPaymentId,
        PaymentStatus.COMPLETED,
        paymentObject.id
      );

      if (!updatedPayment) {
        console.error("Square webhook: payment not found", metadataPaymentId);
        return;
      }

      if (updatedPayment.subscriptionId) {
        return;
      }

      await SubscriptionService.createPremiumSubscriptionForPayment({
        userId: metadataUserId,
        paymentId: metadataPaymentId,
        paymentMethod: PaymentMethod.SQUARE,
      });
      break;
    }
    default:
      break;
  }
}

