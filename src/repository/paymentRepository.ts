import { ObjectId } from "mongodb";
import { getDB } from "../database/db";
import { Payment, PaymentDocument, CreatePaymentDto, PaymentStatus } from "../models/Payment";
import { PaymentModel } from "../models/Payment";

export class PaymentRepository {
  private getCollection() {
    return getDB().collection<PaymentDocument>("payments");
  }

  async create(data: CreatePaymentDto): Promise<Payment> {
    const now = new Date();
    const doc = PaymentModel.fromDto(data);
    
    const payment: PaymentDocument = {
      _id: new ObjectId(),
      ...doc,
      createdAt: now,
      updatedAt: now,
    };

    await this.getCollection().insertOne(payment);
    return PaymentModel.toEntity(payment);
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    try {
      const cursor = this.getCollection()
        .find({ userId })
        .sort({ createdAt: -1 });
      const docs = await cursor.toArray();
      return docs.map((doc) => PaymentModel.toEntity(doc));
    } catch (error) {
      console.error('Error finding payments by user ID:', error);
      return [];
    }
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
    const cursor = this.getCollection()
      .find({ subscriptionId })
      .sort({ createdAt: -1 });
    const docs = await cursor.toArray();
    return docs.map((doc) => PaymentModel.toEntity(doc));
  }

  async findById(id: string): Promise<Payment | null> {
    try {
      const doc = await this.getCollection().findOne({ _id: new ObjectId(id) });
      return doc ? PaymentModel.toEntity(doc) : null;
    } catch {
      return null;
    }
  }

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<Payment | null> {
    try {
      const update: any = {
        status,
        updatedAt: new Date()
      };
      if (transactionId) {
        update.transactionId = transactionId;
      }

      const result = await this.getCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update },
        { returnDocument: 'after' }
      );

      return result ? PaymentModel.toEntity(result) : null;
    } catch {
      return null;
    }
  }
}

export const paymentRepository = new PaymentRepository();

