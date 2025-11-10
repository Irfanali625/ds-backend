import { Request, Response } from "express";
import { handleStripeWebhook } from "../services/payments/stripeService";
import { handleSquareWebhook } from "../services/payments/squareService";

export class WebhookController {
  async stripe(req: Request, res: Response) {
    try {
      const signature = req.headers["stripe-signature"] as string | undefined;
      const rawBody = req.body as Buffer;

      await handleStripeWebhook(rawBody, signature);

      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ error: error.message || "Invalid Stripe webhook" });
    }
  }

  async square(req: Request, res: Response) {
    try {
      const signature = req.headers["x-square-hmacsha256-signature"] as string | undefined;
      const rawBody = req.body as Buffer;
      const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

      await handleSquareWebhook({ rawBody, signature, url });

      res.json({ received: true });
    } catch (error: any) {
      console.error("Square webhook error:", error);
      res.status(400).json({ error: error.message || "Invalid Square webhook" });
    }
  }
}

