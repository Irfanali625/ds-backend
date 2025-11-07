import { ObjectId } from "mongodb";

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}

export enum SubscriptionPlan {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDocument {
  _id: ObjectId;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionDto {
  userId: string;
  plan: SubscriptionPlan;
  startDate?: Date;
  endDate?: Date;
}

export class SubscriptionModel {
  static toEntity(doc: SubscriptionDocument): Subscription {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      plan: doc.plan,
      status: doc.status,
      startDate: doc.startDate.toISOString(),
      endDate: doc.endDate.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  static fromDto(
    dto: CreateSubscriptionDto
  ): Omit<SubscriptionDocument, "_id" | "createdAt" | "updatedAt"> {
    const now = new Date();
    const startDate = dto.startDate || now;
    const endDate =
      dto.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      userId: dto.userId,
      plan: dto.plan,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
    };
  }
}
