import { ObjectId } from 'mongodb';
import { UserRecord, ContactPhase } from '../types';
import { getDB } from '../database/db';

export class UserRecordRepository {
  private getCollection() {
    return getDB().collection('user_records');
  }

  async create(userId: string, contactId: string, phase: ContactPhase): Promise<UserRecord> {
    const now = new Date();
    const record = {
      userId,
      contactId: new ObjectId(contactId),
      phase,
      deliveredAt: now,
      createdAt: now,
    };

    const result = await this.getCollection().insertOne(record);
    return this.mapDocumentToUserRecord({ ...record, _id: result.insertedId });
  }

  async findById(id: string): Promise<UserRecord | null> {
    try {
      const record = await this.getCollection().findOne({ _id: new ObjectId(id) });
      return record ? this.mapDocumentToUserRecord(record) : null;
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<UserRecord[]> {
    const records = await this.getCollection()
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return records.map(record => this.mapDocumentToUserRecord(record));
  }

  async findByContactId(contactId: string): Promise<UserRecord[]> {
    const records = await this.getCollection()
      .find({ contactId: new ObjectId(contactId) })
      .sort({ createdAt: -1 })
      .toArray();
    return records.map(record => this.mapDocumentToUserRecord(record));
  }

  private mapDocumentToUserRecord(doc: any): UserRecord {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      contactId: doc.contactId?.toString() || doc.contactId,
      phase: doc.phase,
      deliveredAt: doc.deliveredAt?.toISOString() || new Date().toISOString(),
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    };
  }
}

export const userRecordRepository = new UserRecordRepository();
