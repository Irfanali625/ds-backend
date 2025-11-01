import { ObjectId } from 'mongodb';
import { ContactPhase, UserRecord as UserRecordEntity } from '../types';

export interface UserRecordDocument {
  _id: ObjectId;
  userId: string;
  contactId: ObjectId;
  phase: ContactPhase;
  deliveredAt: Date;
  createdAt: Date;
}

export class UserRecordModel {
  static toEntity(doc: UserRecordDocument): UserRecordEntity {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      contactId: doc.contactId.toString(),
      phase: doc.phase,
      deliveredAt: doc.deliveredAt.toISOString(),
      createdAt: doc.createdAt.toISOString(),
    };
  }

  static fromData(
    userId: string,
    contactId: string,
    phase: ContactPhase,
    deliveredAt: Date
  ): Omit<UserRecordDocument, '_id' | 'createdAt'> {
    return {
      userId,
      contactId: new ObjectId(contactId),
      phase,
      deliveredAt,
    };
  }
}

