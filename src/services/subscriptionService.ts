import { subscriptionRepository } from "../repository/subscriptionRepository";
import { paymentRepository } from "../repository/paymentRepository";
import { SubscriptionPlan, SubscriptionStatus } from "../models/Subscription";
import { PaymentStatus, PaymentMethod } from "../models/Payment";
import { getDB } from "../database/db";

export const FREE_TIER_LIMIT = 5;
export const PREMIUM_PRICE = 19.99;

export interface ValidationLimit {
  canValidate: boolean;
  remainingFree: number;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string;
  limitType: 'free' | 'premium' | 'exceeded';
  message?: string;
}

export interface UserUsage {
  freeValidationsUsed: number;
  freeValidationsRemaining: number;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string;
  subscriptionPlan?: SubscriptionPlan;
}

export class SubscriptionService {
 
  static async getValidationLimit(userId: string): Promise<ValidationLimit> {
    const activeSubscription = await subscriptionRepository.findActiveByUserId(userId);
    
    if (activeSubscription && activeSubscription.status === SubscriptionStatus.ACTIVE) {
      const endDate = new Date(activeSubscription.endDate);
      const now = new Date();
      
      if (endDate > now) {
        return {
          canValidate: true,
          remainingFree: 0,
          hasActiveSubscription: true,
          subscriptionEndDate: activeSubscription.endDate,
          limitType: 'premium',
        };
      }
    }

    const usage = await this.getUserUsage(userId);
    
    if (usage.freeValidationsRemaining > 0) {
      return {
        canValidate: true,
        remainingFree: usage.freeValidationsRemaining,
        hasActiveSubscription: false,
        limitType: 'free',
      };
    }

    return {
      canValidate: false,
      remainingFree: 0,
      hasActiveSubscription: false,
      limitType: 'exceeded',
      message: 'Free tier limit reached. Please upgrade to continue.',
    };
  }

  static async getUserUsage(userId: string): Promise<UserUsage> {
    const activeSubscription = await subscriptionRepository.findActiveByUserId(userId);
    
    const freeValidationsUsed = activeSubscription 
      ? 0
      : await this.countFreeValidations(userId);

    const freeValidationsRemaining = Math.max(0, FREE_TIER_LIMIT - freeValidationsUsed);

    return {
      freeValidationsUsed,
      freeValidationsRemaining,
      hasActiveSubscription: !!activeSubscription,
      subscriptionEndDate: activeSubscription?.endDate,
      subscriptionPlan: activeSubscription?.plan,
    };
  }

  private static async countFreeValidations(userId: string): Promise<number> {
    try {
      const db = getDB();
      const histories = await db.collection("validation_histories").find({
        userId,
        type: { $in: ['single', 'bulk', 'csv'] }
      }).toArray();
      
      const totalValidations = histories.reduce((sum, history) => {
        return sum + (history.total || 0);
      }, 0);
      
      return totalValidations;
    } catch (error) {
      console.error('Error counting free validations:', error);
      return 0;
    }
  }

  static async createPremiumSubscriptionForPayment({
    userId,
    paymentId,
    paymentMethod,
  }: {
    userId: string;
    paymentId: string;
    paymentMethod: PaymentMethod;
  }): Promise<{ subscription: any; payment: any }> {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await subscriptionRepository.create({
      userId,
      plan: SubscriptionPlan.PREMIUM,
      startDate: now,
      endDate,
    });

    const payment = await paymentRepository.updateSubscription(paymentId, subscription.id);

    if (!payment) {
      throw new Error(`Failed to update payment ${paymentId} with subscription information`);
    }

    return { subscription, payment };
  }

  static async createPremiumSubscription(
    userId: string,
    paymentMethod: PaymentMethod = PaymentMethod.MANUAL
  ): Promise<{ subscription: any; payment: any }> {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await subscriptionRepository.create({
      userId,
      plan: SubscriptionPlan.PREMIUM,
      startDate: now,
      endDate,
    });

    const payment = await paymentRepository.create({
      userId,
      subscriptionId: subscription.id,
      amount: PREMIUM_PRICE,
      currency: 'USD',
      method: paymentMethod,
      status: PaymentStatus.COMPLETED,
    });

    return { subscription, payment };
  }

  static async canUserValidate(userId: string): Promise<boolean> {
    const limit = await this.getValidationLimit(userId);
    return limit.canValidate;
  }

  static async incrementValidationCount(userId: string): Promise<void> {
  }

  static async expireOldSubscriptions(): Promise<number> {
    return await subscriptionRepository.expireOldSubscriptions();
  }
}

