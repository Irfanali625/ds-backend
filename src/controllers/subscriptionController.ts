import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SubscriptionService, PREMIUM_PRICE } from '../services/subscriptionService';
import { subscriptionRepository } from '../repository/subscriptionRepository';
import { paymentRepository } from '../repository/paymentRepository';
import { PaymentMethod } from '../models/Payment';
import { createStripeCheckoutSession } from '../services/payments/stripeService';
import { createSquareCheckoutLink } from '../services/payments/squareService';

export class SubscriptionController {
  async getStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req!.user!.id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'User not authenticated',
        });
      }

      const usage = await SubscriptionService.getUserUsage(userId);
      const limit = await SubscriptionService.getValidationLimit(userId);

      res.json({
        usage,
        limit,
        premiumPrice: PREMIUM_PRICE,
      });
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Failed to fetch subscription status',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  async createCheckout(req: AuthRequest, res: Response) {
    try {
      const userId = req!.user!.id;
      const { provider, successUrl, cancelUrl } = req.body;

      if (!provider || !successUrl) {
        return res.status(400).json({
          error: 'Provider and successUrl are required',
        });
      }

      const activeSubscription = await subscriptionRepository.findActiveByUserId(userId);
      if (activeSubscription) {
        return res.status(400).json({
          error: 'You already have an active subscription',
          subscription: activeSubscription,
        });
      }

      const amountCents = Math.round(PREMIUM_PRICE * 100);

      switch (provider.toLowerCase()) {
        case 'stripe': {
          const session = await createStripeCheckoutSession({
            userId,
            successUrl,
            cancelUrl: cancelUrl || successUrl,
            amountCents,
          });

          return res.json({
            provider: PaymentMethod.STRIPE,
            checkoutUrl: session.url,
            paymentId: session.paymentId,
          });
        }
        case 'square': {
          const link = await createSquareCheckoutLink({
            userId,
            successUrl,
            cancelUrl,
            amountCents,
          });

          return res.json({
            provider: PaymentMethod.SQUARE,
            checkoutUrl: link.url,
            paymentId: link.paymentId,
            paymentLinkId: link.paymentLinkId,
          });
        }
        default:
          return res.status(400).json({
            error: 'Unsupported payment provider',
          });
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        details: error.message,
      });
    }
  }

  async createSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req!.user!.id;
      
      const activeSubscription = await subscriptionRepository.findActiveByUserId(userId);
      if (activeSubscription) {
        return res.status(400).json({
          error: 'You already have an active subscription',
          subscription: activeSubscription,
        });
      }

      const { subscription, payment } = await SubscriptionService.createPremiumSubscription(
        userId,
        PaymentMethod.MANUAL
      );

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        subscription,
        payment,
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        error: 'Failed to create subscription',
        details: error.message,
      });
    }
  }

  async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req!.user!.id;
      
      const subscriptions = await subscriptionRepository.findByUserId(userId);
      const payments = await paymentRepository.findByUserId(userId);

      res.json({
        subscriptions,
        payments,
      });
    } catch (error: any) {
      console.error('Error fetching subscription history:', error);
      res.status(500).json({
        error: 'Failed to fetch subscription history',
        details: error.message,
      });
    }
  }
}

