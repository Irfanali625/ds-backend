import { ObjectId } from "mongodb";
import { getDB } from "../database/db";
import { Subscription, SubscriptionDocument, CreateSubscriptionDto, SubscriptionStatus, SubscriptionPlan } from "../models/Subscription";
import { SubscriptionModel } from "../models/Subscription";

export class SubscriptionRepository {
  private getCollection() {
    return getDB().collection<SubscriptionDocument>("subscriptions");
  }

  async create(data: CreateSubscriptionDto): Promise<Subscription> {
    const now = new Date();
    const doc = SubscriptionModel.fromDto(data);
    
    const subscription: SubscriptionDocument = {
      _id: new ObjectId(),
      ...doc,
      createdAt: now,
      updatedAt: now,
    };

    await this.getCollection().insertOne(subscription);
    return SubscriptionModel.toEntity(subscription);
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    try {
      const now = new Date();
      const doc = await this.getCollection().findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: now },
      }, {
        sort: { createdAt: -1 }
      });

      return doc ? SubscriptionModel.toEntity(doc) : null;
    } catch (error) {
      console.error('Error finding active subscription:', error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    try {
      const cursor = this.getCollection()
        .find({ userId })
        .sort({ createdAt: -1 });
      const docs = await cursor.toArray();
      return docs.map((doc) => SubscriptionModel.toEntity(doc));
    } catch (error) {
      console.error('Error finding subscriptions by user ID:', error);
      return [];
    }
  }

  async findById(id: string): Promise<Subscription | null> {
    try {
      const doc = await this.getCollection().findOne({ _id: new ObjectId(id) });
      return doc ? SubscriptionModel.toEntity(doc) : null;
    } catch {
      return null;
    }
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription | null> {
    try {
      const result = await this.getCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      return result ? SubscriptionModel.toEntity(result) : null;
    } catch {
      return null;
    }
  }

  async expireOldSubscriptions(): Promise<number> {
    const now = new Date();
    const result = await this.getCollection().updateMany(
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lte: now }
      },
      {
        $set: {
          status: SubscriptionStatus.EXPIRED,
          updatedAt: now
        }
      }
    );

    return result.modifiedCount;
  }
}

export const subscriptionRepository = new SubscriptionRepository();

