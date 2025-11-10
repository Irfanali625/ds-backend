import { ObjectId } from "mongodb";

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  SQUARE = 'SQUARE',
  MANUAL = 'MANUAL'
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDocument {
  _id: ObjectId;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDto {
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export class PaymentModel {
  static toEntity(doc: PaymentDocument): Payment {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      subscriptionId: doc.subscriptionId,
      amount: doc.amount,
      currency: doc.currency,
      status: doc.status,
      method: doc.method,
      transactionId: doc.transactionId,
      metadata: doc.metadata,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  static fromDto(dto: CreatePaymentDto): Omit<PaymentDocument, "_id" | "createdAt" | "updatedAt"> {
    const now = new Date();
    return {
      userId: dto.userId,
      subscriptionId: dto.subscriptionId,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      status: dto.status || PaymentStatus.PENDING,
      method: dto.method || PaymentMethod.MANUAL,
      transactionId: dto.transactionId,
      metadata: dto.metadata,
    };
  }
}

